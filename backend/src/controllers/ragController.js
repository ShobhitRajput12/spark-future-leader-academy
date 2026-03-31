const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const DefenseDocument = require('../models/DefenseDocument');
const { embedText } = require('../services/vectorService');
const { getRootDir, indexPdfFile } = require('../services/pdfIndexService');

 const RAG_SYSTEM_INSTRUCTION ="";
//   'You are a defence intelligence assistant. Answer the user using ONLY the provided context from official defence PDFs. ' +
//   'If the context is insufficient, say you do not know and ask for the specific PDF/SOP to be uploaded. ' +
//   'Keep the answer concise, structured, and factual. Do not invent citations.';

function normalizeModelName(name) {
  const n = String(name || '').trim();
  if (!n) return '';
  return n.startsWith('models/') ? n.slice('models/'.length) : n;
}

function getTextFromGemini(result) {
  const text = result && result.response && typeof result.response.text === 'function' ? result.response.text() : '';
  return String(text || '').trim();
}

function isModelNotFoundError(err) {
  const msg = String(err && err.message ? err.message : err || '').toLowerCase();
  return msg.includes('404') || msg.includes('not found') || msg.includes('no longer available');
}

async function listGenerateContentModels(apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
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

  const availableSet = new Set((available || []).map(normalizeModelName));
  for (const m of preferred) {
    if (availableSet.has(m)) pushUnique(m);
  }
  for (const m of (available || []).slice(0, 10)) pushUnique(m);

  return out;
}

async function generateAnswer({ question, context }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY is missing in environment (.env).');
    err.statusCode = 500;
    throw err;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  let availableModels = [];
  try {
    availableModels = await listGenerateContentModels(apiKey);
  } catch (_e) {
    availableModels = [];
  }

  const candidates = buildCandidateModels(process.env.GEMINI_MODEL, availableModels);
  const prompt =
    `${RAG_SYSTEM_INSTRUCTION}\n\n` +
    `Context:\n${context}\n\n` +
    `User question: ${question}\n\n` +
    'Answer:';

  let lastErr = null;
  for (const modelName of candidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
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


function toPosix(p) {
  return String(p || '').replace(/\\/g, '/');
}

let pdfPathCache = {
  builtAt: 0,
  rootAbs: '',
  rootRel: 'uploads/defense_pdfs',
  byName: new Map(),
  bySectorAndName: new Map(),
};

function computeUploadsRootRel(rootAbs) {
  const backendRoot = path.resolve(__dirname, '..', '..');
  const rel = toPosix(path.relative(backendRoot, rootAbs));
  if (!rel || rel === '.' || rel.startsWith('..')) return 'uploads/defense_pdfs';
  return rel;
}

function rebuildPdfPathCache() {
  const byName = new Map();
  const bySectorAndName = new Map();

  const backendRoot = path.resolve(__dirname, '..', '..');
  const rootAbs = getRootDir();
  const rootRel = computeUploadsRootRel(rootAbs);

  const walk = (dir) => {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_e) {
      return;
    }

    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full);
      } else if (ent.isFile() && String(ent.name || '').toLowerCase().endsWith('.pdf')) {
        const pdfName = ent.name;
        const relFromBackend = toPosix(path.relative(backendRoot, full));
        if (!relFromBackend || relFromBackend === '.' || relFromBackend.startsWith('..')) continue;

        if (!byName.has(pdfName)) byName.set(pdfName, relFromBackend);

        const relDir = toPosix(path.relative(rootAbs, path.dirname(full)));
        const sector = relDir && relDir !== '.' ? relDir.split('/').slice(-1)[0] : '';
        const key = `${sector}|${pdfName}`;
        if (!bySectorAndName.has(key)) bySectorAndName.set(key, relFromBackend);
      }
    }
  };

  walk(rootAbs);

  pdfPathCache = {
    builtAt: Date.now(),
    rootAbs,
    rootRel,
    byName,
    bySectorAndName,
  };
}

function resolvePdfRelativeFilePath({ pdfName, sector } = {}) {
  const name = String(pdfName || '').trim();
  if (!name) return '';

  const sec = String(sector || '').trim();
  const rootAbs = getRootDir();

  // Rebuild every 60s or when root changes.
  if (!pdfPathCache.builtAt || pdfPathCache.rootAbs !== rootAbs || Date.now() - pdfPathCache.builtAt > 60_000) {
    rebuildPdfPathCache();
  }

  if (sec) {
    const key = `${sec}|${name}`;
    if (pdfPathCache.bySectorAndName.has(key)) return pdfPathCache.bySectorAndName.get(key) || '';
  }

  if (pdfPathCache.byName.has(name)) return pdfPathCache.byName.get(name) || '';

  const rootRel = pdfPathCache.rootRel || 'uploads/defense_pdfs';
  return sec ? path.posix.join(rootRel, sec, name) : path.posix.join(rootRel, name);
}

function toSource(doc) {
  const pdfName = doc.pdfName;
  const sector = doc.sector || '';
  const filePath = resolvePdfRelativeFilePath({ pdfName, sector }) || '';
  return {
    pdfName,
    filePath,
    page: doc.page,
    sector,
  };
}

