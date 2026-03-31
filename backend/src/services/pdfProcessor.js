const fs = require('fs/promises');
const path = require('path');

// Optimized PDF processor for low memory + small chunks.
// - Extracts text page-by-page (no full-PDF text in memory)
// - Produces small sentence-safe chunks with overlap

let pdfjsImportPromise = null;
async function getPdfJs() {
  if (!pdfjsImportPromise) {
    pdfjsImportPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsImportPromise;
}

function normalizeText(input) {
  return String(input || '')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSentences(text) {
  const s = normalizeText(text);
  if (!s) return [];

  // Sentence-ish split. Keeps recruiter-style facts intact most of the time.
  // Falls back to whole string when punctuation is scarce.
  const parts = s.split(/(?<=[.!?])\s+/g).map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts : [s];
}

function safeSplitLongText(text, maxLen) {
  const s = normalizeText(text);
  if (!s) return [];
  if (s.length <= maxLen) return [s];

  const out = [];
  let start = 0;

  const preferred = ['. ', '; ', ': ', ', ', ' '];

  while (start < s.length) {
    const end = Math.min(s.length, start + maxLen);
    if (end === s.length) {
      out.push(s.slice(start).trim());
      break;
    }

    const window = s.slice(start, end);
    let cut = -1;

    for (const sep of preferred) {
      const idx = window.lastIndexOf(sep);
      if (idx > Math.floor(maxLen * 0.6)) {
        cut = idx + sep.length;
        break;
      }
    }

    if (cut === -1) cut = window.length;

    out.push(window.slice(0, cut).trim());
    start = start + cut;
  }

  return out.filter(Boolean);
}

function buildChunksFromSentences(sentences, { chunkSize, minChunkChars } = {}) {
  const size = Math.max(50, Number(chunkSize) || 300);
  const minChars = Math.max(0, Number(minChunkChars) || 25);

  const chunks = [];
  let current = '';

  const flush = () => {
    const t = normalizeText(current);
    if (t && t.length >= minChars) chunks.push(t);
    current = '';
  };

  for (const sentence of sentences) {
    if (!sentence) continue;

    const safePieces = safeSplitLongText(sentence, size);
    for (const piece of safePieces) {
      if (!piece) continue;

      if (!current) {
        current = piece;
        continue;
      }

      const joined = `${current} ${piece}`.trim();
      if (joined.length <= size) {
        current = joined;
      } else {
        flush();
        current = piece;
      }
    }
  }

  flush();
  return chunks;
}

function applyOverlap(chunks, overlapChars) {
  const overlap = Math.max(0, Number(overlapChars) || 40);
  if (!overlap || chunks.length <= 1) return chunks;

  const out = [];
  for (let i = 0; i < chunks.length; i++) {
    if (i === 0) {
      out.push(chunks[i]);
      continue;
    }

    const prev = chunks[i - 1];
    const tail = prev.slice(Math.max(0, prev.length - overlap));
    out.push(normalizeText(`${tail} ${chunks[i]}`));
  }

  return out;
}

async function extractPageText(pdf, pageNumber) {
  const page = await pdf.getPage(pageNumber);
  const content = await page.getTextContent();
  return (content.items || [])
    .map((it) => (it && typeof it.str === 'string' ? it.str : ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function* iteratePdfChunks(filePath, opts = {}) {
  const abs = path.resolve(String(filePath));

  const chunkSize = Number(opts.chunkSize || process.env.RAG_CHUNK_SIZE || 300);
  const overlap = Number(opts.overlap || process.env.RAG_CHUNK_OVERLAP || 40);
  const minChunkChars = Number(opts.minChunkChars || process.env.RAG_MIN_CHUNK_CHARS || 25);

  const data = await fs.readFile(abs);
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

  const pdfjsLib = await getPdfJs();
  const loadingTask = pdfjsLib.getDocument({
    data: bytes,
    stopAtErrors: false,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;

  for (let page = 1; page <= pdf.numPages; page++) {
    const pageText = await extractPageText(pdf, page);

    const sentences = splitSentences(pageText);
    const baseChunks = buildChunksFromSentences(sentences, { chunkSize, minChunkChars });
    const chunks = applyOverlap(baseChunks, overlap);

    for (const text of chunks) {
      const t = normalizeText(text);
      if (!t || t.length < minChunkChars) continue;
      yield { text: t, page };
    }
  }
}

module.exports = {
  iteratePdfChunks,
};
