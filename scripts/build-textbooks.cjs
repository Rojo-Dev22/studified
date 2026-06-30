const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const ROOT = path.join(__dirname, '..');
const SOURCES_PATH = path.join(ROOT, 'textbooks.sources.json');
const OUT_DIR = path.join(ROOT, 'public', 'textbooks');
const CACHE_DIR = path.join(ROOT, '.textbooks-cache');

async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function normalizeSpace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function titleCaseWord(word) {
  if (!word) return '';
  const w = String(word);
  if (w.length <= 4 && w.toUpperCase() === w) return w;
  return `${w.slice(0, 1).toUpperCase()}${w.slice(1).toLowerCase()}`;
}

function titleCaseWords(value) {
  return normalizeSpace(value)
    .split(' ')
    .map(titleCaseWord)
    .join(' ');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function safeFilename(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

function isDirectorySource(source) {
  return String(source?.type || '').toLowerCase() === 'directory' || String(source?.url || '').trim().endsWith('/');
}

function allowedSubjectsSet() {
  const raw = String(process.env.TEXTBOOK_SUBJECTS || '').trim();
  if (raw) {
    return new Set(
      raw
        .split(',')
        .map((s) => String(s || '').trim().toUpperCase())
        .filter(Boolean)
    );
  }
  return new Set([
    'AMHARIC',
    'ENGLISH',
    'MATHEMATICS',
    'BIOLOGY',
    'PHYSICS',
    'CHEMISTRY',
    'GEOGRAPHY',
    'HISTORY',
    'ICT',
    'CIVICS',
    'CIVICS_AND_ETHICAL_EDUCATION',
  ]);
}

function maxPdfBytes() {
  const raw = String(process.env.TEXTBOOK_MAX_PDF_MB || '').trim();
  const mb = raw ? Number(raw) : 25;
  if (!Number.isFinite(mb) || mb <= 0) return null;
  return Math.floor(mb * 1024 * 1024);
}

function allowChaptersSet() {
  const raw = String(process.env.TEXTBOOK_CHAPTER_SUBJECTS || '').trim();
  if (raw) {
    return new Set(
      raw
        .split(',')
        .map((s) => String(s || '').trim().toUpperCase())
        .filter(Boolean)
    );
  }
  return new Set(['ENGLISH', 'AMHARIC']);
}

function tokenize(value) {
  return normalizeSpace(value)
    .toLowerCase()
    .split(/[^a-z0-9\u1200-\u137f]+/g)
    .filter(Boolean)
    .filter((w) => w.length >= 3);
}

function chunkText(text, { maxChars = 900 } = {}) {
  const cleaned = String(text || '').replace(/\r/g, '').trim();
  const parts = cleaned.split(/\n{2,}/).map((p) => normalizeSpace(p)).filter(Boolean);
  const chunks = [];
  let buf = '';
  for (const p of parts) {
    if (!buf) {
      buf = p;
      continue;
    }
    if (buf.length + 1 + p.length <= maxChars) {
      buf = `${buf}\n${p}`;
      continue;
    }
    chunks.push(buf);
    buf = p;
  }
  if (buf) chunks.push(buf);
  return chunks.filter((c) => c.length >= 60);
}

async function download(url, destPath) {
  const res = await fetchWithTimeout(url, {}, 30000);
  if (!res.ok) throw new Error(`Download failed (${res.status}) ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
  return buf;
}

function extractPdfLinksFromHtml(html, baseUrl) {
  const out = new Set();
  const text = String(html || '');
  const re = /href="([^"]+?\.pdf)"/gi;
  let m = null;
  while ((m = re.exec(text))) {
    const href = m[1];
    try {
      const abs = new URL(href, baseUrl).toString();
      out.add(abs);
    } catch {
      /* ignore */
    }
  }
  return [...out];
}

function parseBookFromFilename(url) {
  const u = String(url || '');
  const name = decodeURIComponent(u.split('/').pop() || '');
  const match = name.match(/^Grade_(\d+)_Subject_([A-Z0-9_]+)_(?:Chapter_(\d+)_)?Language_([A-Z]+)_Retrieved_(\d{8})\.pdf$/i);
  if (!match) return null;
  const grade = Number(match[1]);
  const subjectRaw = match[2];
  const chapter = match[3] ? Number(match[3]) : null;
  const langRaw = match[4];
  const retrieved = match[5];
  const allowed = allowedSubjectsSet();
  if (!allowed.has(subjectRaw.toUpperCase())) return null;
  const kindFlags = name.toUpperCase();
  if (kindFlags.includes('CHAPTER_') && !allowChaptersSet().has(subjectRaw.toUpperCase())) return null;
  if (kindFlags.includes('TEACHER_GUIDE')) return null;
  if (kindFlags.includes('CURRICULUM')) return null;
  if (kindFlags.includes('SUPPLEMENTARY')) return null;
  const language =
    langRaw.toUpperCase() === 'AMHARIC' ? 'am' : langRaw.toUpperCase() === 'ENGLISH' ? 'en' : langRaw.toLowerCase();
  const subject = titleCaseWords(subjectRaw.replace(/_/g, ' '));
  const id = chapter ? `g${grade}_${safeFilename(subject)}_${language}_ch${chapter}` : `g${grade}_${safeFilename(subject)}_${language}`;
  const title = chapter
    ? `${subject} Student Textbook Grade ${grade} (Chapter ${chapter})`
    : `${subject} Student Textbook Grade ${grade}`;
  return { id, grade, subject, language, title, url, retrieved, chapter };
}

async function expandDirectorySource(dirSource) {
  const baseUrl = String(dirSource?.url || '').trim();
  if (!baseUrl) return [];
  const res = await fetchWithTimeout(baseUrl, {}, 20000);
  if (!res.ok) throw new Error(`Directory fetch failed (${res.status}) ${baseUrl}`);
  const html = await res.text();
  const links = extractPdfLinksFromHtml(html, baseUrl);
  const bestByKey = new Map();
  for (const link of links) {
    const parsed = parseBookFromFilename(link);
    if (!parsed) continue;
    const key = `${parsed.grade}|${parsed.subject}|${parsed.language}|${parsed.chapter || 'full'}`;
    const existing = bestByKey.get(key);
    if (!existing || String(parsed.retrieved) > String(existing.retrieved)) {
      bestByKey.set(key, parsed);
    }
  }
  return [...bestByKey.values()].map(({ retrieved, chapter, ...rest }) => rest);
}

function buildBookKeywords(source, topChunks) {
  const base = `${source.grade || ''} ${source.subject || ''} ${source.title || ''} ${source.language || ''}`;
  const tokens = tokenize(base);
  const freq = new Map();
  for (const c of topChunks) {
    for (const w of tokenize(c)) {
      freq.set(w, (freq.get(w) || 0) + 1);
    }
  }
  const fromText = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([w]) => w);
  return [...new Set([...tokens, ...fromText])].slice(0, 36);
}

async function buildOne(source) {
  const url = String(source.url || '').trim();
  if (!url) return null;

  ensureDir(CACHE_DIR);
  const filename = `${safeFilename(source.id || source.title || 'book')}.pdf`;
  const cachedPath = path.join(CACHE_DIR, filename);
  const hasCached = fs.existsSync(cachedPath);
  const maxBytes = maxPdfBytes();
  if (hasCached && maxBytes) {
    try {
      const size = fs.statSync(cachedPath).size;
      if (size && size > maxBytes) {
        try {
          fs.unlinkSync(cachedPath);
        } catch {
          /* ignore */
        }
        return null;
      }
    } catch {
      /* ignore */
    }
  }
  if (!hasCached && maxBytes) {
    try {
      const head = await fetchWithTimeout(url, { method: 'HEAD' }, 15000);
      const len = Number(head.headers.get('content-length') || '0');
      if (len && len > maxBytes) return null;
    } catch {
      /* ignore */
    }
  }
  let pdfBuffer = hasCached ? fs.readFileSync(cachedPath) : await download(url, cachedPath);

  let data = null;
  try {
    data = await pdfParse(pdfBuffer);
  } catch (err) {
    if (hasCached) {
      try {
        fs.unlinkSync(cachedPath);
      } catch {
        /* ignore */
      }
      pdfBuffer = await download(url, cachedPath);
      data = await pdfParse(pdfBuffer);
    } else {
      throw err;
    }
  }
  const chunks = chunkText(data.text);

  if (!chunks.length) return null;

  const outId = safeFilename(source.id || source.title || filename);
  const chunksFile = `${outId}.json`;
  const outPath = path.join(OUT_DIR, chunksFile);

  const content = chunks.map((text, i) => ({
    id: `${outId}_${i + 1}`,
    text,
  }));

  fs.writeFileSync(outPath, JSON.stringify({ id: outId, chunks: content }, null, 2), 'utf8');

  const keywords = buildBookKeywords(source, chunks.slice(0, 80));

  return {
    id: outId,
    grade: source.grade,
    subject: source.subject,
    language: source.language,
    title: source.title,
    url,
    keywords,
    chunksFile,
    chunkCount: content.length,
  };
}

async function main() {
  ensureDir(OUT_DIR);

  if (!fs.existsSync(SOURCES_PATH)) {
    throw new Error(`Missing ${SOURCES_PATH}`);
  }

  const raw = JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf8'));
  const sources = Array.isArray(raw.sources) ? raw.sources : [];
  const expanded = [];
  for (const src of sources) {
    if (!src?.url) continue;
    if (isDirectorySource(src)) {
      try {
        const items = await expandDirectorySource(src);
        expanded.push(...items);
      } catch (err) {
        process.stderr.write(`${String(src?.title || src?.id || 'directory')}: ${err.message}\n`);
      }
      continue;
    }
    expanded.push(src);
  }

  const books = [];
  for (const src of expanded) {
    try {
      const built = await buildOne(src);
      if (built) books.push(built);
    } catch (err) {
      process.stderr.write(`${String(src?.title || src?.id || 'book')}: ${err.message}\n`);
    }
  }

  const manifestPath = path.join(OUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({ generatedAt: new Date().toISOString(), books }, null, 2), 'utf8');
  process.stdout.write(`Built ${books.length} textbook indexes into ${OUT_DIR}\n`);
}

main().catch((err) => {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
});
