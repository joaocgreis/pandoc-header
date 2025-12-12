# Pandoc YAML Header Builder

A tiny static web page that helps you build a Pandoc-style YAML front matter block for
your Markdown documents. It is designed to be served directly from GitHub Pages with no
build step.

## Features

- Configure a document title (optionally omit the `title` line entirely).
- Choose `documentclass` (`article`, `report`, or `book`).
- Toggle common `classoption` values (`twocolumn`, `oneside`, `openany`).
- Enable or disable `toc` (table of contents).
- Select `papersize` (`a4` or `letter`).
- Select `fontsize` (`10pt`, `11pt`, or `12pt`).
- Provide a margin length (e.g. `1.5cm`); this is used as the first
  geometry item as `margin=<value>`, with `includeheadfoot` for `book` and
  `includefoot` for other classes automatically added.
- See a live YAML preview including `---` fences.
- Copy the YAML block to the clipboard with one click.
- Reset everything back to a default example header.

## Default example header

Resetting to defaults produces this header:

```yaml
---
title: 'The Document Title'
documentclass: book
toc: true
papersize: a4
fontsize: 12pt
geometry:
- margin=1.5cm
- includeheadfoot
---
```

On initial load, the title field is blank, so the `title:` line is omitted until you type a title.

## Running locally

Just open `index.html` in your browser.

## Publishing on GitHub Pages

1. Commit these files to your repository.
2. In your repository settings on GitHub, enable GitHub Pages and choose the branch where
  `index.html` lives (often `main`) and the root folder.
3. Visit the GitHub Pages URL shown in the settings to use the tool.
