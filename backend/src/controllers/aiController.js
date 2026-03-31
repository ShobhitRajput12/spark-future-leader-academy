const { GoogleGenerativeAI } = require('@google/generative-ai');

const Chat = require('../models/Chat');

const SYSTEM_INSTRUCTION = `
You are a defence career expert for India (Army, Navy, Air Force).

Answer strictly according to the user’s exact question intent.
Do NOT force a fixed template for every reply.
Do NOT add generic sections the user didn’t ask for.

Formatting rules:
- Plain text only. Avoid Markdown symbols (no **bold**, no # headings, no ---).
- Keep it concise and question-specific.
- If key details are missing (e.g., class/stream, gender, entry name), ask 1 short clarifying question.

Intent-specific behavior (choose the best match):
1) Greetings (hi/hello/hey): reply short and conversational (1–2 lines), and ask what they want to know.
2) Eligibility questions: answer only eligibility/criteria (education, gender, nationality, marital status, % marks, required exams). No extra sections.
3) Comparison questions (vs / difference / compare): compare directly (focus on the compared entries). Use short lines or a compact table-like text.
4) Age / attempts / DOB-range questions: answer only age/attempt info and any important notes.
5) How-to-join / how-to-apply questions: give step-by-step instructions (numbered).
6) General defence career questions: respond naturally in the most relevant structure for that question.

If the user asks multiple things, answer in the same order as asked, without adding unrelated content.
`;

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


function classifyPromptIntent(prompt) {
  const p = String(prompt || '').trim().toLowerCase();
  if (!p) return 'general';

  // Greetings
  if (
    p.length <= 25 &&
    /^(hi|hello|hey|hii|hiii|namaste|good\s+morning|good\s+afternoon|good\s+evening)\b/.test(p)
  ) {
    return 'greeting';
  }

  // Comparison intent
  if (/(\bvs\b|\bversus\b|\bcompare\b|\bdifference\b|\bdifferent\b|\bbetween\b)/.test(p)) return 'comparison';

  // Age / attempts intent
  if (/(\bage\b|\baged\b|\battempt\b|\battempts\b|\bdob\b|\bborn\b|\bdate of birth\b)/.test(p)) return 'age_attempts';

  // How-to / apply intent
  if (/(\bhow to\b|\bhow do i\b|\bsteps\b|\bprocess\b|\bapply\b|\bapplication\b|\bjoin\b)/.test(p)) return 'how_to_join';

  // Eligibility intent
  if (/(\beligib\w*\b|\bcriteria\b|\bqualification\b|\brequirements\b|\bwho can\b|\bcan i\b)/.test(p)) return 'eligibility';

  return 'general';
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
  const intent = classifyPromptIntent(prompt);
  const finalPrompt = `${SYSTEM_INSTRUCTION}` +
    `\nIntent hint: ${intent} (follow the user question if this hint is wrong).\n\nUser message: ${prompt}`;

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


