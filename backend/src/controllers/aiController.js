const { GoogleGenerativeAI } = require('@google/generative-ai');

const Chat = require('../models/Chat');

const SYSTEM_INSTRUCTION =
  'You are a defence career expert. Help students understand how to join Indian Army, Navy, Air Force. Provide structured answers including eligibility, exams, preparation tips. IMPORTANT: avoid Markdown symbols (no **bold**, no # headings, no ---). Use simple plain-text headings like Overview:, Eligibility:, Age:, Steps to Apply:, Preparation Tips:.';

function getTextFromGemini(result) {
  const text = result && result.response && typeof result.response.text === 'function' ? result.response.text() : '';
  return String(text || '').trim();
}

function normalizeModelName(name) {
  const n = String(name || '').trim();
  if (!n) return '';
  return n.startsWith('models/') ? n.slice('models/'.length) : n;
}

function isModelNotFoundError(err) {
  const msg = String(err && err.message ? err.message : err || '').toLowerCase();
  return msg.includes('404') || msg.includes('not found') || msg.includes('no longer available');
}

async function listGenerateContentModels(apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`ListModels failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const json = await res.json().catch(() => ({}));
  const models = Array.isArray(json.models) ? json.models : [];
  return models
    .filter((m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
    .map((m) => normalizeModelName(m.name))
    .filter(Boolean);
}

function buildCandidateModels(envModel, available) {
  const normalizedEnvModel = normalizeModelName(envModel);

  const preferred = [
    'gemini-3-flash-preview',
    'gemini-3-pro-preview',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-flash-latest',
    'gemini-pro-latest',
  ];

  const out = [];
  const pushUnique = (m) => {
    const n = normalizeModelName(m);
    if (!n) return;
    if (!out.includes(n)) out.push(n);
  };

  pushUnique(normalizedEnvModel);

  // Keep only preferred models that your key actually lists.
  const availableSet = new Set((available || []).map(normalizeModelName));
  for (const m of preferred) {
    if (availableSet.has(m)) pushUnique(m);
  }

  // As a last resort, try the first few available models.
  for (const m of (available || []).slice(0, 10)) pushUnique(m);

  return out;
}

async function askGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY is missing in environment (.env).');
    err.statusCode = 500;
    throw err;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Fetch available models once, then try a shortlist until one works.
  let availableModels = [];
  try {
    availableModels = await listGenerateContentModels(apiKey);
  } catch (e) {
    // If ListModels fails, still try a safe fallback set.
    availableModels = [];
  }

  const candidates = buildCandidateModels(process.env.GEMINI_MODEL, availableModels);
  const finalPrompt = `${SYSTEM_INSTRUCTION}\n\nUser question: ${prompt}`;

  let lastErr = null;
  for (const modelName of candidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(finalPrompt);
      const reply = getTextFromGemini(result);
      if (reply) return { reply, modelName };
      lastErr = new Error('Empty response from Gemini.');
    } catch (e) {
      lastErr = e;
      if (isModelNotFoundError(e)) continue;
      break;
    }
  }

  const err = new Error(
    `Gemini request failed. Tried models: ${candidates.join(', ')}. Last error: ${
      lastErr && lastErr.message ? lastErr.message : String(lastErr)
    }`
  );
  err.statusCode = 500;
  throw err;
}

async function postAi(req, res) {
  const prompt = req.body && typeof req.body.prompt === 'string' ? req.body.prompt.trim() : '';

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  if (prompt.length > 2000) {
    return res.status(400).json({ error: 'Prompt is too long (max 2000 chars).' });
  }

  try {
    const { reply, modelName } = await askGemini(prompt);

    await Chat.create({ prompt, response: reply });

    return res.status(200).json({ reply, model: modelName });
  } catch (err) {
    const status = err && err.statusCode ? err.statusCode : 500;
    const details = err && err.message ? err.message : 'Gemini API error';
    console.error('[ai] error:', details);
    return res.status(status).json({ error: 'AI service error. Please try again later.', details });
  }
}

module.exports = {
  postAi,
};


