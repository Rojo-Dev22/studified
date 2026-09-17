#!/usr/bin/env node
/**
 * Quiz data validation report (dev tool).
 *
 * Validates the RUNTIME data in public/quiz_data against the registries and
 * cross-checks all four data layers:
 *   subjects.json -> topics.json -> question_index.json -> question banks
 *
 * REPORTS problems — never modifies educational content.
 *
 * Usage: node scripts/validate-quiz-data.cjs
 */

const fs = require('fs');
const path = require('path');

// Reuse the exact validation rules the generator (and the runtime app) use.
const { validateQuestion, resolveTopicId, normalize } = require('./generate-quiz-index.cjs');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'public', 'quiz_data');

const stats = { pass: 0, fail: 0, warn: 0 };

function ok(msg) {
  stats.pass += 1;
  console.log(`  PASS ${msg}`);
}
function bad(msg) {
  stats.fail += 1;
  console.error(`  FAIL ${msg}`);
}
function warn(msg) {
  stats.warn += 1;
  console.warn(`  WARN ${msg}`);
}

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function validateConfigFile(label, file, checkFn) {
  console.log(`\n\u2500\u2500 ${label} (${path.relative(ROOT, file)}) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`);
  let data = null;
  try {
    data = readJSON(file);
    ok('parses as JSON');
  } catch (err) {
    bad(`does not parse: ${err.message}`);
    return null;
  }
  if (checkFn) checkFn(data);
  return data;
}

function validateSubjects(data) {
  if (!Array.isArray(data.subjects) || !data.subjects.length) return bad('subjects.json: "subjects" array missing/empty');
  const ids = new Set();
  for (const s of data.subjects) {
    if (!s.id || !s.name) bad(`subject missing id/name: ${JSON.stringify(s)}`);
    else if (ids.has(s.id)) bad(`duplicate subject id: ${s.id}`);
    else ids.add(s.id);
    if (!Array.isArray(s.grades) || !s.grades.length) warn(`subject ${s.id}: no grades listed`);
    if (!s.questionBankPattern) warn(`subject ${s.id}: no questionBankPattern`);
  }
  ok(`subjects.json: ${data.subjects.length} subjects registered`);
  const g9 = data.subjects.filter((s) => Array.isArray(s.grades) && s.grades.includes(9));
  ok(`Grade 9 support declared for: ${g9.map((s) => s.id).join(', ') || '(none)'}`);
}

function validateTopics(data) {
  if (!data.grades || typeof data.grades !== 'object') return bad('topics.json: "grades" registry missing');
  const g9 = data.grades['9'];
  if (!g9 || typeof g9 !== 'object') return bad('topics.json: grades["9"] missing');
  const subjects = Object.keys(g9);
  ok(`topics.json: Grade 9 topics present for: ${subjects.join(', ')}`);
  for (const subjectId of subjects) {
    const list = g9[subjectId];
    if (!Array.isArray(list) || !list.length) {
      bad(`topics.json: grades["9"].${subjectId} is empty`);
      continue;
    }
    const idset = new Set();
    for (const t of list) {
      if (!t.id || !t.name) bad(`topics.json: topic without id/name in ${subjectId}`);
      else if (idset.has(t.id)) bad(`topics.json: duplicate topic id ${t.id} in ${subjectId}`);
      else idset.add(t.id);
    }
    ok(`topics.json: ${subjectId} has ${list.length} unique topics`);
  }
}

function validateIndex(data) {
  if (!data.grades || typeof data.grades !== 'object') return bad('question_index.json: "grades" registry missing');
  if (!data.generatedAt) warn('question_index.json: generatedAt missing');
  const grades = Object.keys(data.grades);
  if (grades.some((g) => Number(g) > 9)) warn(`index contains grades beyond the active grade: ${grades.join(', ')}`);
  ok(`question_index.json: grades [${grades.join(', ')}]`);
  return data;
}

