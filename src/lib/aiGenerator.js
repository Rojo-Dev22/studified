/** Local study-content generator (used when no remote LLM is available). */

function extractTopic(prompt) {
  const match = prompt.match(/about:\s*"([^"]+)"/i)
    || prompt.match(/studying:\s*"([^"]+)"/i)
    || prompt.match(/for:\s*"([^"]+)"/i);
  return (match?.[1] || 'your topic').trim();
}

const QUIZ_POOL = [
  { q: 'What is the main focus of {topic}?', opts: ['Core concepts and principles', 'Topics not in the syllabus', 'Irrelevant examples', 'None of the above'], ans: 0 },
  { q: 'Which study method matches preparation for {topic}?', opts: ['Active recall with practice', 'Only rereading without practice', 'Skipping units', 'Cramming without understanding'], ans: 0 },
  { q: 'A common mistake in {topic} is:', opts: ['Memorizing without understanding concepts', 'Using units correctly', 'Linking to real examples', 'Spacing review over days'], ans: 0 },
  { q: 'To master {topic}, you should:', opts: ['Explain ideas in your own words', 'Avoid all practice questions', 'Ignore teacher feedback', 'Study only the night before exams'], ans: 0 },
  { q: 'The best next step after a {topic} lesson is:', opts: ['Do 3 new practice questions', 'Never revisit the unit', 'Skip the review checklist', 'Ignore objectives'], ans: 0 },
];

export function generateQuizJSON(topic) {
  const t = topic || 'this subject';
  const questions = [];
  for (let i = 0; i < 15; i++) {
    const item = QUIZ_POOL[i % QUIZ_POOL.length];
    const labels = ['a', 'b', 'c', 'd'];
    const question = item.q.replace(/\{topic\}/g, t) + (i >= 5 ? ` — Q${i + 1}` : '');
    const options = item.opts.map((opt, j) => ({
      id: labels[j],
      text: opt.replace(/\{topic\}/g, t),
    }));
    questions.push({
      id: i + 1,
      text: question,
      options,
      correct: [labels[item.ans]],
    });
  }
  return { title: `Quiz: ${t}`, questions };
}

export function generateQuiz(topic) {
  const t = topic || 'this subject';
  let md = `## Quiz: ${t}\n\n`;
  QUIZ_POOL.forEach((item, i) => {
    const question = item.q.replace(/\{topic\}/g, t);
    const labels = ['A', 'B', 'C', 'D'];
    md += `**${i + 1}.** ${question}\n`;
    item.opts.forEach((opt, j) => {
      const text = opt.replace(/\{topic\}/g, t);
      md += `- ${labels[j]}) ${text}${j === item.ans ? ' ✓' : ''}\n`;
    });
    md += '\n';
  });
  md += `---\n**Answer key:** ${QUIZ_POOL.map((item, i) => `${i + 1}-${['A', 'B', 'C', 'D'][item.ans]}`).join(', ')}\n`;
  return md;
}

function normalizeSpace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function stripBullet(line) {
  return normalizeSpace(String(line || '').replace(/^\s*(?:[-*•]|\d+[\)\.])\s*/g, ''));
}

function truncate(value, n) {
  const s = normalizeSpace(value);
  if (s.length <= n) return s;
  return `${s.slice(0, n - 1).trim()}…`;
}

