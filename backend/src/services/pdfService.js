const fs = require('fs/promises');
const path = require('path');

// pdfjs-dist v4+ ships ESM (.mjs). Backend is CommonJS, so we load it via dynamic import.
let pdfjsImportPromise = null;
async function getPdfJs() {
  if (!pdfjsImportPromise) {
    pdfjsImportPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsImportPromise;
}

async function extractPdfPages(filePath) {
  const abs = path.resolve(String(filePath));
  const data = await fs.readFile(abs);

  // pdfjs-dist rejects Node Buffers; convert to a plain Uint8Array view.
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

  const pdfjsLib = await getPdfJs();

  const loadingTask = pdfjsLib.getDocument({
    data: bytes,
    // Reduce noisy warnings for malformed PDFs; still extract what we can.
    stopAtErrors: false,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = (content.items || [])
      .map((it) => (it && typeof it.str === 'string' ? it.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    pages.push({ page: i, text });
  }

  return pages;
}

function splitIntoSemanticUnits(text) {
  const s = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!s) return [];

  // Prefer paragraph boundaries, then fall back to sentence-ish splits.
  const paras = s.split(/\n{2,}/g).map((p) => p.trim()).filter(Boolean);
  if (paras.length > 1) return paras;

  return s
    .split(/(?<=[.!?])\s+/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

function chunkTextUnits(units, { chunkSize = 900, overlap = 150 } = {}) {
  const out = [];
  let current = '';

  const flush = () => {
    const t = current.trim();
    if (t) out.push(t);
    current = '';
  };

  for (const unit of units) {
    if (!unit) continue;

    if ((current + ' ' + unit).trim().length <= chunkSize) {
      current = (current ? `${current} ` : '') + unit;
      continue;
    }

    flush();

    // If a single unit is huge, hard-split it.
    const u = String(unit);
    if (u.length > chunkSize) {
      let start = 0;
      while (start < u.length) {
        const end = Math.min(u.length, start + chunkSize);
        out.push(u.slice(start, end).trim());
        start = Math.max(0, end - overlap);
        if (start === end) start = end;
      }
      continue;
    }

    current = unit;
  }

  flush();

  // Apply overlap between chunks by re-attaching tail from previous chunk.
  if (overlap > 0 && out.length > 1) {
    const withOverlap = [];
    for (let i = 0; i < out.length; i++) {
      if (i === 0) {
        withOverlap.push(out[i]);
        continue;
      }
      const prev = out[i - 1];
      const tail = prev.slice(Math.max(0, prev.length - overlap));
      withOverlap.push(`${tail} ${out[i]}`.trim());
    }
    return withOverlap;
  }

  return out;
}

function chunkPdfPages(pages, { chunkSize = 900, overlap = 150 } = {}) {
  const chunks = [];

  for (const p of pages || []) {
    const pageNum = Number(p.page) || 1;
    const units = splitIntoSemanticUnits(p.text || '');
    const texts = chunkTextUnits(units, { chunkSize, overlap });
    for (const t of texts) {
      if (!t) continue;
      chunks.push({ text: t, page: pageNum });
    }
  }

  return chunks;
}

module.exports = {
  extractPdfPages,
  chunkPdfPages,
};
