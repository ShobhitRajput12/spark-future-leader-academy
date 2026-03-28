const DEFAULT_BASE_URL = 'http://localhost:3000';

export function getApiBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (typeof envUrl === 'string' && envUrl.trim().length > 0) return envUrl.trim().replace(/\/+$/, '');
  return DEFAULT_BASE_URL;
}

export async function askAi(prompt, { signal } = {}) {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
    signal,
  });

  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await res.json() : { text: await res.text() };

  if (!res.ok) {
    const msg = payload?.error || payload?.message || payload?.text || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return normalizeText(payload);
}

function normalizeText(payload) {
  if (typeof payload === 'string') return payload;
  if (payload?.reply) return String(payload.reply);
  if (payload?.text) return String(payload.text);
  if (payload?.response) return String(payload.response);
  if (payload?.data?.text) return String(payload.data.text);
  if (payload?.data?.reply) return String(payload.data.reply);
  return "I couldn't parse the response from /ai. Please update your backend to return { text: string }.";
}