function validateBankAndCrossCheck(subjectsData, topicsData, indexData) {
  const grade = 9;

  console.log(`\n\u2500\u2500 Question banks + cross-file consistency (Grade ${grade}) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`);

  const g9Subjects = subjectsData.subjects.filter((s) => Array.isArray(s.grades) && s.grades.includes(grade));
  for (const subject of g9Subjects) {
    const topicsForSubject = (topicsData.grades[String(grade)] || {})[subject.id];
    if (!topicsForSubject) {
      bad(`${subject.id}: subjects.json supports Grade ${grade} but topics.json has no topics for it`);
      continue;
    }

    const entry = indexData.grades[String(grade)]?.[subject.id];
    if (!entry) {
      warn(`${subject.id}: no index entry (no usable Grade ${grade} data \u2014 subject will not appear in Quiz Me)`);
      continue;
    }

    const bankPath = path.join(DATA_DIR, entry.file);
    if (!fs.existsSync(bankPath)) {
      bad(`${subject.id}: index file "${entry.file}" does not exist`);
      continue;
    }

    let bank = null;
    try {
      bank = readJSON(bankPath);
      ok(`${subject.id}: bank "${entry.file}" parses`);
    } catch (err) {
      bad(`${subject.id}: bank "${entry.file}" does not parse: ${err.message}`);
      continue;
    }

    if (Number(bank.grade) !== grade) bad(`${subject.id}: bank grade ${JSON.stringify(bank.grade)} !== ${grade}`);
    if (normalize(bank.subject) !== normalize(subject.name)) bad(`${subject.id}: bank subject "${bank.subject}" !== registry "${subject.name}"`);

    const questions = Array.isArray(bank.questions) ? bank.questions : [];
    const seenIds = new Map();
    const seenText = new Map();
    const topicDist = {};
    const diffDist = { easy: 0, medium: 0, hard: 0 };
    const posDist = [0, 0, 0, 0];
    let valid = 0;
    let invalid = 0;
    let dupIds = 0;

    for (const q of questions) {
      const errors = validateQuestion(q, { grade, subjectName: subject.name });
      if (errors.length) {
        invalid += 1;
        if (invalid <= 5) bad(`${subject.id} ${q?.id ?? '(no id)'}: ${errors.join('; ')}`);
        continue;
      }
      if (seenIds.has(q.id)) {
        dupIds += 1;
        continue;
      }
      const tkey = normalize(q.question);
      if (seenText.has(tkey)) warn(`${subject.id}: duplicate question text (${q.id} === ${seenText.get(tkey)})`);
      seenIds.set(q.id, true);
      seenText.set(tkey, q.id);

      const { topicId } = resolveTopicId(q, topicsForSubject, subject.id);
      if (!topicId) {
        invalid += 1;
        bad(`${subject.id} ${q.id}: topic "${q.topic}" does not exist under topics.json \u2192 Grade ${grade} \u2192 ${subject.id}`);
        continue;
      }
      valid += 1;
      diffDist[q.difficulty] += 1;
      posDist[q.options.indexOf(q.correctAnswer)] += 1;
      topicDist[topicId] = (topicDist[topicId] || 0) + 1;
    }

    console.log(
      `   \u00b7 ${subject.id}: ${valid} valid / ${questions.length} total` +
        ` \u00b7 difficulty e${diffDist.easy}/m${diffDist.medium}/h${diffDist.hard}` +
        ` \u00b7 answer-position [${posDist.join(', ')}]`,
    );

    if (invalid === 0) ok(`${subject.id}: every question is valid, uniquely identified and registry-mapped`);
    if (dupIds) bad(`${subject.id}: ${dupIds} duplicate question id(s)`);

    if (entry.totalQuestions !== valid) bad(`${subject.id}: index totalQuestions ${entry.totalQuestions} !== actual valid ${valid}`);
    else ok(`${subject.id}: index totalQuestions matches actual (${valid})`);

    const idxTopics = entry.topics || {};
    let topicCountsMatch = true;
    for (const [topicId, count] of Object.entries(topicDist)) {
      if (idxTopics[topicId] !== count) {
        bad(`${subject.id}: index topic count mismatch ${topicId} (index ${idxTopics[topicId]} vs actual ${count})`);
        topicCountsMatch = false;
      }
    }
    for (const topicId of Object.keys(idxTopics)) {
      if (!topicDist[topicId]) bad(`${subject.id}: index claims topic ${topicId} has ${idxTopics[topicId]} questions but bank has 0`);
      if (!topicsForSubject.some((t) => t.id === topicId)) bad(`${subject.id}: index references topic ${topicId} missing from topics.json`);
    }
    if (topicCountsMatch && Object.keys(idxTopics).length === Object.keys(topicDist).length && Object.keys(topicDist).length) {
      ok(`${subject.id}: index topic counts match actual (${Object.keys(topicDist).length} topics)`);
    }
    const diffs = entry.difficulties || {};
    if (diffs.easy === diffDist.easy && diffs.medium === diffDist.medium && diffs.hard === diffDist.hard) {
      ok(`${subject.id}: index difficulty counts match actual`);
    }
  }
}

function main() {
  console.log('\u2500\u2500 Quiz data validation report \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');

  const subjectsData = validateConfigFile('subjects.json', path.join(DATA_DIR, 'subjects.json'), validateSubjects);
  const topicsData = validateConfigFile('topics.json', path.join(DATA_DIR, 'topics.json'), validateTopics);
  const indexData = validateConfigFile('question_index.json', path.join(DATA_DIR, 'question_index.json'), validateIndex);
  if (!subjectsData || !topicsData || !indexData) {
    console.error(`\nResult: FAIL \u2014 ${stats.fail} error(s), ${stats.warn} warning(s)`);
    process.exit(1);
  }

  validateBankAndCrossCheck(subjectsData, topicsData, indexData);

  console.log(`\nResult: ${stats.fail ? 'FAIL' : 'PASS'} \u2014 ${stats.pass} passed, ${stats.fail} failed, ${stats.warn} warning(s)`);
  if (stats.fail) process.exit(1);
}

main();

