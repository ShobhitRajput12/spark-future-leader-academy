const fs = require('fs');
const path = require('path');
const multer = require('multer');

function sanitizeSegment(input) {
  return String(input || '')
    .trim()
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getUploadsRoot() {
  // Default matches requirement: backend/uploads/defense_pdfs/
  // Override allowed for production via env.
  const configured = process.env.RAG_UPLOAD_DIR;
  if (configured && String(configured).trim()) return path.resolve(String(configured).trim());
  return path.resolve(__dirname, '..', '..', 'uploads', 'defense_pdfs');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    try {
      const uploadsRoot = getUploadsRoot();
      const sectorRaw = (req.query && req.query.sector) || (req.body && req.body.sector) || '';
      const sector = sanitizeSegment(sectorRaw);

      const folderRelative = sector ? path.join('defense_pdfs', sector) : 'defense_pdfs';
      const folderAbsolute = sector ? path.join(uploadsRoot, sector) : uploadsRoot;

      ensureDir(folderAbsolute);

      // Make traceability available to downstream handlers.
      req.ragUpload = {
        sector: sector || '',
        folder: folderRelative.replace(/\\/g, '/'),
        uploadsRoot,
      };

      cb(null, folderAbsolute);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    try {
      const original = path.basename(file.originalname || 'document.pdf');
      const safeOriginal = sanitizeSegment(original) || 'document.pdf';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const finalName = `${timestamp}_${safeOriginal}`;

      if (!req.ragUpload) req.ragUpload = {};
      req.ragUpload.savedFileName = finalName;
      req.ragUpload.originalFileName = original;

      cb(null, finalName);
    } catch (err) {
      cb(err);
    }
  },
});

function fileFilter(_req, file, cb) {
  const name = String(file.originalname || '').toLowerCase();
  const isPdfByName = name.endsWith('.pdf');
  const isPdfByMime = String(file.mimetype || '').toLowerCase().includes('pdf');
  if (!isPdfByName && !isPdfByMime) {
    const err = new Error('Only PDF files are allowed.');
    err.statusCode = 400;
    return cb(err, false);
  }
  cb(null, true);
}

const maxFileSizeMb = Number(process.env.RAG_MAX_PDF_MB || 50);
const uploadPdf = multer({
  storage,
  fileFilter,
  limits: { fileSize: Math.max(1, maxFileSizeMb) * 1024 * 1024 },
});

module.exports = {
  uploadPdf,
  getUploadsRoot,
};

