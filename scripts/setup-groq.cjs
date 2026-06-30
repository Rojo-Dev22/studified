/**
 * One-time Groq setup: saves API key to .env.local and verifies the connection.
 * Get a free key: https://console.groq.com/keys
 *
 * Usage: npm run setup:groq
 *    or: npm run setup:groq -- gsk_your_key_here
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');
const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function testKey(apiKey) {
  const res = await fetch(GROQ_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
      max_tokens: 16,
      temperature: 0,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try {
      msg = JSON.parse(text)?.error?.message || text;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return JSON.parse(text);
}

function writeEnv(apiKey) {
  const content = `# Groq AI — https://console.groq.com
# Server-side key (used by Vite dev proxy — not exposed in browser bundle)
GROQ_API_KEY=${apiKey}
# Optional browser key (only if you deploy without a backend proxy)
VITE_GROQ_API_KEY=${apiKey}
VITE_GROQ_MODEL=${MODEL}
`;
  fs.writeFileSync(ENV_PATH, content, 'utf8');
}

async function main() {
  console.log('\n  Studified — Groq setup\n');
  console.log('  Free API keys: https://console.groq.com/keys\n');

  let apiKey = process.argv[2]?.trim();

  if (!apiKey) {
    if (fs.existsSync(ENV_PATH)) {
      const existing = fs.readFileSync(ENV_PATH, 'utf8');
      const match = existing.match(/GROQ_API_KEY=(gsk_[^\s#]+)/);
      if (match) apiKey = match[1];
    }
  }

  if (!apiKey) {
    apiKey = await ask('  Paste your Groq API key (gsk_...): ');
  }

  if (!apiKey || !apiKey.startsWith('gsk_')) {
    console.error('\n  Invalid key. It should start with gsk_\n');
    process.exit(1);
  }

  process.stdout.write('  Testing connection... ');
  try {
    await testKey(apiKey);
    console.log('OK\n');
  } catch (err) {
    console.log('FAILED\n');
    console.error(`  ${err.message}\n`);
    process.exit(1);
  }

  writeEnv(apiKey);
  console.log(`  Saved to ${ENV_PATH}`);
  console.log('  Restart the dev server: npm run dev');
  console.log('  Then open AI Tools and generate.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