function uniquePairs(pairs) {
  const seen = new Set();
  const out = [];
  for (const [front, back] of pairs) {
    const f = normalizeSpace(front);
    const b = normalizeSpace(back);
    if (!f || !b) continue;
    const key = `${f.toLowerCase()}|${b.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push([f, b]);
  }
  return out;
}

function extractPairsFromNotes(text) {
  const raw = String(text || '');
  const lines = raw.split('\n').map(stripBullet).filter(Boolean);
  const sentenceBits = raw
    .replace(/\r/g, '')
    .split(/[.!?]\s+/)
    .map(stripBullet)
    .filter((s) => s.length >= 18);

  const candidates = uniquePairs([...lines, ...sentenceBits].map((s) => [s, s])).map(([s]) => s);
  const pairs = [];

  for (const s of candidates) {
    const colon = s.match(/^(.{2,80}?)\s*:\s*(.{8,300})$/);
    if (colon) {
      pairs.push([`Define ${normalizeSpace(colon[1])}.`, normalizeSpace(colon[2])]);
      continue;
    }
    const dash = s.match(/^(.{2,80}?)\s*[-–—]\s*(.{8,300})$/);
    if (dash) {
      pairs.push([`Define ${normalizeSpace(dash[1])}.`, normalizeSpace(dash[2])]);
      continue;
    }
    const def = s.match(/^(.{3,80}?)\s+(is|are|means|refers to)\s+(.{8,300})$/i);
    if (def) {
      pairs.push([`What does "${normalizeSpace(def[1])}" mean?`, normalizeSpace(def[3])]);
      continue;
    }
    if (s.length >= 30) {
      pairs.push([`Explain: ${truncate(s, 70)}`, s]);
    }
    if (pairs.length >= 10) break;
  }

  return uniquePairs(pairs).slice(0, 10);
}

function titleFromInput(input) {
  const raw = String(input || '').replace(/\r/g, '').trim();
  if (!raw) return 'Flashcards';
  const lines = raw
    .split('\n')
    .map(stripBullet)
    .filter(Boolean)
    .filter((l) => l.length >= 2);
  const head = lines[0] || raw;
  return truncate(head, 72);
}

function topicKeywords(topic) {
  const words = normalizeSpace(topic)
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);
  const stop = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'of',
    'to',
    'in',
    'on',
    'for',
    'with',
    'from',
    'about',
    'notes',
    'topic',
    'lesson',
    'unit',
    'chapter',
    'grade',
  ]);
  return words.filter((w) => w.length >= 3 && !stop.has(w)).slice(0, 6);
}

function templatePairs(topic) {
  const t = normalizeSpace(topic || 'this topic');
  const lower = t.toLowerCase();
  const keys = topicKeywords(t);
  const k = keys[0] ? keys[0] : t;
  const pairs = [
    [`Define ${t}.`, `Expected: a clear definition of ${t}, key terms, and one example from the unit.`],
    [`List 3 key terms linked to ${t}.`, `Expected: three vocabulary terms, each with a one-line meaning and where it appears in ${t}.`],
    [`What are 2 common exam questions on ${t}?`, `Expected: two question patterns (definition/diagram/calculation/essay) and what the marker expects.`],
    [`What is the most important cause → effect chain in ${t}?`, `Expected: the main causes, the mechanism, and the outcomes (use Ethiopian examples where relevant).`],
    [`Compare ${t} with a closely related concept.`, `Expected: similarities and differences (2–3 points), and when each is used.`],
    [`Give one Ethiopia-linked example for ${t}.`, `Expected: a local example (place/event/economy/agriculture) and why it fits ${t}.`],
    [`What diagram/table/graph is commonly used in ${t}?`, `Expected: what it shows, labels/units, and one interpretation.`],
    [`Write one important rule/formula/fact for ${t}.`, `Expected: the exact statement, what each term means, and when to apply it.`],
    [`What misconception do students have about ${t}?`, `Expected: the wrong idea and the correct explanation using ${k}.`],
    [`Summarize ${t} in 3 bullets.`, `Expected: three short bullets: definition, key process/idea, importance/application.`],
  ];

  if (lower.includes('war') || lower.includes('battle') || lower.includes('revolution') || lower.includes('empire')) {
    pairs[3] = [
      `What are the main causes of ${t}?`,
      'Expected: immediate and underlying causes, key actors, and evidence (dates/events) from the unit.',
    ];
    pairs[7] = [
      `Name 3 major events in ${t}.`,
      'Expected: three events in order, each with a date/place and its significance.',
    ];
  }

  if (lower.includes('constitution') || lower.includes('fdre') || lower.includes('government') || lower.includes('law')) {
    pairs[4] = [
      `How is power structured in ${t}?`,
      'Expected: the branches/levels of government and what each is responsible for.',
    ];
    pairs[7] = [
      `List 3 rights or duties linked to ${t}.`,
      'Expected: name each right/duty and give one example of how it applies.',
    ];
  }

  if (
    lower.includes('biology') ||
    lower.includes('cell') ||
    lower.includes('photosynth') ||
    lower.includes('respiration') ||
    lower.includes('genetic')
  ) {
    pairs[7] = [
      `Write one key equation/step sequence for ${t}.`,
      'Expected: the correct equation or ordered steps and what each part represents.',
    ];
  }

  return pairs.slice(0, 10);
}

export function generateFlashcardsJSON(topicOrText) {
  const raw = String(topicOrText || '').trim();
  const titleBase = titleFromInput(raw || 'Flashcards');
  const title = titleBase.toLowerCase().startsWith('flashcards') ? titleBase : `Flashcards: ${titleBase}`;
  const fromNotes = raw.length >= 140 || raw.includes('\n');
  const pairs = fromNotes ? extractPairsFromNotes(raw) : [];
  const filled = pairs.length >= 6 ? pairs : uniquePairs([...pairs, ...templatePairs(titleBase)]).slice(0, 10);
  return { title, cards: filled.map(([front, back]) => ({ front, back })) };
}

export function generateSummary(topic) {
  const t = topic || 'your topic';
  return `## Study Notes: ${t}
*Professor Amare's Expert Study Guide*

### Overview
${t} is a fascinating topic that connects to many areas of your curriculum. Let's build a deep understanding — not just memorize facts.

### Core Concepts
1. **Definition**: Start by defining ${t} in your own words. Check your MoE textbook for the precise definition.
2. **Why It Matters**: ${t} helps us understand [real-world application — think of an Ethiopian example].
3. **Key Principles**: Break down the main rules, formulas, or processes step by step.

### Step-by-Step Walkthrough
Walk through the main process or chain of reasoning for ${t}:
1. First, identify the core components
2. Then, understand how they relate to each other
3. Finally, apply this understanding to a practice problem

### Common Mistakes & Misconceptions
- ❌ **Mistake 1**: Memorizing without understanding the \`why\` behind each step
- ❌ **Mistake 2**: Confusing related terms — compare definitions carefully
- ✅ **Fix**: Explain each concept aloud in your own words before moving on

### Professor's Challenge Questions
1. How would you explain ${t} to a classmate who missed the lesson?
2. What real-world situation uses ${t} in a way that surprised you?
3. Can you connect ${t} to something you learned in a different subject?

### Review Checklist
- [ ] Read the section in your MoE textbook
- [ ] Write the key definition from memory
- [ ] Complete **3 practice questions** without looking at notes
- [ ] Teach the concept to someone else
- [ ] Review again in 24 hours and after 3 days`;
}

export function generateFlashcards(topic) {
  const t = topic || 'your topic';
  const pairs = [
    [`What is the foundation of ${t}?`, 'The core definitions and principles your unit is built on.'],
    [`Name one real-world application of ${t}.`, 'Any valid example connecting theory to practice (check your textbook).'],
    [`What is a common exam question type in ${t}?`, 'Application problems that combine two or more concepts.'],
    [`How do you test if you truly understand ${t}?`, 'Explain it without notes and solve a novel practice problem.'],
    [`What vocabulary must you know for ${t}?`, 'List the 10 most frequent terms from your lectures and define each.'],
    [`What is the hardest subtopic in ${t} for most students?`, 'The section with the most multi-step reasoning — spend extra time there.'],
    [`What study mistake should you avoid in ${t}?`, 'Passive rereading without practice or self-testing.'],
    [`How does ${t} connect to last unit?`, 'Identify the prerequisite concept and write the link in one sentence.'],
    [`What is one mnemonic for ${t}?`, 'Create a phrase or image that triggers the main formula or idea.'],
    [`What will you review tomorrow about ${t}?`, 'The top 3 ideas you were unsure about today.'],
  ];
  return pairs.map(([q, a]) => `**Q:** ${q}\n**A:** ${a}`).join('\n\n');
}

export function generateStudyContent(prompt) {
  const lower = (prompt || '').toLowerCase();
  const topic = extractTopic(prompt);
  if (lower.includes('flashcard')) return JSON.stringify(generateFlashcardsJSON(topic));
  if (lower.includes('summar') || lower.includes('notes')) return generateSummary(topic);
  return JSON.stringify(generateQuizJSON(topic));
}
