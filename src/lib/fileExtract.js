/** Client-side text extraction for uploaded study files (.docx, .pptx, plain text). */
import { unzipSync, strFromU8 } from 'fflate';

const MAX_CHARS = 20000;

const TEXTY_EXT = /\.(txt|md|markdown|csv|tsv|json|xml|yaml|yml|html?|log|ini|js|jsx|ts|tsx|py|java|c|cpp|h|cs|sql)$/i;
const LEGACY_OFFICE_EXT = /\.(doc|xlsx|xls|ppt)$/i;

function capText(text) {
  if (text.length <= MAX_CHARS) return text;
  return `${text.slice(0, MAX_CHARS)}\n\n[File content truncated at ${MAX_CHARS} characters]`;
}

function decodeXmlEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** Convert WordprocessingML body XML into readable paragraphs. */
function wordXmlToText(xml) {
  return decodeXmlEntities(
    xml
      .replace(/<w:tab\b[^>]*\/?>/g, '\t')
      .replace(/<w:br\b[^>]*\/?>/g, '\n')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Pull the text runs out of a PowerPoint slide XML. */
function slideXmlToText(xml) {
  const runs = [];
  let m;
  const re = /<a:t>([\s\S]*?)<\/a:t>/g;
  while ((m = re.exec(xml)) !== null) runs.push(decodeXmlEntities(m[1]));
  return runs.join('\n');
}

async function readAsText(file) {
  if (typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Could not read the file contents.'));
      reader.readAsText(file);
    } catch (err) {
      reject(new Error('Could not read the file contents.'));
    }
  });
}

async function readZip(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return unzipSync(bytes);
}

function findZipEntry(zip, testFn) {
  for (const key of Object.keys(zip)) {
    const normalized = key.replace(/^\.\//, '');
    if (testFn(normalized)) return zip[key];
  }
  return undefined;
}

export async function extractDocxText(file) {
  const zip = await readZip(file);
  if (zip['EncryptedPackage'] || zip['encryption.info']) {
    throw new Error('this .docx is password-protected, so its text cannot be opened here (remove the password or paste the text)');
  }
  let doc = findZipEntry(zip, (k) => /^word\/document\.xml$/i.test(k));
  if (!doc) {
    // Some tools store the body under a slightly different path; accept any document body.
    doc = findZipEntry(zip, (k) => k.startsWith('word/') && /document\d*\.xml$/i.test(k));
  }
  if (!doc) {
    throw new Error('this .docx looks damaged (no document body was found inside)');
  }
  const text = wordXmlToText(strFromU8(doc));
  if (!text.trim()) {
    // Last resort: pull every text run from any word/*.xml part.
    let salvage = '';
    for (const key of Object.keys(zip)) {
      const normalized = key.replace(/^\.\//, '');
      if (/^word\/.+\.xml$/i.test(normalized)) {
        salvage += `\n${wordXmlToText(strFromU8(zip[key]))}`;
      }
    }
    if (!salvage.trim()) {
      throw new Error('this .docx opened, but it holds no readable text (it may be scanned images)');
    }
    return capText(salvage.trim());
  }
  return capText(text);
}

export async function extractPptxText(file) {
  const zip = await readZip(file);
  if (zip['EncryptedPackage'] || zip['encryption.info']) {
    throw new Error('this .pptx is password-protected, so its text cannot be opened here (remove the password or paste the text)');
  }
  const slideEntries = Object.keys(zip)
    .map((k) => [k.replace(/^\.\//, ''), zip[k]])
    .filter(([k]) => /^ppt\/slides\/slide\d+\.xml$/i.test(k))
    .sort((a, b) => Number(a[0].match(/\d+/)[0]) - Number(b[0].match(/\d+/)[0]));
  if (!slideEntries.length) throw new Error('this .pptx looks damaged (no slides were found inside)');
  const parts = slideEntries.map(([k, data], i) => `Slide ${i + 1}:\n${slideXmlToText(strFromU8(data))}`);
  return capText(parts.join('\n\n'));
}

/**
 * Best-effort text extraction for any uploaded file.
 * Returns { kind, text, note }; note explains anything the user should know.
 */
export async function smartExtractFile(file) {
  const name = file?.name || '';
  try {
    if (/\.docx$/i.test(name)) {
      return { kind: 'docx', text: await extractDocxText(file), note: '' };
    }
    if (/\.pptx$/i.test(name)) {
      return { kind: 'pptx', text: await extractPptxText(file), note: '' };
    }
    if (/\.pdf$/i.test(name)) {
      return {
        kind: 'pdf',
        text: '',
        note: 'PDF text cannot be extracted in-app yet. Paste the text, or save the pages as .txt or .docx.',
      };
    }
    if (LEGACY_OFFICE_EXT.test(name)) {
      return {
        kind: 'legacy-office',
        text: '',
        note: 'Old Office formats are not readable here. Save it as .docx or .pptx first, then upload again.',
      };
    }
    if (
      TEXTY_EXT.test(name) ||
      (file.type || '').startsWith('text/') ||
      /json|xml|javascript|csv|markdown/.test(file.type || '')
    ) {
      return { kind: 'text', text: capText(await readAsText(file)), note: '' };
    }
    return {
      kind: 'unknown',
      text: '',
      note:
        'No text preview for this file type. Supported: .docx, .pptx, and plain-text files (.txt, .md, .csv).',
    };
  } catch (err) {
    console.error('[fileExtract] could not read', name, err);
    return { kind: 'error', text: '', note: err?.message || 'Could not read this file.' };
  }
}