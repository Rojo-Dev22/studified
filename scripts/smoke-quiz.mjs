/**
 * Quiz Me smoke test + engine invariant checks.
 *
 * 1. Unit-level: loads the runtime data via fs and asserts the quiz engine's
 *    invariants (all 8 Grade 9 subjects, topic filtering, All Topics, count
 *    capping, no repeats, shuffle safety, difficulty balance, XP/score math,
 *    invalid-question exclusion, Grades 10-12 inactivity).
 * 2. SSR-renders the /quiz-me page through Vite (react plugin only) to
 *    surface runtime crashes.
 *
 * Usage: node scripts/smoke-quiz.mjs
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(process.cwd());
const DATA_DIR = path.join(ROOT, 'public', 'quiz_data');

const watchdog = setTimeout(() => {
  console.error('WATCHDOG: smoke-quiz exceeded 180s - aborting');
  process.exit(2);
}, 180000);
watchdog.unref();

let passed = 0;
let failed = 0;
function check(name, cond, detail = '') {
  if (cond) {
    passed += 1;
    console.log(`  PASS ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL ${name}${detail ? ` - ${detail}` : ''}`);
  }
}

const readJSON = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

/* Stub fetch so /quiz_data/* resolves from disk inside node (SSR + tests). */
const realFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  const u = String(url);
  if (u.startsWith('/quiz_data/') || u.includes('/quiz_data/')) {
    const rel = u.split('/quiz_data/')[1].split('?')[0];
    const file = path.join(DATA_DIR, rel);
    if (!fs.existsSync(file)) return { ok: false, status: 404, json: async () => ({}) };
    const text = fs.readFileSync(file, 'utf8');
    return { ok: true, status: 200, json: async () => JSON.parse(text) };
  }
  return realFetch(url);
};

