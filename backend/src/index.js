const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const connectDB = require('./config/db');
const aiRoutes = require('./routes/aiRoutes');
const ragRoutes = require('./routes/ragRoutes');

const { startStartupScanner } = require('./services/startupScanner');
const { startFolderWatcher } = require('./services/folderWatcher');
const { validateVectorSearchIndex } = require('./services/vectorIndexValidator');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded PDFs (for traceability + app access)
// Example: GET /uploads/defense_pdfs/<any nested path>/<filename>.pdf
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.get('/health', (_req, res) => {
  res.status(200).send('Server is running');
});

app.use('/ai', aiRoutes);
app.use('/api/rag', ragRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

function envBool(name, defaultValue) {
  const raw = process.env[name];
  if (raw === undefined || raw === null || String(raw).trim() === '') return Boolean(defaultValue);
  const v = String(raw).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(v)) return false;
  return Boolean(defaultValue);
}

async function start() {
  try {
    await connectDB();

    // Validate Atlas Vector Search index (best-effort warning).
    await validateVectorSearchIndex();

    const enableScan = envBool('RAG_ENABLE_SCAN', true);
    const enableWatch = envBool('RAG_ENABLE_WATCH', true);
    const scanBlocking = envBool('RAG_SCAN_BLOCKING', false);

    if (enableScan) {
      const scanPromise = startStartupScanner().catch((e) => {
        console.error('[rag-scan] fatal:', e && e.message ? e.message : e);
      });

      if (scanBlocking) await scanPromise;
    }

    if (enableWatch) {
      // Keep reference if you want to close it on shutdown later.
      startFolderWatcher();
    }

    app.listen(PORT, () => {
      console.log(`[server] running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[server] failed to start:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

start();




