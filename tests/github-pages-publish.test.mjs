import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function readText(path) {
  return readFile(new URL(path, root), "utf8");
}

async function pathExists(path) {
  try {
    await stat(new URL(path, root));
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

test("GitHub Pages deploys the pages folder", async () => {
  const workflow = await readText(".github/workflows/pages.yml");

  assert.match(workflow, /pages:/);
  assert.match(workflow, /upload-pages-artifact@v/);
  assert.match(workflow, /path:\s*\.\/pages/);
  assert.match(workflow, /deploy-pages@v/);
});

test("pages folder contains the static quiz entry points and data", async () => {
  const [
    pagesIndex,
    publishedQuizPage,
    publishedTemplate,
    publishedData,
  ] = await Promise.all([
    readText("pages/index.html"),
    readText("pages/grade4/modern_canada_quiz.html"),
    readText("pages/quiz-template.html"),
    readText("pages/grade4/modern_canada_quiz.json"),
  ]);

  assert.match(pagesIndex, /grade4\/modern_canada_quiz\.html/);
  assert.match(publishedQuizPage, /\.\.\/quiz-template\.html\?quiz=grade4\/modern_canada_quiz\.json/);
  assert.match(publishedTemplate, /Back to home/);
  assert.equal(JSON.parse(publishedData).title, "Modern Canada Quiz");
});

test("pages index lists available quizzes instead of redirecting immediately", async () => {
  const pagesIndex = await readText("pages/index.html");

  assert.doesNotMatch(pagesIndex, /http-equiv="refresh"/i);
  assert.doesNotMatch(pagesIndex, /window\.location\.replace/);
  assert.match(pagesIndex, /Available Quizzes/);
  assert.match(pagesIndex, /Modern Canada Quiz/);
  assert.match(pagesIndex, /href="grade4\/modern_canada_quiz\.html"/);
});

test("repository root redirects to the pages quiz index", async () => {
  const rootIndex = await readText("index.html");

  assert.match(rootIndex, /pages\/index\.html/);
  assert.doesNotMatch(rootIndex, /README/);
});

test("published quiz template links back to the home page", async () => {
  const template = await readText("pages/quiz-template.html");

  assert.match(template, /href="index\.html"/);
  assert.match(template, /Back to home/);
});

test("top-level grade folders are not used as source copies", async () => {
  assert.equal(await pathExists("grade4"), false);
});
