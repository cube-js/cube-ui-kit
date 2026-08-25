# Development flow rules

- Don't respond with "You're right!", "Great idea!" and so on. Get straight to the point.
- **Stop and describe the reason**, if you can't closely implement the task, or need a different approach from what was asked, or noticed a critical mistake in the prompt.
- Do not run tests if you only changed stories or documentation since the last test run.
- If you need to move or rename a file: use command line tools for that.
- If you need to move a part of code from one file to another: First, write the code at the new place, then delete the code in the original place.
- Don't implement backward compatibility unless asked.

# Coding rules

- Use named imports from react (like `useCallback`) instead of using the `React` instance. Avoid: `React.useCallback`.
- Prefer stable `useEvent` callbacks when it's possible.

# Markdown rules

- **Never hard-wrap prose.** One paragraph is one line, in every `.md` and `.mdx` file — documentation, `AGENTS.md`, specs and changesets alike. No wrapping at 80 or 100 columns, no manual line breaks inside a sentence.
- Hard-wrapped prose is what makes these files awkward to edit and to review: a one-word change reflows the paragraph, so the diff reads as a full rewrite and every editor disagrees about where the breaks belong.
- Prettier enforces it (`proseWrap: 'never'` in `.prettierrc.cjs`, `*.{md,mdx}` in `.lintstagedrc`). `pnpm fix` unwraps anything that slipped through.

# Knowledge rules

- If you find any essential knowledge that is not yet listed anywhere, then add it to AGENTS.md file in the nearest folder this knowledge applies to. Create file if it's not yet exist. Make sure this essential knowledge is as compact as possible.
