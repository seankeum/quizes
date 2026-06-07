import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const templatePath = new URL("../pages/quiz-template.html", import.meta.url);
const printTemplatePath = new URL("../pages/print-quiz.html", import.meta.url);
const quizPath = new URL("../pages/grade4/modern_canada_quiz.json", import.meta.url);
const healthQuizPath = new URL("../pages/grade4/exercise_healthy_body_quiz.json", import.meta.url);
const healthQuizShimPath = new URL("../pages/grade4/exercise_healthy_body_quiz.html", import.meta.url);
const roadToModernCanadaQuizPath = new URL("../pages/grade4/road_to_modern_canada_quiz.json", import.meta.url);
const roadToModernCanadaQuizShimPath = new URL("../pages/grade4/road_to_modern_canada_quiz.html", import.meta.url);
const indexPath = new URL("../pages/index.html", import.meta.url);
const quizIndexPath = new URL("../pages/quizzes.json", import.meta.url);

test("quiz template loads questions from external JSON instead of hardcoding them", async () => {
  const template = await readFile(templatePath, "utf8");

  assert.match(template, /fetch\s*\(/);
  assert.doesNotMatch(template, /const\s+questions\s*=\s*\[/);
  assert.match(template, /modern_canada_quiz\.json/);
});

test("quiz template exposes one combined printable PDF link for the loaded quiz", async () => {
  const template = await readFile(templatePath, "utf8");

  assert.match(template, /id="pdfActions"/);
  assert.match(template, /id="combinedPdfLink"/);
  assert.match(template, /Print Quiz PDF/);
  assert.match(template, /print-quiz\.html\?quiz=/);
  assert.match(template, /answers=1/);
  assert.match(template, /function\s+setPdfLinks/);
  assert.doesNotMatch(template, /id="questionsPdfLink"/);
  assert.doesNotMatch(template, /Print Questions PDF/);
  assert.doesNotMatch(template, /id="answerKeyPdfLink"/);
  assert.doesNotMatch(template, /Answer Key PDF/);
});

test("print quiz page renders a JSON quiz and separates the answer key page", async () => {
  const printTemplate = await readFile(printTemplatePath, "utf8");

  assert.match(printTemplate, /fetch\s*\(/);
  assert.match(printTemplate, /new URLSearchParams\(window\.location\.search\)/);
  assert.match(printTemplate, /params\.get\('quiz'\)/);
  assert.match(printTemplate, /params\.get\('answers'\)/);
  assert.match(printTemplate, /id="questions"/);
  assert.match(printTemplate, /id="answerKey"/);
  assert.match(printTemplate, /answer-page/);
  assert.match(printTemplate, /page-break-before:always/);
  assert.match(printTemplate, /window\.print\(\)/);
  assert.match(printTemplate, /\.answer-grid\s*{\s*display:grid;\s*grid-template-columns:repeat\(5, 1fr\)/);
  assert.doesNotMatch(printTemplate, /\.options,\s*[\r\n]+\s*\.answer-grid\s*{/);
  assert.doesNotMatch(printTemplate, /const\s+questions\s*=\s*\[/);
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
  const [quiz, shim, index, quizIndex] = await Promise.all([
    readFile(healthQuizPath, "utf8").then(JSON.parse),
    readFile(healthQuizShimPath, "utf8"),
    readFile(indexPath, "utf8"),
    readFile(quizIndexPath, "utf8").then(JSON.parse),
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
  assert.match(index, /fetch\(["']quizzes\.json["']\)/);
  assert.ok(
    quizIndex.sections.some((section) =>
      section.quizzes.some((item) => item.href === "grade4/exercise_healthy_body_quiz.html")
    ),
    "quiz index links the exercise for a healthy body quiz",
  );
});

test("road to modern Canada quiz covers chapters 9 through 11 with PDF source metadata", async () => {
  const [quiz, shim, quizIndex] = await Promise.all([
    readFile(roadToModernCanadaQuizPath, "utf8").then(JSON.parse),
    readFile(roadToModernCanadaQuizShimPath, "utf8"),
    readFile(quizIndexPath, "utf8").then(JSON.parse),
  ]);

  assert.equal(quiz.title, "Road to Modern Canada Quiz");
  assert.equal(typeof quiz.subtitle, "string");
  assert.match(quiz.subtitle, /80 PDF-validated/);
  assert.match(quiz.introText, /bold terms/i);
  assert.match(quiz.introText, /Comprehension Check/);
  assert.equal(Array.isArray(quiz.questions), true);
  assert.equal(quiz.questions.length, 80);

  for (const [index, question] of quiz.questions.entries()) {
    assert.equal(typeof question.question, "string", `question ${index + 1} text`);
    assert.ok(question.question.length > 0, `question ${index + 1} text is nonempty`);
    assert.equal(Array.isArray(question.options), true, `question ${index + 1} options`);
    assert.equal(question.options.length, 4, `question ${index + 1} option count`);
    assert.equal(Number.isInteger(question.answer), true, `question ${index + 1} answer index`);
    assert.ok(question.answer >= 0, `question ${index + 1} answer lower bound`);
    assert.ok(question.answer < question.options.length, `question ${index + 1} answer upper bound`);
    assert.equal(typeof question.sourcePrintedPage, "number", `question ${index + 1} source page`);
    assert.ok(question.sourcePrintedPage >= 146, `question ${index + 1} source page lower bound`);
    assert.ok(question.sourcePrintedPage <= 199, `question ${index + 1} source page upper bound`);
    assert.equal(typeof question.sourceNote, "string", `question ${index + 1} source note`);
    assert.ok(question.sourceNote.length > 0, `question ${index + 1} source note is nonempty`);
  }

  assert.match(shim, /quiz-template\.html\?quiz=grade4\/road_to_modern_canada_quiz\.json/);
  assert.ok(
    quizIndex.sections.some((section) =>
      section.quizzes.some((item) => item.href === "grade4/road_to_modern_canada_quiz.html")
    ),
    "quiz index links the road to modern Canada quiz",
  );
});
