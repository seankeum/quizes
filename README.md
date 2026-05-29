# quizes

Frontend-only quiz pages for children.

## JSON quiz format

Reusable quiz templates load quiz content from a JSON file:

```json
{
  "title": "Modern Canada Quiz",
  "subtitle": "30 kid-friendly multiple-choice questions",
  "emoji": "🍁🧠✨",
  "introTitle": "Ready to play?",
  "introText": "Choose an answer, get instant feedback, and see your score at the end.",
  "questions": [
    {
      "question": "How did World War I begin?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 1
    }
  ]
}
```

`answer` is the zero-based index of the correct option. For example, `1` means the second option is correct.

Run a local static server before opening a template, because browsers usually block `fetch()` from local files:

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173/pages/index.html`.

## GitHub Pages publishing

The site is published from the `/pages` folder by `.github/workflows/pages.yml`.
In the GitHub repository settings, set Pages to use **GitHub Actions** as the source.

Work directly in `pages/` when adding or editing quizzes. The published entry point is `pages/index.html`, which lists the available quizzes.
The repository root also has a small `index.html` redirect so branch-root Pages settings do not show this README as the landing page.
