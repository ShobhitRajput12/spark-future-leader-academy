const fs = require('fs');
const path = require('path');

const DefenseDocument = require('../models/DefenseDocument');
const {
  resolveUploadsRootDir,
  listPdfFilesRecursively,
  indexPdfFile,
  ensureRootDir,
  computeFolderMeta,
} = require('./pdfIndexService');

async function startStartupScanner({ rootDir } = {}) {
  const absRoot = resolveUploadsRootDir(rootDir);
  ensureRootDir(absRoot);

  console.log(`[rag-scan] scanning: ${absRoot}`);

  const files = await listPdfFilesRecursively(absRoot);
  console.log(`[rag-scan] found ${files.length} pdf(s)`);

  let processed = 0;
  let indexed = 0;
  let skipped = 0;
  let failed = 0;

  for (const filePath of files) {
    processed += 1;
    console.log(`[rag-scan] processing ${processed}/${files.length}: ${filePath}`);

    try {
      const absFile = path.resolve(filePath);
      const pdfName = path.basename(absFile);
      const { category } = computeFolderMeta({ rootDir: absRoot, filePath: absFile });
      const sector = category;

      const r = await indexPdfFile(absFile, { rootDir: absRoot });
      if (r && r.indexed) indexed += 1;
      else skipped += 1;
    } catch (e) {
      failed += 1;
      console.error(`[rag-scan] failed: ${filePath} :: ${e && e.message ? e.message : String(e)}`);
    } finally {
      // Release references and hint GC to reduce heap pressure.
      if (global.gc) global.gc();
    }
  }

  console.log(`[rag-scan] done (indexed=${indexed}, skipped=${skipped}, failed=${failed})`);

  return { ok: true, files: files.length, indexed, skipped, failed };
}

module.exports = {
  startStartupScanner,
};