async function unitTests() {
  console.log('\n== Unit: quiz engine invariants ==');
  const engineUrl = pathToFileURL(path.join(ROOT, 'src/lib/quiz/engine.js')).href;
  const validationUrl = pathToFileURL(path.join(ROOT, 'src/lib/quiz/validation.js')).href;
  const catalogUrl = pathToFileURL(path.join(ROOT, 'src/lib/quiz/catalogService.js')).href;
  const scoringUrl = pathToFileURL(path.join(ROOT, 'src/lib/quiz/scoring.js')).href;
  const configUrl = pathToFileURL(path.join(ROOT, 'src/lib/quiz/config.js')).href;

  const engine = await import(engineUrl);
  const { validateBank } = await import(validationUrl);
  const catalog = await import(catalogUrl);
  const { scoreSession, buildReview } = await import(scoringUrl);
  const config = await import(validationUrl.replace('validation.js', 'config.js'));

  const subjectsData = readJSON(path.join(DATA_DIR, 'subjects.json'));
  const topicsData = readJSON(path.join(DATA_DIR, 'topics.json'));
  const indexData = readJSON(path.join(DATA_DIR, 'question_index.json'));

  // 1. Grade 9 only is active.
  check('ACTIVE_GRADE is 9', config.ACTIVE_GRADE === 9);
  check('architecture supports grades 9-12', JSON.stringify(config.SUPPORTED_GRADES) === '[9,10,11,12]');
  const g9 = catalog.getUsableSubjects({ subjectsData, indexData, grade: 9 });
  const g10 = catalog.getUsableSubjects({ subjectsData, indexData, grade: 10 });
  const g12 = catalog.getUsableSubjects({ subjectsData, indexData, grade: 12 });
  check('Grade 9 exposes 8 usable subjects', g9.length === 8, `got ${g9.length}`);
  check('Grade 10 is inactive (0 subjects)', g10.length === 0);
  check('Grade 12 is inactive (0 subjects)', g12.length === 0);
  check('index only contains grade 9', Object.keys(indexData.grades).join(',') === '9');

  for (const subject of g9) {
    const entry = catalog.getIndexEntry(indexData, 9, subject.id);
    const bank = readJSON(path.join(DATA_DIR, entry.file));
    const topics = catalog.getTopicsForGrade(topicsData, 9, subject.id);
    const ctx = { bank, grade: 9, subject: { id: subject.id, name: subject.name }, topicsForSubject: topics };

    // 2. All Topics: full pool usable, index counts match the engine.
    const full = engine.createQuizSessionFromBank({ ...ctx, topicId: 'all', requestedCount: 999 });
    check(`${subject.id}: All Topics caps to real availability (${entry.totalQuestions})`, full.count === entry.totalQuestions, `got ${full.count}`);

    // 3. No duplicates within a quiz; every runtime question intact.
    const ids = new Set(full.questions.map((q) => q.sourceId));
    check(`${subject.id}: no repeated questions`, ids.size === full.count);
    const intact = full.questions.every(
      (q) => q.options.length === 4 && new Set(q.options.map((o) => o.id)).size === 4 && q.options.some((o) => o.id === q.correctOptionId) && q.explanation,
    );
    check(`${subject.id}: runtime questions well-formed + correct answer present`, intact);

    // 4. Shuffle safety: correct answer text must match the bank's answer,
    //    and option order must actually vary across sessions.
    const rawById = new Map(bank.questions.map((q) => [q.id, q]));
    const answersStillCorrect = full.questions.every(
      (q) => q.options.find((o) => o.id === q.correctOptionId).text === rawById.get(q.sourceId).correctAnswer,
    );
    check(`${subject.id}: correct answers stay correct after shuffling`, answersStillCorrect);
    const bankOrder = rawById.get(full.questions[0].sourceId).options.join('|');
    let orderVaries = false;
    for (let i = 0; i < 12 && !orderVaries; i += 1) {
      const s = engine.createQuizSessionFromBank({ ...ctx, topicId: 'all', requestedCount: 1 });
      if (s.questions[0].options.map((o) => o.text).join('|') !== bankOrder) orderVaries = true;
    }
    check(`${subject.id}: option order is shuffled at runtime`, orderVaries);

    // 5. Specific topic filtering + request capping inside a topic.
    const smallest = Object.entries(entry.topics).sort((a, b) => a[1] - b[1])[0];
    const single = engine.createQuizSessionFromBank({ ...ctx, topicId: smallest[0], requestedCount: 50 });
    check(`${subject.id}: topic filter caps to topic availability`, single.count === smallest[1], `${smallest[0]} got ${single.count}`);
    check(`${subject.id}: topic-filtered questions all belong to the topic`, single.questions.every((q) => q.topicId === smallest[0]));

    // 6. Difficulty balancing when the pool allows.
    const balanced = engine.createQuizSessionFromBank({ ...ctx, topicId: 'all', requestedCount: 30 });
    const byDiff = { easy: 0, medium: 0, hard: 0 };
    balanced.questions.forEach((q) => { byDiff[q.difficulty] += 1; });
    check(`${subject.id}: 30-question quiz is difficulty-balanced (10/10/10)`, byDiff.easy === 10 && byDiff.medium === 10 && byDiff.hard === 10, JSON.stringify(byDiff));

    // 7. XP math + scoring + review.
    const answersCorrect = {};
    full.questions.forEach((q) => { answersCorrect[q.sourceId] = q.correctOptionId; });
    const perfect = scoreSession(full, answersCorrect);
    check(`${subject.id}: perfect score -> 100% + XP equals difficulty sum`, perfect.percent === 100 && perfect.xpEarned === full.questions.reduce((s, q) => s + q.xp, 0), `xp ${perfect.xpEarned}`);
    const answersHalf = {};
    full.questions.forEach((q, i) => { if (i % 2 === 0) answersHalf[q.sourceId] = q.correctOptionId; });
    const half = scoreSession(full, answersHalf);
    check(`${subject.id}: half-correct -> split + proportional XP`, half.correct === Math.ceil(full.count / 2) && half.incorrect === full.count - half.correct && half.xpEarned < perfect.xpEarned);
    const empty = scoreSession(full, {});
    check(`${subject.id}: unanswered quiz -> 0% and no XP`, empty.percent === 0 && empty.xpEarned === 0);
    check(`${subject.id}: review rows carry explanation + correct text`, buildReview(full, answersCorrect).every((r) => r.explanation && r.correctText));

    // 8. Anti-repetition: sessions avoid recently-served questions.
    const firstSession = engine.createQuizSessionFromBank({ ...ctx, topicId: 'all', requestedCount: 20 });
    const firstIds = firstSession.questions.map((q) => q.sourceId);
    const nextSession = engine.createQuizSessionFromBank({ ...ctx, topicId: 'all', requestedCount: 20, recentIds: firstIds });
    const overlap = nextSession.questions.filter((q) => firstIds.includes(q.sourceId)).length;
    check(`${subject.id}: no repeats when plenty of fresh questions remain (0/${firstIds.length} overlap)`, overlap === 0, `${overlap} overlap`);
    // Even after 10 consecutive quizzes on the same subject, within one quiz no question repeats.
    let rolling = [];
    let noDupesAcrossSessions = true;
    for (let i = 0; i < 10; i += 1) {
      const s = engine.createQuizSessionFromBank({ ...ctx, topicId: 'all', requestedCount: 20, recentIds: rolling });
      if (new Set(s.questions.map((q) => q.sourceId)).size !== s.count) noDupesAcrossSessions = false;
      rolling = [...rolling, ...s.questions.map((q) => q.sourceId)];
    }
    check(`${subject.id}: 10 back-to-back quizzes never repeat within a quiz`, noDupesAcrossSessions);
  }

  return { engine, validateBank, catalog, scoreSession, buildReview, config, subjectsData, topicsData, indexData, g9 };
}

