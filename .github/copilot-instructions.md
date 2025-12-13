# Copilot Instructions for this Repo

## Project overview

- This repo is a **single-page static web app** that generates Pandoc YAML front matter for Markdown documents.
- It is designed to be **served directly from GitHub Pages**, with no build step or server-side code.
- Core files live at the repo root:
  - `index.html` – structure of the UI (form + YAML preview).
  - `styles.css` – layout and visual styling.
  - `script.js` – all client-side logic for state handling and YAML generation.
  - `README.md` – user-facing documentation and usage instructions.

## Architecture & behavior

- The page has two main areas (see `index.html`):
  - A **controls panel** for user inputs (title, `documentclass`, `classoption`, `toc`, `papersize`, `fontsize`, margin).
  - A **YAML preview panel** with a `<pre>` element and buttons to copy the YAML and reset options.
- `script.js` encapsulates behavior in an IIFE and uses **plain DOM APIs** (no frameworks, no bundlers):
  - Reads values from form controls (via `getElementById`).
  - Maintains implicit state via DOM values plus a `DEFAULTS` object.
  - Rebuilds the YAML string on each `input` / `change` event and writes it into the preview `<pre>` as `textContent`.
    - Ensures the generated YAML always ends with exactly three newline characters (`"\n\n\n"`).
  - Implements clipboard copying using `navigator.clipboard.writeText` with a `document.execCommand('copy')` fallback.
  - Exposes a **Reset** button that restores controls to the default example header.

## Conventions & style

- Follow `.editorconfig`:
  - LF line endings, final newline, trim trailing whitespace.
  - 2-space indentation, spaces only, max line length 120.
- Keep the stack simple:
  - Do **not** introduce build tools, bundlers, or frameworks (React, Vue, etc.).
  - Use plain HTML/CSS/JS and standard browser APIs.
- Keep UI accessible and lightweight:
  - Prefer semantic elements already used (`<header>`, `<main>`, `<section>`, `<button>`, `<label>`).
  - Preserve keyboard accessibility of the preview (`tabindex="0"`) and ARIA attributes.

## Typical workflows for agents

- **Run locally:** open `index.html` directly in a browser; no build or dev server is required.
- **GitHub Pages:** the HTML lives at the repo root; publishing is handled via GitHub Pages using the default static site flow.
- When adding new options (e.g. extra geometry flags or more `classoption` values):
  - Add the control in `index.html`.
  - Wire it in `script.js` alongside existing inputs, and update `buildYaml()` respecting the omission rules above.
  - When updating YAML generation, ensure `buildYaml()` preserves the rule that the YAML output finishes with exactly three trailing newlines. The code uses a final string concatenation to append `"\n\n\n"` so copy operations and previews include the trailing blank lines.
  - Update `README.md` and this file if the behavior or defaults change.

### Sorting sub-objects and arrays

- **Rule:** Any sub-objects or arrays emitted as YAML values (for example lists under `classoption:` or `geometry:`) MUST be emitted in sorted order (alphabetically) to ensure deterministic output. The top-level YAML keys (the root keys emitted as individual lines) must keep the existing emission order used by `buildYaml()`; only the contents of arrays/sub-objects should be reordered.
- When modifying `script.js` or `buildYaml()`, use or add small helpers to produce sorted copies of arrays (do not mutate input state unexpectedly). Keep the top-level key emission sequence unchanged.

Examples:

- Correct: `classoption:` list emitted as `- landscape`, `- openany`, `- twocolumn` (alphabetical)
- Incorrect: emitting classoptions in arbitrary or input order

This rule ensures stable diffs and predictable YAML for users and downstream tooling.
