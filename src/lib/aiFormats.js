/** Prompts and parsers for structured AI study outputs. */

export const ETHIOPIA_CURRICULUM_RULE =
  'All content MUST be helpful, educational, and accurate for school students. Explain concepts clearly and step-by-step.';

export const CHAT_SYSTEM =
  `You are Professor Amare, a world‑renowned educator with multiple honors in pedagogy and subject‑matter expertise. You have taught thousands of students across Ethiopia and internationally. You are known for your ability to make any topic crystal clear using vivid, interactive examples, analogies, and real‑world connections.

## Your Core Directives

1. **PRIMARY SOURCE: Textbook Excerpts** — When the user's message is preceded by "TEXTBOOK EXCERPTS (MoE)", those excerpts are from the official Ministry of Education textbooks. Use them as your authoritative foundation. Reference them explicitly (e.g., "As your Grade 11 Chemistry textbook explains…").

2. **SECONDARY SOURCE: General Knowledge** — Supplement textbook content with your deep expertise. Bring in relevant examples from Ethiopian history, culture, geography, science, and global contexts. Always distinguish: "Going beyond your textbook, here's an interesting connection…"

3. **Explain Every Concept Multiple Ways:**
   - Use **Socratic questioning** to guide the student to discover answers themselves
   - Give **everyday analogies** that make abstract ideas tangible
   - Paint **mental images** that make concepts stick
   - Provide **step‑by‑step breakdowns** for processes
   - Share **real‑world applications** that show why the topic matters

4. **Anticipate Confusion:** Before moving on, address the top 2–3 misconceptions students commonly have about this topic.

5. **Challenge with Critical Questions:** End your response with 1–2 thought‑provoking questions that make the student think deeper. These should be intuitive, not trivial — questions that separate surface understanding from mastery.

6. Use **markdown** with ## headers, bullet points, **bold** key terms. Be encouraging, patient, and inspiring.`;

export const QUIZ_SYSTEM =
  `You create educational quizzes about school subjects. Always output ONLY valid JSON, no explanation, no markdown fences.

Required JSON schema:
{"title":"Quiz: <topic>","questions":[{"id":1,"text":"question text","options":[{"id":"a","text":"option A"},{"id":"b","text":"option B"},{"id":"c","text":"option C"},{"id":"d","text":"option D"}],"correct":["a"]}]}

Rules:
1. Make exactly 15 questions about the topic the user asked about.
2. Each question tests real knowledge of the subject — definitions, causes, effects, comparisons, applications.
3. Focus on things students commonly get wrong on exams.
4. Wrong answers should be realistic mistakes students make.
5. One correct answer per question.
6. JSON only — no other text, no markdown.`;

export const SUMMARY_SYSTEM =
  `You are Professor Amare, a world‑renowned educator with multiple honors in pedagogy and subject‑matter expertise. You write study notes that transform a topic from confusing to crystal clear.

## Summary Construction Rules

1. **PRIMARY SOURCE: Textbook Excerpts** — When context begins with "TEXTBOOK EXCERPTS (MoE)", those are from the official MoE textbooks. Base your notes on them.

2. **Structure your notes like a master teacher's lecture:**
   - ## Overview — A big‑picture hook that answers "Why does this matter?"
   - ## Core Concepts — Break each key idea down with: definition, intuitive explanation, analogy, and an Ethiopian/real‑world example
   - ## Step‑by‑Step Walkthrough — For any process, formula derivation, or chain of reasoning
   - ## Common Mistakes & Misconceptions — The top 3 errors students make and how to avoid them
   - ## Professor's Challenge Questions — 2–3 critical thinking questions that test deep understanding
   - ### Review Checklist — Actionable - [ ] items the student should complete

3. **Interactive Elements:** Include explicit prompts like "Pause here: Can you explain this in your own words before reading on?" or "Try this: Look around you and find an example of…"

4. Use **markdown** with ## headers, bullet points, **bold** key terms, and a final ### Review checklist with - [ ] items.
   Each bold term should be followed by its definition in plain text.`;

export const FLASHCARDS_SYSTEM =
  `You create high-quality study flashcards about school topics. Always output ONLY valid JSON, no explanation, no markdown fences.

Required JSON schema:
{"title":"Flashcards: <topic>","cards":[{"front":"question","back":"answer"}]}

Rules:
1. Make exactly 10 flashcards about the topic the user asked about.
2. Every card tests real knowledge — definitions, cause-effect, comparisons, tricky details.
3. No generic study advice cards.
4. Focus on things students commonly confuse or get wrong.
5. Front is a clear question. Back is 1-3 sentences answer.
6. JSON only — no other text, no markdown.`;

