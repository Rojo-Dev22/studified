/**
 * End-to-end HTTP smoke test for Quiz Me.
 *
 * Unlike scripts/smoke-quiz.mjs (which reads the data from disk), this runs the
 * REAL data layer + quiz engine over HTTP against a running server — e.g. a
 * production `vite preview` of dist/ (which is what students will actually hit).
 *
 * It shims global fetch only to give relative /quiz_data/* URLs a host; the
 * application modules themselves are imported completely unmodified.
 *
 * Usage:
 *   node scripts/smoke-quiz-http.mjs [baseUrl]     # default http://localhost:4319
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE = (process.argv[2] || 'http://localhost:4319').replace(/\/$/, '');
const ROOT = path.resolve(process.cwd());

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

/* Prefix relative quiz-data requests with the server origin. */
const realFetch = globalThis.fetch;
globalThis.fetch = (url, init) => {
  const u = String(url);
  return realFetch(u.startsWith('/quiz_data/') ? BASE + u : u, init);
};

const mod = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);

console.log(`\n== HTTP end-to-end: ${BASE} ==`);

const catalog = await mod('src/lib/quiz/catalogService.js');
const engine = await mod('src/lib/quiz/engine.js');
const { ACTIVE_GRADE } = await mod('src/lib/quiz/config.js');

// 1. The three configuration files load over HTTP.
const subjectsData = await catalog.loadSubjects();
check('subjects.json loads over HTTP', Array.isArray(subjectsData.subjects) && subjectsData.subjects.length === 8);

const topicsData = await catalog.loadTopics();
check('topics.json loads over HTTP', !!topicsData.grades?.['9']);

const indexData = await catalog.loadQuestionIndex();
check('question_index.json loads over HTTP', !!indexData.grades?.['9']);
check('question_index.json exposes only Grade 9', Object.keys(indexData.grades).join(',') === '9');

// 2. Grade 9 subjects come from subjects.json (+ index availability).
const usable = catalog.getUsableSubjects({ subjectsData, indexData, grade: ACTIVE_GRADE });
check('8 usable Grade 9 subjects over HTTP', usable.length === 8, `got ${usable.length}`);
check('no Grade 10-12 subjects resolvable', catalog.getUsableSubjects({ subjectsData, indexData, grade: 10 }).length === 0);

// 3. Every Grade 9 bank loads + the engine builds a real session from it.
const expected = {
  biology: 'Biology',
  chemistry: 'Chemistry',
  physics: 'Physics',
  mathematics: 'Mathematics',
  economics: 'Economics',
  geography: 'Geography',
  history: 'History',
  citizenship: 'Citizenship',
};

for (const subject of usable) {
  const topics = catalog.getTopicsForGrade(topicsData, ACTIVE_GRADE, subject.id);
  const bank = await catalog.loadQuestionBank(subject, ACTIVE_GRADE);
  const indexTotal = catalog.getSubjectAvailability(indexData, ACTIVE_GRADE, subject.id);

  check(`${subject.id}: bank loads over HTTP with a questions array`, Array.isArray(bank?.questions));
  check(`${subject.id}: topics.json supplies topics`, topics.length > 0, `${topics.length} topics`);
  check(`${subject.id}: index total ${indexTotal} matches ${bank.questions.length} questions in the bank`, indexTotal === bank.questions.length);
  check(`${subject.id}: display name matches subjects.json`, subject.name === expected[subject.id], subject.name);

  const session = await engine.createQuizSession({ subject, grade: ACTIVE_GRADE, topicId: 'all', requestedCount: 20 });
  check(`${subject.id}: engine builds a 20-question All Topics session`, session.count === 20);
  check(`${subject.id}: session has no repeated questions`, new Set(session.questions.map((q) => q.sourceId)).size === 20);
  check(
    `${subject.id}: every session question has 4 options + a valid correct answer`,
    session.questions.every((q) => q.options.length === 4 && q.options.some((o) => o.id === q.correctOptionId)),
  );

  // Topic-filtered session for the first topic with data.
  const firstTopic = topics.find((t) => (catalog.getTopicAvailability(indexData, ACTIVE_GRADE, subject.id)[t.id] || 0) > 0);
  if (firstTopic) {
    const one = await engine.createQuizSession({ subject, grade: ACTIVE_GRADE, topicId: firstTopic.id, requestedCount: 1000 });
    check(
      `${subject.id}: topic "${firstTopic.id}" filters to that topic only`,
      one.questions.length > 0 && one.questions.every((q) => q.topicId === firstTopic.id),
    );
  }
}

console.log(`\nHTTP smoke results: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);