async function invalidAndErrorTests({ engine, validateBank, catalog, topicsData }) {
  console.log('\n== Unit: invalid questions & error handling ==');

  // Invalid questions are excluded, never crash, and the source file is untouched.
  const bioBank = readJSON(path.join(DATA_DIR, 'biology', 'biology_grade9.json'));
  const tampered = JSON.parse(JSON.stringify(bioBank));
  tampered.questions[0].options = ['a', 'b', 'c'];
  tampered.questions[1].correctAnswer = 'not-an-option';
  tampered.questions[2].difficulty = 'impossible';
  const bioTopics = catalog.getTopicsForGrade(topicsData, 9, 'biology');
  const v = validateBank(tampered, { grade: 9, subjectId: 'biology', subjectName: 'Biology', topicsForSubject: bioTopics });
  check('tampered bank: 3 invalid questions excluded', v.invalid.length === 3 && v.valid.length === bioBank.questions.length - 3);
  check('tampered bank: original file untouched', readJSON(path.join(DATA_DIR, 'biology', 'biology_grade9.json')).questions[0].options.length === 4);

  // Typed errors for empty pools.
  let threwTopic = false;
  try {
    engine.createQuizSessionFromBank({ bank: bioBank, grade: 9, subject: { id: 'biology', name: 'Biology' }, topicsForSubject: bioTopics, topicId: 'nonexistent-topic', requestedCount: 5 });
  } catch (err) {
    threwTopic = err.code === 'NO_QUESTIONS_FOR_TOPIC';
  }
  check('unknown topic -> typed NO_QUESTIONS_FOR_TOPIC error', threwTopic);

  const emptyBank = { subject: 'Biology', grade: 9, questions: [] };
  let threwEmpty = false;
  try {
    engine.createQuizSessionFromBank({ bank: emptyBank, grade: 9, subject: { id: 'biology', name: 'Biology' }, topicsForSubject: bioTopics, topicId: 'all', requestedCount: 5 });
  } catch (err) {
    threwEmpty = err.code === 'NO_VALID_QUESTIONS';
  }
  check('empty bank -> typed NO_VALID_QUESTIONS error', threwEmpty);

  // History util is SSR-safe and round-trips.
  const historyUrl = pathToFileURL(path.join(ROOT, 'src/lib/quiz/history.js')).href;
  const history = await import(historyUrl);
  check('getQuizHistory is SSR-safe (no localStorage)', Array.isArray(history.getQuizHistory()));
}

async function ssrTest() {
  console.log('\n== SSR: /quiz-me page renders ==');
  const server = await createServer({
    root: ROOT,
    configFile: false,
    logLevel: 'error',
    // Own dependency-optimizer cache so a concurrently running `npm run dev`
    // (which shares node_modules/.vite) can never stall this SSR run.
    cacheDir: path.join(ROOT, 'node_modules', '.vite-smoke'),
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    plugins: [react()],
    resolve: {
      alias: [
        // Headless-hostile modules (db init chain / firebase cloud calls) are
        // stubbed the same way smoke-games.mjs avoids the base44/groq plugins.
        { find: '@/lib/db', replacement: path.join(ROOT, 'scripts/quiz-test-stubs/db-stub.mjs') },
        { find: '@/lib/achievementChecker', replacement: path.join(ROOT, 'scripts/quiz-test-stubs/achievement-stub.mjs') },
        { find: '@', replacement: path.join(ROOT, 'src') },
      ],
    },
  });

  try {
    const { default: QuizMe } = await server.ssrLoadModule('/src/pages/QuizMe.jsx');
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } } });
    // Seed the config caches so SSR renders the real, data-driven grade step.
    qc.setQueryData(['quizme', 'subjects'], readJSON(path.join(DATA_DIR, 'subjects.json')));
    qc.setQueryData(['quizme', 'index'], readJSON(path.join(DATA_DIR, 'question_index.json')));
    const raw = renderToString(
      React.createElement(
        QueryClientProvider,
        { client: qc },
        React.createElement(MemoryRouter, { initialEntries: ['/quiz-me'] }, React.createElement(QuizMe)),
      ),
    );
    // React SSR inserts <!-- --> markers between text nodes — strip for text checks.
    const html = raw.replace(/<!--.*?-->/g, '');
    check('page renders', html.length > 500);
    check('page shows Quiz Me header', html.includes('Quiz Me'));
    check('flow starts at the grade step', html.includes('Choose a grade'));
    check('Grade 9 is offered as a selectable option', html.includes('Grade 9'));
    check('Grades 10-12 are offered (architecturally ready)', html.includes('Grade 10') && html.includes('Grade 11') && html.includes('Grade 12'));
    check('exactly 3 grades are ghosted as unavailable', (html.match(/Not available right now/g) || []).length === 3);
    check('one step at a time — subjects hidden until a grade is chosen', !html.includes('Biology') && !html.includes('Chemistry'));
    check('no Continue button before a choice is made', !html.includes('Continue'));
  } finally {
    await server.close();
  }
}

const unitCtx = await unitTests();
await invalidAndErrorTests(unitCtx);
let ssrFailed = 0;
try {
  await ssrTest();
} catch (err) {
  console.error('SSR test crashed:', err);
  ssrFailed = 1;
}
console.log(`\nSmoke results: ${passed} passed, ${failed + ssrFailed} failed`);
process.exit(failed + ssrFailed ? 1 : 0);

