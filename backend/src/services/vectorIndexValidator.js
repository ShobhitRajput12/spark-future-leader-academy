const mongoose = require('mongoose');

function pretty(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (_e) {
    return String(obj);
  }
}

async function validateVectorSearchIndex() {
  const indexName = 'defense_documents_vector_index';
  const expectedPath = 'embedding';
  const expectedDims = 3072;

  try {
    const db = mongoose.connection && mongoose.connection.db;
    if (!db) {
      console.warn('[rag] Atlas Vector Search index missing or invalid (db not connected)');
      return { ok: false, reason: 'db_not_connected' };
    }

    const coll = db.collection('defense_documents');

    if (!coll || typeof coll.listSearchIndexes !== 'function') {
      // Some environments/drivers don't expose listSearchIndexes().
      console.warn('[rag] Atlas Vector Search index missing or invalid (cannot list search indexes from driver)');
      console.warn('[rag] Create this Atlas Search index (UI) with name:', indexName);
      console.warn(
        '[rag] Index JSON:\n' +
          pretty({
            fields: [
              {
                type: 'vector',
                path: expectedPath,
                numDimensions: expectedDims,
                similarity: 'cosine',
              },
            ],
          })
      );
      return { ok: false, reason: 'listSearchIndexes_unavailable' };
    }

    const indexes = await coll.listSearchIndexes().toArray();
    const idx = Array.isArray(indexes) ? indexes.find((i) => i && i.name === indexName) : null;

    if (!idx) {
      console.warn('[rag] Atlas Vector Search index missing or invalid');
      console.warn('[rag] Missing index name:', indexName);
      console.warn(
        '[rag] Create this Atlas Search index (UI) JSON:\n' +
          pretty({
            fields: [
              {
                type: 'vector',
                path: expectedPath,
                numDimensions: expectedDims,
                similarity: 'cosine',
              },
            ],
          })
      );
      return { ok: false, reason: 'index_missing' };
    }

    // Atlas returns index definition shape depending on API; handle common shapes.
    const def = idx.definition || idx.latestDefinition || idx;

    const fields =
      (def && def.fields && Array.isArray(def.fields) ? def.fields : null) ||
      (def && def.mappings && def.mappings.fields ? def.mappings.fields : null);

    let found = null;

    if (Array.isArray(fields)) {
      found = fields.find((f) => f && f.path === expectedPath);
    } else if (fields && typeof fields === 'object') {
      // mappings.fields.embedding
      found = fields[expectedPath];
      if (found && typeof found === 'object') found = { path: expectedPath, ...found };
    }

    const type = found && (found.type || found['type']);
    const dims = found && (found.numDimensions || found.dimensions);

    const typeOk = String(type || '').toLowerCase().includes('vector');
    const dimsOk = Number(dims) === expectedDims;

    if (!found || !typeOk || !dimsOk) {
      console.warn('[rag] Atlas Vector Search index missing or invalid');
      console.warn('[rag] Found index, but embedding field config does not match expectations.');
      console.warn('[rag] Expected: path=embedding, numDimensions=3072');
      console.warn('[rag] Index name:', indexName);
      console.warn('[rag] Index (driver view):', pretty(idx));
      console.warn(
        '[rag] Fix JSON:\n' +
          pretty({
            fields: [
              {
                type: 'vector',
                path: expectedPath,
                numDimensions: expectedDims,
                similarity: 'cosine',
              },
            ],
          })
      );
      return { ok: false, reason: 'index_invalid' };
    }

    console.log('[rag] Atlas Vector Search index READY');
    return { ok: true, indexName };
  } catch (e) {
    console.warn('[rag] Atlas Vector Search index missing or invalid');
    console.warn('[rag] Failed to validate index:', e && e.message ? e.message : String(e));
    console.warn('[rag] Required index name:', 'defense_documents_vector_index');
    console.warn(
      '[rag] Required index JSON:\n' +
        pretty({
          fields: [
            {
              type: 'vector',
              path: 'embedding',
              numDimensions: 3072,
              similarity: 'cosine',
            },
          ],
        })
    );
    return { ok: false, reason: 'exception' };
  }
}

module.exports = {
  validateVectorSearchIndex,
};