async function uploadPdf(req, res) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        error: 'PDF file is required. Use multipart/form-data with field name "pdf".',
      });
    }

    const sector = (req.ragUpload && req.ragUpload.sector) || '';
    const folder = (req.ragUpload && req.ragUpload.folder) || 'defense_pdfs';
    const pdfName = (req.ragUpload && req.ragUpload.originalFileName) || file.originalname || path.basename(file.path);
    const filePath = path.resolve(file.path); // exact path on server disk

    // Ensure vector search index exists (best-effort).
    await ensureVectorSearchIndex();

    // Extract per-page text to preserve page metadata.
    const pages = await extractPdfPages(filePath);

    // Chunk by page to preserve traceability.
    const chunkSize = Number(process.env.RAG_CHUNK_SIZE || 900);
    const overlap = Number(process.env.RAG_CHUNK_OVERLAP || 150);
    const chunks = chunkPdfPages(pages, { chunkSize, overlap });

    if (!chunks.length) {
      return res.status(400).json({
        error: 'No extractable text found in PDF (possibly scanned image-only PDF).',
      });
    }

    const uploadedAt = new Date();

    // Embed + persist each chunk.
    // Sequential embedding is safer for rate limits; tune concurrency later if needed.
    const docs = [];
    for (const c of chunks) {
      const embedding = await embedText(c.text);
            docs.push({
        text: c.text,
        embedding,
        pdfName,
        sector,
        page: c.page,
        uploadedAt,
      });
    }

    await DefenseDocument.insertMany(docs, { ordered: false });

    return res.status(201).json({
      ok: true,
      pdfName,
      filePath,
      folder,
      sector,
      pages: pages.length,
      chunks: chunks.length,
    });
  } catch (err) {
    const status = err && err.statusCode ? err.statusCode : 500;
    const details = err && err.message ? err.message : 'RAG upload error';
    console.error('[rag] upload error:', details);
    return res.status(status).json({ error: 'RAG upload failed.', details });
  }
}

async function ask(req, res) {
  const question = req.body && typeof req.body.question === 'string' ? req.body.question.trim() : '';
  const sector = req.body && typeof req.body.sector === 'string' ? req.body.sector.trim() : '';

  if (!question) return res.status(400).json({ error: 'question is required.' });
  if (question.length > 2000) return res.status(400).json({ error: 'question is too long (max 2000 chars).' });

  const vectorIndexName = process.env.MONGODB_VECTOR_INDEX || 'defense_documents_vector_index';

  try {
    const rawEmbedding = await embedText(question);
    const qEmbedding = Array.isArray(rawEmbedding)
      ? rawEmbedding.map((n) => Number(n)).filter((n) => Number.isFinite(n))
      : [];

    console.log(`[rag] vector index=${vectorIndexName}`);
    console.log(`[rag] query vector length=${qEmbedding.length}`);

    const expectedDimsRaw = process.env.MONGODB_VECTOR_DIMS;
    const expectedDims = expectedDimsRaw ? Number(expectedDimsRaw) : null;

    if (expectedDims && qEmbedding.length !== expectedDims) {
      console.warn('[rag] invalid query vector size');
      return res.status(500).json({
        error: 'RAG ask failed.',
        details: `Invalid query vector size for vector search (expected ${expectedDims}, got ${qEmbedding.length}).`,
      });
    }

    const filter = {};
    const cleanSector = String(sector || '').trim();
    if (cleanSector) filter.sector = cleanSector;

    const pipeline = [
      {
        $vectorSearch: {
          index: vectorIndexName,
          path: 'embedding',
          queryVector: qEmbedding,
          numCandidates: 100,
          limit: 5,
          ...(Object.keys(filter).length ? { filter } : {}),
        },
      },
      {
        $project: {
          _id: 0,
          text: 1,
          pdfName: 1,
          page: 1,
          sector: 1,
          uploadedAt: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ];

    const hits = await DefenseDocument.aggregate(pipeline).exec();
    const results = Array.isArray(hits) ? hits : [];

    console.log(`[rag] retrieved chunks: ${results.length}`);
    if (!results.length) console.warn('[rag] vector search returned no results');

    const sources = results.map(toSource);

    const context = results
      .map((h, idx) => {
        const resolvedPath = resolvePdfRelativeFilePath({ pdfName: h.pdfName, sector: h.sector || '' }) || '';
        const tag = `SOURCE ${idx + 1}: pdfName=${h.pdfName} | page=${h.page} | sector=${h.sector || ''} | filePath=${resolvedPath}`;
        return `${tag}\n${h.text}`;
      })
      .join('\n\n');

    const { reply } = await generateAnswer({
      question,
      context: context || 'NO_CONTEXT',
    });

    return res.status(200).json({
      answer: reply,
      sources,
    });
  } catch (err) {
    const status = err && err.statusCode ? err.statusCode : 500;
    const details = err && err.message ? err.message : 'RAG ask error';
    console.error('[rag] ask error:', details);
    return res.status(status).json({ error: 'RAG ask failed.', details });
  }
}
module.exports = {
  uploadPdf,
  ask,
};



















