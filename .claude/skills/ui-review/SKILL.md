---
name: ui-review
description: "Review local @cube-dev/ui-kit changes against the shared UI Kit review rules, including Entropy review. Use for component, styling, Form, i18n, story and public-API self-review in this repository."
metadata:
  version: "1.2.0"
---

# UI Kit review

Review local UI Kit changes and return findings in this conversation. Do not edit files or post comments.

1. Review the requested files or diff. By default, inspect staged, unstaged and relevant untracked changes; if the tree is clean, compare `origin/main...HEAD`. State the scope used.
2. Read [the shared review rules](../../../docs/rules/review.md) in full, including their linked [Entropy review](../../../docs/rules/entropy.md). Follow their scope, exceptions and verification procedure, consulting applicable authoring rules and source before reporting candidates.
3. Return the brief entropy change assessment for the affected context, then concise findings, most severe first, with file, line, rule heading, problem and concrete fix. Attach verification limits to each affected finding and note material developer-accepted entropy exceptions with their scope, acceptance reference and required follow-ups. If none are found, say so and mention material checks that could not be completed; omit lists of passed checks.
