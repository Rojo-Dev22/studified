const MANIFEST_URL = '/textbooks/manifest.json';

let manifestPromise = null;
const bookCache = new Map();

function normalizeSpace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function tokenize(value) {
  return normalizeSpace(value)
    .toLowerCase()
    .split(/[^a-z0-9\u1200-\u137f]+/g)
    .filter(Boolean)
    .filter((w) => w.length >= 3);
}

function scoreKeywords(queryWords, keywords) {
  if (!queryWords.length || !Array.isArray(keywords) || !keywords.length) return 0;
  const set = new Set(keywords.map((k) => String(k).toLowerCase()));
  let hits = 0;
  for (const w of queryWords) {
    if (set.has(w)) hits += 1;
  }
  return hits;
}

function scoreChunk(queryWords, text) {
  if (!queryWords.length || !text) return 0;
  const lower = String(text).toLowerCase();
  let hits = 0;
  for (const w of queryWords) {
    if (lower.includes(w)) hits += 1;
  }
  return hits;
}

async function loadManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  return manifestPromise;
}

function isTeacherGuideContent(text) {
  if (!text) return false;
  const lower = String(text).toLowerCase();
  return lower.includes('teacher guide') || lower.includes('teacher\'s guide') || lower.includes('teachers guide');
}

async function loadBookChunks(chunksFile) {
  if (bookCache.has(chunksFile)) return bookCache.get(chunksFile);
  const p = fetch(`/textbooks/${chunksFile}`, { cache: 'force-cache' })
    .then((r) => {
      if (!r.ok) return null;
      return r.json().then(data => {
        if (!data || !Array.isArray(data.chunks)) return data;
        return {
          ...data,
          chunks: data.chunks.filter(chunk => !isTeacherGuideContent(chunk.text))
        };
      });
    })
    .catch(() => null);
  bookCache.set(chunksFile, p);
  return p;
}

function buildContext(excerpts) {
  if (!excerpts.length) return '';
  const lines = excerpts.map((ex, i) => {
    const label = `${i + 1}`;
    const head = ex.title ? `${ex.title}` : 'Textbook';
    return `[${label}] ${head}: ${normalizeSpace(ex.text)}`;
  });
  return `TEXTBOOK EXCERPTS (MoE)\n${lines.join('\n')}`;
}

export async function getTextbookContext(query, { maxBooks = 2, maxExcerpts = 4, maxChars = 2200 } = {}) {
  const manifest = await loadManifest();
  const books = Array.isArray(manifest?.books) ? manifest.books : [];
  if (!books.length) return null;

  const qWords = [...new Set(tokenize(query))].slice(0, 14);
  if (!qWords.length) return null;

  const rankedBooks = books
    .map((b) => ({ book: b, score: scoreKeywords(qWords, b.keywords) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxBooks)
    .map((x) => x.book);

  if (!rankedBooks.length) return null;

  const excerpts = [];
  for (const b of rankedBooks) {
    const data = await loadBookChunks(b.chunksFile);
    const chunks = Array.isArray(data?.chunks) ? data.chunks : [];
    if (!chunks.length) continue;

    const best = chunks
      .map((c) => ({ text: c.text, score: scoreChunk(qWords, c.text) }))
      .filter((x) => x.score > 0)
      .sort((a, b2) => b2.score - a.score)
      .slice(0, maxExcerpts)
      .map((x) => ({ title: b.title, text: x.text }));

    excerpts.push(...best);
  }

  const unique = [];
  const seen = new Set();
  for (const ex of excerpts) {
    const key = normalizeSpace(ex.text).toLowerCase().slice(0, 160);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(ex);
    if (unique.length >= maxExcerpts) break;
  }

  if (!unique.length) return null;

  let ctx = buildContext(unique);
  if (ctx.length > maxChars) ctx = ctx.slice(0, maxChars).trimEnd();
  return ctx;
}

