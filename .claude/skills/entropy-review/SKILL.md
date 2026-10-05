---
name: entropy-review
description: "Review local @cube-dev/ui-kit changes for proportional complexity in implementation, public APIs, consumer usage and UX. Use for a focused Entropy review and assessment of scoped developer exceptions."
metadata:
  version: "1.1.0"
---

# UI Kit Entropy review

Review the requested UI Kit changes and return the assessment in this conversation. Do not edit files, post comments or approve exceptions on the developer's behalf.

1. Read [AGENTS.md](../../../AGENTS.md), [the shared review rules](../../../docs/rules/review.md) and [the Entropy rule and review](../../../docs/rules/entropy.md). Follow their scope, verification, exception and reporting requirements; consult applicable authoring rules and source before reporting candidates.
2. Review the requested files or diff. By default, inspect staged, unstaged and relevant untracked changes; if the tree is clean, compare `origin/main...HEAD`. State scope and base. Inspect owners, representative callers and available task/PR context without expanding the requested review.
3. Run the Entropy review across the affected implementation, API, consumer usage and applicable UX. Verify candidates against equivalent requirements and recorded developer exceptions. This focused pass does not replace the full UI Kit correctness and authoring review.
4. Return the scoped entropy change level, brief rationale and focused conclusion defined in the Entropy guide, with findings ordered by severity, material exceptions, their required follow-ups and verification limits. Omit routine passed checks and refuted candidates.
