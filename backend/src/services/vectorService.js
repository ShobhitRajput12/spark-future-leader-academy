const mongoose = require('mongoose');

const DefenseDocument = require('../models/DefenseDocument');

function normalizeEmbedding(embedding) {
  if (Array.isArray(embedding)) return embedding.map((n) => Number(n)).filter((n) => Number.isFinite(n));
  return [];
}

function normalizeModelName(name) {
  const n = String(name || '').trim();
  if (!n) return '';
  return n.startsWith('models/') ? n.slice('models/'.length) : n;
}

function getVectorIndexName() {
  return String(process.env.MONGODB_VECTOR_INDEX || 'defense_documents_vector_index').trim();
}

function getEmbeddingModelName() {
  // Env-first. Keep the default as a plain model id (no "models/" prefix).
  return normalizeModelName(process.env.GEMINI_EMBEDDING_MODEL) || 'text-embedding-004';
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function embedText(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY is missing in environment (.env).');
    err.statusCode = 500;
    throw err;
  }

  const model = getEmbeddingModelName();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:embedContent?key=${encodeURIComponent(
    apiKey
  )}`;

  const payload = {
    content: { parts: [{ text: String(text || '') }] },
  };

  const timeoutMs = Math.max(5000, Number(process.env.GEMINI_EMBED_TIMEOUT_MS || 30000));
  const maxRetries = Math.max(0, Number(process.env.GEMINI_EMBED_RETRIES || 3));
  const baseDelayMs = Math.max(100, Number(process.env.GEMINI_EMBED_RETRY_BASE_MS || 600));

  let lastErr = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(new Error('Embedding request timeout')), timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        const err = new Error(
          `Embedding request failed (model=${model}, status=${res.status}, attempt=${attempt + 1}/${
            maxRetries + 1
          }): ${String(body || '').slice(0, 300)}`
        );

        // Retry on common transient statuses.
        if ([408, 429, 500, 502, 503, 504].includes(res.status) && attempt < maxRetries) {
          lastErr = err;
          const delay = baseDelayMs * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }

        err.statusCode = 500;
        throw err;
      }

      const json = await res.json().catch(() => ({}));
      const emb = normalizeEmbedding(json && json.embedding && json.embedding.values);
      if (!emb.length) {
        const err = new Error(`Embedding API returned an empty embedding (model=${model}).`);
        err.statusCode = 500;
        throw err;
      }

      return emb;
    } catch (e) {
      lastErr = e;
      // Retry on network errors / aborts.
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }

      const err = new Error(
        `Embedding request failed (model=${model}, attempt=${attempt + 1}/${maxRetries + 1}): ${
          e && e.message ? e.message : String(e)
        }`
      );
      err.statusCode = 500;
      throw err;
    } finally {
      clearTimeout(t);
    }
  }

  const err = new Error(
    `Embedding request failed (model=${model}): ${lastErr && lastErr.message ? lastErr.message : String(lastErr)}`
  );
  err.statusCode = 500;
  throw err;
}

async function ensureVectorSearchIndex() {
  // Best-effort helper; vector index creation often requires Atlas privileges/UI.
  // This should never crash the server; it only returns status.
  const indexName = getVectorIndexName();

  try {
    const coll = mongoose.connection.db.collection('defense_documents');

    if (typeof coll.listSearchIndexes === 'function') {
      const indexes = await coll.listSearchIndexes().toArray();
      const exists = (indexes || []).some((i) => i && i.name === indexName);
      if (exists) return { ok: true, exists: true, indexName };
    }

    // Attempt to create index via driver API if available.
    const dims = Number(process.env.MONGODB_VECTOR_DIMS || 768);
    const similarity = String(process.env.MONGODB_VECTOR_SIMILARITY || 'cosine');

    const definition = {
      mappings: {
        dynamic: false,
        fields: {
          embedding: {
            type: 'knnVector',
            dimensions: dims,
            similarity,
          },
          sector: { type: 'string' },
          pdfName: { type: 'string' },
          folder: { type: 'string' },
          relativeFolder: { type: 'string' },
          category: { type: 'string' },
        },
      },
    };

    if (typeof coll.createSearchIndex === 'function') {
      await coll.createSearchIndex(definition, { name: indexName });
      return { ok: true, created: true, indexName };
    }

    return { ok: false, message: 'Search index API not available in this environment.', indexName };
  } catch (err) {
    return {
      ok: false,
      indexName,
      message: err && err.message ? err.message : String(err),
    };
  }
}

async function searchSimilarChunks({ questionEmbedding, sector = '', topK = 5 }) {
  const embedding = normalizeEmbedding(questionEmbedding);
  if (!embedding.length) {
    const err = new Error('Question embedding is empty.');
    err.statusCode = 400;
    throw err;
  }

  const filter = {};
  const cleanSector = String(sector || '').trim();
  if (cleanSector) filter.sector = cleanSector;

  const indexName = getVectorIndexName();

  const pipeline = [
    {
      $vectorSearch: {
        index: indexName,
        path: 'embedding',
        queryVector: embedding,
        numCandidates: Math.max(50, topK * 20),
        limit: topK,
        ...(Object.keys(filter).length ? { filter } : {}),
      },
    },
    {
      $project: {
        _id: 0,
        text: 1,
        pdfName: 1,
        filePath: 1,
        folder: 1,
        relativeFolder: 1,
        category: 1,
        page: 1,
        sector: 1,
        uploadedAt: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ];

  const results = await DefenseDocument.aggregate(pipeline).exec();
  return Array.isArray(results) ? results : [];
}

module.exports = {
  embedText,
  ensureVectorSearchIndex,
  searchSimilarChunks,
};

