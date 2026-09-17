#!/usr/bin/env node
/**
 * Quiz data sync + index generator (dev tool).
 *
 * Single source of truth = the authoring files at the project ROOT:
 *   subjects.json, topics.json, grade9_*_quiz_bank.json, Grade9_*_QuestionBank.json
 *
 * This script:
 *   1. Copies subjects.json + topics.json verbatim into public/quiz_data/
 *   2. Copies each question bank verbatim into its canonical location
 *      public/quiz_data/<subject>/<subject>_grade<grade>.json
 *      (canonical names come from subjects.json questionBankPattern)
 *   3. Validates every question (structure, options, correct answer,
 *      difficulty, XP) and REPORTS problems — never modifies content
 *   4. Regenerates public/quiz_data/question_index.json from the ACTUAL
 *      question banks (counts per topic via the question-ID unit ordinal,
 *      counts per difficulty). The banks always win over the index.
 *
 * Usage: node scripts/generate-quiz-index.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'quiz_data');

const DIFFICULTY_XP = { easy: 10, medium: 15, hard: 20 };
const DIFFICULTIES = ['easy', 'medium', 'hard'];

// Keyword used to locate a subject's authoring bank file(s) at the project root.
const SUBJECT_KEYWORDS = {
  biology: /bio/i,
  chemistry: /chem/i,
  physics: /phys/i,
  mathematics: /math/i,
  economics: /econ/i,
  geography: /geo/i,
  history: /hist/i,
  citizenship: /citi/i,
};

let problems = 0;

function warn(msg) {
  problems += 1;
  console.warn(`  \u26a0 ${msg}`);
}

function fail(msg) {
  console.error(`  \u2716 ${msg}`);
  process.exitCode = 1;
}

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function normalize(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Map a bank question to its topics.json topic id.
 *
 * Primary signal (data-derived, verified against topics.json counts):
 *   the 3rd dash-segment of the question id is the topic ordinal,
 *   e.g. "BIO-09-01-001" -> topic 01 -> topics.grades["9"].biology[0].
 *
 * Secondary cross-check: normalized name containment against the topic name.
 */
function resolveTopicId(question, topicsForSubject, subjectId) {
  const parts = String(question.id || '').split('-');
  const ordinalSeg = parts.length >= 3 ? parts[2] : '';
  const ordinal = /^\d+$/.test(ordinalSeg) ? parseInt(ordinalSeg, 10) : null;

  if (ordinal !== null) {
    if (ordinal >= 1 && ordinal <= topicsForSubject.length) {
      return { topicId: topicsForSubject[ordinal - 1].id, via: 'id-ordinal' };
    }
    warn(`[${subjectId}] ${question.id}: id topic ordinal ${ordinal} out of range 1..${topicsForSubject.length}`);
  }

  // Fallback: unique name containment.
  const norm = normalize(question.topic);
  const matches = topicsForSubject.filter(
    (t) => norm && (norm === normalize(t.name) || norm.includes(normalize(t.name)) || normalize(t.name).includes(norm)),
  );
  if (matches.length === 1) return { topicId: matches[0].id, via: 'name-match' };
  if (matches.length > 1) warn(`[${subjectId}] ${question.id}: topic "${question.topic}" ambiguously matches ${matches.length} registry topics`);
  else warn(`[${subjectId}] ${question.id}: topic "${question.topic}" not resolvable to topics.json registry`);
  return { topicId: null, via: 'unresolved' };
}


function validateQuestion(q, ctx) {
  const errors = [];
  if (!q || typeof q !== 'object' || Array.isArray(q)) return ['not an object'];
  if (typeof q.id !== 'string' || !q.id.trim()) errors.push('missing id');
  if (Number(q.grade) !== ctx.grade) errors.push(`grade ${JSON.stringify(q.grade)} !== ${ctx.grade}`);
  if (normalize(q.subject) !== normalize(ctx.subjectName)) errors.push(`subject ${JSON.stringify(q.subject)} !== ${ctx.subjectName}`);
  if (typeof q.question !== 'string' || !q.question.trim()) errors.push('missing question text');
  if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`option count ${q.options ? q.options.length : 'n/a'} !== 4`);
  else {
    if (q.options.some((o) => typeof o !== 'string' || !o.trim())) errors.push('empty option text');
    if (new Set(q.options).size !== q.options.length) errors.push('duplicate options');
  }
  if (typeof q.correctAnswer !== 'string' || !q.correctAnswer.trim()) errors.push('missing correctAnswer');
  else if (Array.isArray(q.options) && !q.options.includes(q.correctAnswer)) errors.push('correctAnswer does not match any option');
  if (typeof q.explanation !== 'string' || !q.explanation.trim()) errors.push('missing explanation');
  if (!DIFFICULTIES.includes(q.difficulty)) errors.push(`invalid difficulty ${JSON.stringify(q.difficulty)}`);
  else if (q.xp !== DIFFICULTY_XP[q.difficulty]) errors.push(`xp ${JSON.stringify(q.xp)} !== ${DIFFICULTY_XP[q.difficulty]} for ${q.difficulty}`);
  return errors;
}

function findBankFiles(subject) {
  const keyword = SUBJECT_KEYWORDS[subject.id];
  if (!keyword) return [];
  const files = fs
    .readdirSync(ROOT)
    .filter((f) => f.endsWith('.json') && keyword.test(f) && /grade[\s_-]*9/i.test(f));
  return files
    .map((f) => {
      try {
        const j = readJSON(path.join(ROOT, f));
        return { file: f, json: j, matches: normalize(j.subject) === normalize(subject.name) && Number(j.grade) === 9 };
      } catch {
        return { file: f, json: null, matches: false };
      }
    })
    .filter((c) => c.matches);
}

