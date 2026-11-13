# Linear Issues: Done When Cloud Has the Fix

Cloud consumes the published package, so a UI Kit fix reaches users only when a Cloud PR bumps a release that carries it. Cloud's `update-uikit` skill finds the fix's issues through the changelog's links to UI Kit PRs, and the bump closes each one it completes; an issue that also needs a Cloud change, such as removing a workaround, closes with that change. So a UI Kit PR links its issues without closing them:

- Name each issue on a line of its own in the PR body: `Part of <issue ID>`.
- Keep issue IDs out of the PR title and the branch name, which close an issue on merge, and out of changesets, whose text the release PR copies. Never put a closing word before an ID: Linear's are close, fix, resolve, complete and implement in any form, and "Linear issue".
- A PR that only edits another PR's unreleased changeset ships under that PR's changelog entry, which links only that PR, so it names only issues that PR names too. Give any other issue a changeset of its own.
- Tasty isn't connected to Linear. The UI Kit PR that bumps `@tenphi/tasty` names the Tasty fix's issues as `Part of`.
- After a merge, check each issue the PR names. An issue whose fix ships in no release, because none of its PRs adds a non-empty changeset (see [Changesets](../../AGENTS.md#changesets)), has nothing for a bump to find: move it to Done by hand once its last PR has merged. One whose fix ships in a release and went to Done before Cloud has it goes back to In Progress, with a comment saying what is left.

File new issues with the [`create-ticket`](../../.claude/skills/create-ticket/SKILL.md) skill. `implement` runs it for a task that has no issue.

**Tracking a task.** Update the issue and the PR body when the work moves, not on every event, and edit them in place rather than append:

- **Status:** In Progress when work starts. Linear's GitHub integration attaches each PR that names the issue and moves its status when the PR opens: don't repeat that by hand or in a comment.
- **Description:** the task as it stands now. When the scope or approach changes, edit the sections it changes and comment one line on what changed and why. No progress log. On an issue someone else is working on, propose the edit in a comment instead.
- **PR body:** what the diff does now, rewritten after a push that changes it.
- **Comments:** what a reader acts on, such as a question or blocker waiting on a person or another issue, or a follow-up issue.
- **Not tracked:** CI runs and their test failures, reruns, flakes and outages, review rounds and their findings, pushes and rebases. When one changes the scope or approach, record that change, not the event.
