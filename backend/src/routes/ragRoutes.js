const express = require('express');

const { uploadPdf, ask } = require('../controllers/ragController');
const { uploadPdf: upload } = require('../middleware/uploadPdf');

const router = express.Router();

// Upload a PDF and index into MongoDB Atlas Vector Search.
// multipart/form-data:
// - pdf: file
// Optional:
// - sector: string (recommended to pass as query param ?sector=...)
router.post('/upload', upload.single('pdf'), uploadPdf);

// Ask grounded questions from indexed PDFs.
// POST /api/rag/ask body: { question: string, sector?: string }
router.post('/ask', ask);

module.exports = router;