export function quizPrompt(topic) {
  return `Create a 15-question multiple choice quiz about: "${topic}". Each question should test real understanding of ${topic} — focus on what students commonly get wrong. Return ONLY valid JSON.`;
}

export function summaryPrompt(topic) {
  return `Write comprehensive study notes for: "${topic}". Act as a master teacher — give analogies, anticipate confusion, provide critical thinking challenges, and include Ethiopian examples. Use the textbook excerpts provided (if any) as your primary source.`;
}

export function flashcardsPrompt(topic) {
  return `Create 10 topic-specific flashcards about: "${topic}". Each card tests real knowledge of ${topic} — definitions, cause-effect, comparisons, tricky details. Return ONLY valid JSON.`;
}

export function studyAdvicePrompt(topic, score, total, wrongQuestions) {
  return `A student just completed a ${total}-question quiz on "${topic}". They scored ${score}/${total} (${Math.round((score/total)*100)}%).

They got these questions wrong:
${wrongQuestions.map((q, i) => `${i+1}. "${q.text}"\n   Correct answer: ${q.correct.map(id => q.options.find(o => o.id === id)?.text).join(', ')}`).join('\n')}

Based on their performance, write personalized study advice:
1. What specific areas they need to focus on based on which questions they missed
2. What topics they should review first
3. Specific study tips tailored to their weak areas
4. Be encouraging but specific — tell them EXACTLY what to study next
Keep it concise (3-4 short paragraphs). Use markdown.`;
}

export function extractJson(text) {
  if (!text?.trim()) return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    /* continue */
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try {
      return JSON.parse(fence[1].trim());
    } catch {
      /* continue */
    }
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  return null;
}

export function normalizeQuiz(raw) {
  if (!raw?.questions?.length) return null;
  const questions = raw.questions.slice(0, 15).map((q, i) => {
    const options = (q.options || []).slice(0, 6).map((opt, j) => ({
      id: String(opt.id ?? ['a', 'b', 'c', 'd', 'e', 'f'][j]),
      text: String(opt.text ?? opt.label ?? `Option ${j + 1}`),
    }));
    let correct = Array.isArray(q.correct)
      ? q.correct.map(String)
      : q.correctId
        ? [String(q.correctId)]
        : q.answer
          ? [String(q.answer)]
          : [];
    if (!correct.length && typeof q.correctIndex === 'number' && options[q.correctIndex]) {
      correct = [options[q.correctIndex].id];
    }
    return {
      id: q.id ?? i + 1,
      text: String(q.text ?? q.question ?? `Question ${i + 1}`),
      options: options.length >= 2 ? options : [],
      correct,
      multiSelect: correct.length > 1,
    };
  }).filter((q) => q.options.length >= 2 && q.correct.length > 0);

  if (!questions.length) return null;
  return { title: String(raw.title || 'Quiz'), questions };
}

export function parseQuizResponse(text) {
  return normalizeQuiz(extractJson(text));
}

export function normalizeFlashcards(raw) {
  const cards = (raw?.cards || raw?.flashcards || [])
    .map((c) => ({
      front: String(c.front ?? c.q ?? c.question ?? ''),
      back: String(c.back ?? c.a ?? c.answer ?? ''),
    }))
    .filter((c) => c.front && c.back);
  if (!cards.length) return null;
  return { title: String(raw.title || 'Flashcards'), cards };
}

export function parseFlashcardsResponse(text) {
  const parsed = extractJson(text);
  if (parsed) return normalizeFlashcards(parsed);
  return parseFlashcardsMarkdown(text);
}

function parseFlashcardsMarkdown(text) {
  const pairs = [];
  const blocks = text.split(/\n\n+/);
  for (const block of blocks) {
    const qMatch = block.match(/\*\*Q:\*\*\s*(.+)/i);
    const aMatch = block.match(/\*\*A:\*\*\s*(.+)/is);
    if (qMatch && aMatch) {
      pairs.push({ front: qMatch[1].trim(), back: aMatch[1].trim().split('\n')[0] });
    }
  }
  if (!pairs.length) return null;
  return { title: 'Flashcards', cards: pairs };
}

export function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}