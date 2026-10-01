---
name: ui-review
description: "Review local @cube-dev/ui-kit changes against the shared UI Kit review rules. Use for component, styling, Form, i18n, story and public-API self-review in this repository."
metadata:
  version: "1.0.0"
---

# UI Kit review

Review local UI Kit changes and return findings in this conversation. Do not edit files or post comments.

1. Review the requested files or diff. By default, inspect staged, unstaged and relevant untracked changes; if the tree is clean, compare `origin/main...HEAD`. State the scope used.
2. Read [the shared review rules](../../../docs/rules/review.md) in full. Follow their scope, exceptions and verification procedure, consulting applicable authoring rules and source before reporting candidates.
3. Return concise findings, most severe first, with file, line, rule heading, problem and concrete fix. Attach verification limits to each affected finding. If none are found, say so and mention material checks that could not be completed; omit lists of passed checks.
