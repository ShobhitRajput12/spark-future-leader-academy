import { getApiBaseUrl } from './ai';

export async function uploadDefensePdf({ uri, name, mimeType, sector } = {}) {
  const baseUrl = getApiBaseUrl();
  const cleanSector = typeof sector === 'string' ? sector.trim() : '';

  if (!uri) throw new Error('Missing file uri');

  const form = new FormData();
  form.append('pdf', {
    uri,
    name: name || 'document.pdf',
    type: mimeType || 'application/pdf',
  });

  const qs = cleanSector ? `?sector=${encodeURIComponent(cleanSector)}` : '';
  const res = await fetch(`${baseUrl}/api/rag/upload${qs}`, {
    method: 'POST',
    body: form,
  });

  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await res.json() : { text: await res.text() };

  if (!res.ok) {
    const msg = payload?.error || payload?.details || payload?.message || payload?.text || `Upload failed (${res.status})`;
    throw new Error(msg);
  }

  return payload;
}

export async function askRag({ question, sector, signal } = {}) {
  const baseUrl = getApiBaseUrl();
  const cleanQuestion = typeof question === 'string' ? question.trim() : '';
  const cleanSector = typeof sector === 'string' ? sector.trim() : '';

  if (!cleanQuestion) throw new Error('Question is required');

  const res = await fetch(`${baseUrl}/api/rag/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: cleanQuestion, sector: cleanSector || undefined }),
    signal,
  });

  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await res.json() : { text: await res.text() };

  if (!res.ok) {
    const msg = payload?.error || payload?.details || payload?.message || payload?.text || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return payload;
}

export function filePathToDownloadUrl(filePath) {
  const baseUrl = getApiBaseUrl();
  const p = String(filePath || '');

  // Convert absolute server path -> /uploads/... URL (server serves /uploads statically).
  // Works when filePath contains "\\uploads\\..." or "/uploads/...".
  const idx = p.toLowerCase().lastIndexOf('uploads');
  if (idx === -1) return '';

  const rel = p.slice(idx).replace(/\\/g, '/');
  const cleanBase = String(baseUrl || '').replace(/\/+$/g, '');
  const cleanRel = rel.replace(/^\/+/, '');
  return `${cleanBase}/${cleanRel}`;
}
