---
'@cube-dev/ui-kit': minor
---

The docs ship as plain Markdown in `docs/` again, at short paths such as `docs/components/actions/Button.md` and `docs/Usage.md`, with links that lead to the other pages in the package. `docs/llms.txt` lists every page with a one-line description, and in projects that use [harnesspm](https://www.npmjs.com/package/@tenphi/harnesspm) agents get it as the UI Kit docs index. The Storybook sources (`src/**/*.docs.mdx`) and the Modern Form guides under `src/` no longer ship: read `docs/` instead, where `components/form/ModernForm.md` is the Modern Form guide and the migration guide sits next to it. Links that led nowhere, in Storybook too, now lead to the right page, and the Toast page shows the sections that an unclosed code block hid.
