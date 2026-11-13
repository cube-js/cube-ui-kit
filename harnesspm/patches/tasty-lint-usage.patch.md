## After you change styles

- Lint the changed files with `pnpm exec oxlint <files>` and fix every `tasty/*` problem. It runs every Tasty rule UI Kit enforces, with the settings in `.oxlintrc.json`.
- `tasty-lint:check` and the edit hook run only the plugin's recommended rules, without UI Kit's settings, and they do not read `oxlint-disable` comments. When they disagree with `pnpm exec oxlint`, oxlint decides.
- Each `tasty/<rule>` has a page in the `tasty-lint` docs index.

## Exceptions

- Disable a rule for one line only, with a reason: `// oxlint-disable-next-line tasty/<rule> -- <reason>`. See "Tasty lint rules" in `docs/rules/coding.md`.