function main() {
  const startedAt = Date.now();
  console.log('\u2500\u2500 Quiz data sync + index generation \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');

  // 1. Load authoring config files.
  const subjectsData = readJSON(path.join(ROOT, 'subjects.json'));
  const topicsData = readJSON(path.join(ROOT, 'topics.json'));
  if (!Array.isArray(subjectsData.subjects)) fail('subjects.json: "subjects" array missing');
  if (!topicsData.grades || !topicsData.grades['9']) fail('topics.json: grades["9"] missing');

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'subjects.json'), path.join(OUT_DIR, 'subjects.json'));
  fs.copyFileSync(path.join(ROOT, 'topics.json'), path.join(OUT_DIR, 'topics.json'));
  console.log('  \u2713 subjects.json + topics.json \u2192 public/quiz_data/');

  const index = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sourceOfTruth: 'question bank JSON files (this file is derived - banks always win)',
    grades: {},
  };

  // Only grades that actually have bank files get index entries. Adding a
  // grade's banks + re-running this script activates it (e.g. 10-12 later).
  for (const subject of subjectsData.subjects) {
    const banks = findBankFiles(subject);
    if (!banks.length) {
      console.log(`  \u2013 ${subject.name}: no authoring bank file found (skipped - will not appear in the quiz)`);
      continue;
    }

    for (const bank of banks) {
      const grade = Number(bank.json.grade);
      const topicsForSubject = (topicsData.grades[String(grade)] || {})[subject.id];
      if (!Array.isArray(topicsForSubject) || !topicsForSubject.length) {
        fail(`topics.json has no "${String(grade)}" topics for subject "${subject.id}" - cannot map bank ${bank.file}`);
        continue;
      }

      const questions = Array.isArray(bank.json.questions) ? bank.json.questions : [];
      const questionsById = new Map();
      const textSeen = new Map();
      const posDist = [0, 0, 0, 0];
      const diffDist = { easy: 0, medium: 0, hard: 0 };
      const topicCounts = {};
      let valid = 0;
      let dupIds = 0;
      let dupText = 0;

      for (const q of questions) {
        const errors = validateQuestion(q, { grade, subjectName: subject.name });
        if (errors.length) {
          warn(`[${bank.file}] ${q && q.id ? q.id : '(no id)'}: ${errors.join('; ')}`);
          continue;
        }
        if (questionsById.has(q.id)) {
          warn(`[${bank.file}] duplicate question id: ${q.id}`);
          dupIds += 1;
          continue;
        }
        questionsById.set(q.id, true);
        const tkey = normalize(q.question);
        if (textSeen.has(tkey)) {
          warn(`[${bank.file}] duplicate question text: ${q.id} === ${textSeen.get(tkey)}`);
          dupText += 1;
        } else {
          textSeen.set(tkey, q.id);
        }

        const { topicId } = resolveTopicId(q, topicsForSubject, subject.id);
        valid += 1;
        diffDist[q.difficulty] += 1;
        posDist[q.options.indexOf(q.correctAnswer)] += 1;
        if (topicId) topicCounts[topicId] = (topicCounts[topicId] || 0) + 1;
      }

      // Canonical runtime copy (verbatim content - never rewritten).
      // questionBankPattern is "<subjectDir>/<file>_grade<grade>.json" relative
      // to quiz_data/, so only its basename is used as the destination filename.
      const destDir = path.join(OUT_DIR, subject.id);
      fs.mkdirSync(destDir, { recursive: true });
      const destName = path.basename(subject.questionBankPattern).replace('{grade}', String(grade));
      fs.copyFileSync(path.join(ROOT, bank.file), path.join(destDir, destName));

      index.grades[String(grade)] = index.grades[String(grade)] || {};
      index.grades[String(grade)][subject.id] = {
        file: `${subject.id}/${destName}`,
        totalQuestions: valid,
        topics: topicCounts,
        difficulties: diffDist,
      };

      const topicSum = Object.values(topicCounts).reduce((a, b) => a + b, 0);
      const mappedNote = topicSum === valid ? 'all mapped' : `${valid - topicSum} unmapped`;
      console.log(
        `  \u2713 ${subject.name} G${grade}: ${valid}/${questions.length} valid` +
          ` \u00b7 ${Object.keys(topicCounts).length} topics (${mappedNote})` +
          ` \u00b7 diff ${diffDist.easy}e/${diffDist.medium}m/${diffDist.hard}h` +
          ` \u00b7 pos [${posDist.join(',')}]` +
          (dupIds || dupText ? ` \u00b7 DUP ids:${dupIds} text:${dupText}` : ''),
      );
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'question_index.json'), `${JSON.stringify(index, null, 2)}\n`);
  const totalQs = Object.values(index.grades).reduce(
    (g, subjects) => g + Object.values(subjects).reduce((s, e) => s + e.totalQuestions, 0),
    0,
  );
  console.log(
    `  \u2713 question_index.json regenerated \u2192 grades [${Object.keys(index.grades).join(', ')}]` +
      ` \u00b7 ${totalQs} valid questions \u00b7 ${Math.floor((Date.now() - startedAt) / 1000)}s`,
  );
  if (problems > 0) {
    console.warn(`\nDone with ${problems} problem(s) reported above (content was NOT modified).`);
    process.exitCode = 1;
  } else {
    console.log('\nDone - no problems found.');
  }
}

// Run when invoked directly; exported helpers are shared with
// validate-quiz-data.cjs so every tool enforces identical rules.
if (require.main === module) main();

module.exports = { validateQuestion, resolveTopicId, normalize, DIFFICULTY_XP, DIFFICULTIES };

