import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const templatePath = new URL("../pages/quiz-template.html", import.meta.url);
const quizPath = new URL("../pages/grade4/modern_canada_quiz.json", import.meta.url);
const healthQuizPath = new URL("../pages/grade4/exercise_healthy_body_quiz.json", import.meta.url);
const healthQuizShimPath = new URL("../pages/grade4/exercise_healthy_body_quiz.html", import.meta.url);
const indexPath = new URL("../pages/index.html", import.meta.url);

test("quiz template loads questions from external JSON instead of hardcoding them", async () => {
  const template = await readFile(templatePath, "utf8");

  assert.match(template, /fetch\s*\(/);
  assert.doesNotMatch(template, /const\s+questions\s*=\s*\[/);
  assert.match(template, /modern_canada_quiz\.json/);
});

test("modern Canada quiz JSON has valid metadata and answer keys", async () => {
  const quiz = JSON.parse(await readFile(quizPath, "utf8"));

  assert.equal(quiz.title, "Modern Canada Quiz");
  assert.equal(typeof quiz.subtitle, "string");
  assert.ok(quiz.subtitle.length > 0);
  assert.equal(Array.isArray(quiz.questions), true);
  assert.equal(quiz.questions.length, 30);

  for (const [index, question] of quiz.questions.entries()) {
    assert.equal(typeof question.question, "string", `question ${index + 1} text`);
    assert.ok(question.question.length > 0, `question ${index + 1} text is nonempty`);
    assert.equal(Array.isArray(question.options), true, `question ${index + 1} options`);
    assert.equal(question.options.length, 4, `question ${index + 1} option count`);
    assert.equal(Number.isInteger(question.answer), true, `question ${index + 1} answer index`);
    assert.ok(question.answer >= 0, `question ${index + 1} answer lower bound`);
    assert.ok(question.answer < question.options.length, `question ${index + 1} answer upper bound`);
  }
});

test("exercise for a healthy body quiz is linked and has PDF-validated answer keys", async () => {
  const [quiz, shim, index] = await Promise.all([
    readFile(healthQuizPath, "utf8").then(JSON.parse),
    readFile(healthQuizShimPath, "utf8"),
    readFile(indexPath, "utf8"),
  ]);

  assert.equal(quiz.title, "Exercise for a Healthy Body Quiz");
  assert.equal(typeof quiz.subtitle, "string");
  assert.match(quiz.subtitle, /PDF-validated/);
  assert.equal(Array.isArray(quiz.questions), true);
  assert.equal(quiz.questions.length, 30);

  for (const [index, question] of quiz.questions.entries()) {
    assert.equal(typeof question.question, "string", `question ${index + 1} text`);
    assert.ok(question.question.length > 0, `question ${index + 1} text is nonempty`);
    assert.equal(Array.isArray(question.options), true, `question ${index + 1} options`);
    assert.equal(question.options.length, 4, `question ${index + 1} option count`);
    assert.equal(Number.isInteger(question.answer), true, `question ${index + 1} answer index`);
    assert.ok(question.answer >= 0, `question ${index + 1} answer lower bound`);
    assert.ok(question.answer < question.options.length, `question ${index + 1} answer upper bound`);
    assert.equal(typeof question.sourcePrintedPage, "number", `question ${index + 1} source page`);
    assert.ok(question.sourcePrintedPage >= 112, `question ${index + 1} source page lower bound`);
    assert.ok(question.sourcePrintedPage <= 140, `question ${index + 1} source page upper bound`);
    assert.equal(typeof question.sourceNote, "string", `question ${index + 1} source note`);
    assert.ok(question.sourceNote.length > 0, `question ${index + 1} source note is nonempty`);
  }

  assert.match(shim, /quiz-template\.html\?quiz=grade4\/exercise_healthy_body_quiz\.json/);
  assert.match(index, /exercise_healthy_body_quiz\.html/);
});
