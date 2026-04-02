const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const DefenseDocument = require('../models/DefenseDocument');
const { embedText, ensureVectorSearchIndex } = require('./vectorService');
const { iteratePdfChunks } = require('./pdfProcessor');

// Prevent duplicate concurrent indexing when the watcher + upload route see the same file.
const inProgress = new Map();

function getBackendRootDir() {
  // backend/src/services -> backend
  return path.resolve(__dirname, '..', '..');
}

function resolveUploadsRootDir(rootDirOverride) {
  const backendRoot = getBackendRootDir();

  const candidate = rootDirOverride !== undefined ? rootDirOverride : process.env.RAG_UPLOAD_DIR;
  const raw = String(candidate || '').trim();

  // IMPORTANT: never resolve relative to process.cwd(). If an override is relative,
  // resolve it relative to the backend root.
  if (raw) return path.isAbsolute(raw) ? path.resolve(raw) : path.resolve(backendRoot, raw);

  // Default: backend/uploads/defense_pdfs
  return path.resolve(backendRoot, 'uploads', 'defense_pdfs');
}

function isPdfFile(filePath) {
  const ext = path.extname(String(filePath || '')).toLowerCase();
  return ext === '.pdf';
}

function computeFileSha256(absFilePath) {
  const p = path.resolve(String(absFilePath));
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(p);

    stream.on('data', (d) => hash.update(d));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function getRootDir() {
  return resolveUploadsRootDir();
}
function toPosix(p) {
  return String(p || '').replace(/\\/g, '/');
}

function computeFolderMeta({ rootDir, filePath }) {
  const absRoot = path.resolve(rootDir);
  const absFile = path.resolve(filePath);

  const relDir = path.relative(absRoot, path.dirname(absFile));
  const relativeFolder = relDir && relDir !== '.' ? toPosix(relDir) : '';
  const category = relativeFolder ? relativeFolder.split('/').slice(-1)[0] : '';

  return { relativeFolder, category };
}

function ensureRootDir(rootDir) {
  try {
    fs.mkdirSync(rootDir, { recursive: true });
  } catch (_e) {
    // ignore
  }
}

function computeChunkKey({ rootDir, filePath }) {
  const absRoot = resolveUploadsRootDir(rootDir);
  const absFile = path.resolve(filePath);
  const pdfName = path.basename(absFile);
  const { category } = computeFolderMeta({ rootDir: absRoot, filePath: absFile });
  const sector = category;
  return { pdfName, sector };
}

async function doIndexPdfFile(filePath, { rootDir, uploadedAt, source, fileHash } = {}) {
  await ensureVectorSearchIndex();

  const src = source || path.resolve(String(filePath));

  const absRoot = resolveUploadsRootDir(rootDir);
  const { pdfName, sector } = computeChunkKey({ rootDir: absRoot, filePath });
  const { relativeFolder, category } = computeFolderMeta({ rootDir: absRoot, filePath });

  const when = uploadedAt instanceof Date ? uploadedAt : new Date();

  const batchSize = Math.max(10, Number(process.env.RAG_INSERT_BATCH || 500));
  const batch = [];

  let pagesSeen = new Set();
  let chunkCount = 0;
  let insertedAny = false;

  try {
    for await (const c of iteratePdfChunks(filePath, {
      chunkSize: 300,
      overlap: 40,
      minChunkChars: 25,
    })) {
      const embedding = await embedText(c.text);

      batch.push({
        text: c.text,
        embedding,
        pdfName,
        sector,
        page: c.page,
        uploadedAt: when,
        source: src,
        fileHash,
      });

      chunkCount += 1;
      pagesSeen.add(c.page);

      if (batch.length >= batchSize) {
        await DefenseDocument.insertMany(batch, { ordered: false });
        insertedAny = true;
        batch.length = 0;

        if (global.gc) global.gc();
      }
    }

    if (batch.length) {
      await DefenseDocument.insertMany(batch, { ordered: false });
      insertedAny = true;
      batch.length = 0;
    }

    return {
      ok: true,
      indexed: true,
      filePath,
      pdfName,
      pages: pagesSeen.size,
      chunks: chunkCount,
      relativeFolder,
      category,
    };
  } catch (e) {
    // Prevent partial indexing: roll back so the scanner can retry cleanly.
    if (insertedAny) {
      try {
        await DefenseDocument.deleteMany({ pdfName, sector, uploadedAt: when });
      } catch (_rollbackErr) {
        // ignore rollback failure
      }
    }
    throw e;
  }
}

async function indexPdfFile(absFilePath, { rootDir, uploadedAt, force, fileHash } = {}) {
  const filePath = path.resolve(String(absFilePath));
  if (!isPdfFile(filePath)) return { ok: false, skipped: true, reason: 'not_pdf' };

  const absRoot = resolveUploadsRootDir(rootDir);
  const { pdfName, sector } = computeChunkKey({ rootDir: absRoot, filePath });

  if (force && inProgress.has(filePath)) {
    // Avoid skipping in startup re-index flow; wait and then rebuild.
    try {
      await inProgress.get(filePath);
    } catch (_e) {
      // ignore
    }
  }

  const currentHash = fileHash || (await computeFileSha256(filePath));

  if (!force) {
    const already = await DefenseDocument.findOne({ source: filePath, fileHash: currentHash }).select({ _id: 1 });
    if (already) return { ok: true, skipped: true, reason: 'already_indexed', filePath };
  }
  if (inProgress.has(filePath)) return { ok: true, skipped: true, reason: 'indexing_in_progress', filePath };

  const promise = (async () => {
    // Ensure a clean rebuild for this PDF (source-based, with legacy fallback).
    await DefenseDocument.deleteMany({
      $or: [{ source: filePath }, { pdfName, sector, source: { $exists: false } }],
    });

    return doIndexPdfFile(filePath, { rootDir: absRoot, uploadedAt, source: filePath, fileHash: currentHash });
  })();
  inProgress.set(filePath, promise);

  try {
    return await promise;
  } finally {
    inProgress.delete(filePath);
  }
}

async function indexPdfIfNeeded(absFilePath, { rootDir } = {}) {
  const filePath = path.resolve(String(absFilePath));

  const absRoot = resolveUploadsRootDir(rootDir);
  return indexPdfFile(filePath, { rootDir: absRoot });
}

async function listPdfFilesRecursively(rootDir) {
  const absRoot = path.resolve(String(rootDir));
  ensureRootDir(absRoot);

  const out = [];

  async function walk(dir) {
    let entries = [];
    try {
      entries = await fsPromises.readdir(dir, { withFileTypes: true });
    } catch (_e) {
      return;
    }

    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await walk(full);
      } else if (ent.isFile() && isPdfFile(full)) {
        out.push(path.resolve(full));
      }
    }
  }

  await walk(absRoot);
  return out;
}

module.exports = {
  getRootDir,
  resolveUploadsRootDir,
  listPdfFilesRecursively,
  indexPdfFile,
  indexPdfIfNeeded,
  computeFolderMeta,
  ensureRootDir,
};











