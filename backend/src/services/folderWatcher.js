const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const { getRootDir, indexPdfIfNeeded } = require('./pdfIndexService');

function ensureRootDir(rootDir) {
  try {
    fs.mkdirSync(rootDir, { recursive: true });
  } catch (_e) {
    // ignore
  }
}

function isPdf(filePath) {
  return path.extname(String(filePath || '')).toLowerCase() === '.pdf';
}

function startFolderWatcher({ rootDir } = {}) {
  const absRoot = path.resolve(rootDir || getRootDir());
  ensureRootDir(absRoot);

  const watcher = chokidar.watch(absRoot, {
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: Number(process.env.RAG_WATCH_STABLE_MS || 1000),
      pollInterval: 200,
    },
  });

  const onAdd = async (filePath) => {
    if (!isPdf(filePath)) return;

    try {
      console.log(`[rag-watch] new pdf: ${filePath}`);
      const r = await indexPdfIfNeeded(filePath, { rootDir: absRoot });
      if (r && r.indexed) {
        console.log(`[rag-watch] indexed: ${filePath}`);
      } else {
        console.log(`[rag-watch] skipped: ${filePath} (${r && r.reason ? r.reason : 'unknown'})`);
      }
    } catch (e) {
      console.error(`[rag-watch] failed: ${filePath} :: ${e && e.message ? e.message : String(e)}`);
    }
  };

  watcher.on('add', onAdd);

  watcher.on('error', (err) => {
    console.error('[rag-watch] error:', err && err.message ? err.message : err);
  });

  console.log(`[rag-watch] watching: ${absRoot}`);

  return {
    close: async () => {
      try {
        await watcher.close();
      } catch (_e) {
        // ignore
      }
    },
  };
}

module.exports = {
  startFolderWatcher,
};
