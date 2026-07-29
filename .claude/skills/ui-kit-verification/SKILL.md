---
name: ui-kit-verification
description: "Verify a cube-ui-kit PR against the Cube Cloud console before merging: check the PR is settled enough to verify, install its canary snapshot in a fresh cloud branch, hunt down every breakage the new API introduces (including the silent ones types miss), migrate cloud, then hand the release back to the user and bump cloud off the canary once it publishes. Also covers palette work, where types and tests prove nothing: measuring token drift across all four scheme variants, bumping @tenphi/glaze, refreshing a stale canary on a long-lived branch, keeping cloud's three copies of the recipe in lockstep, and splitting a palette PR. Use when the user says 'verify the ui-kit PR in cloud', 'install the snapshot to cloud', 'check this ui-kit change against cloud', asks to migrate cloud to a ui-kit API introduced by a PR, or asks to bump Glaze / retune a seed / migrate the palette."
metadata:
  version: '1.1.0'
---

# UI Kit Verification

A `@cube-dev/ui-kit` PR is not done when its own tests pass — it is done when Cube Cloud still
works on top of it. Every PR publishes a canary snapshot to npm, so cloud can be built against
the exact PR build before it is merged.

This skill runs that loop: **gate → snapshot → install → hunt breakages → migrate → report →
release → de-canary**.

The output is a cloud branch the user reviews. Do not open a cloud PR or merge anything unless
asked.

## Step 0 — Gate: is the PR ready to verify?

Verifying an unsettled PR is wasted work — if the API still moves, you migrate cloud twice. Check
this before installing anything.

```bash
gh pr view <number> --repo cube-js/cube-ui-kit --json isDraft,reviewDecision,mergeStateStatus
gh pr checks <number> --repo cube-js/cube-ui-kit
gh api graphql -f query='{repository(owner:"cube-js",name:"cube-ui-kit"){pullRequest(number:<number>){
  reviewThreads(last:30){nodes{isResolved path}}}}}' \
  --jq '[.data.repository.pullRequest.reviewThreads.nodes[]|select(.isResolved==false)|.path]'
```

**Stop and hand back to the user** when any of these hold:

- **Unresolved review threads, or open review comments.** The API may still change in response to
  them. Report what is outstanding; do not start migrating.
- **`isDraft: true`.**
- **A failing or pending required check** — `Tests & lint`, `Build & canary release`. If the canary
  job has not succeeded there may be no snapshot to install, or a broken one.
- **Chromatic is awaiting a human.** `UI Tests` or `UI Review` outside the `pass` bucket means
  someone has to look at the visual diff and accept or reject the new baselines. **Only the user
  can do that** — it is a judgement about whether the rendered change is intended. Ask them to
  review and approve the Chromatic changes, and wait. Never accept baselines on their behalf.
  When they are settled the descriptions read like `Approved by <name>`,
  `N visual and accessibility changes accepted as baselines`, or `no changes`.

**A missing approval is _not_ a blocker.** `reviewDecision: REVIEW_REQUIRED` with
`mergeStateStatus: BLOCKED` is the normal state of a PR that is otherwise green, and it is exactly
the state worth verifying — cloud verification is often what justifies the approval. Proceed when
approval is the only thing outstanding, and say so in your report.

The gate is not only a starting condition. If review comments land on the ui-kit PR while you are
mid-migration, re-apply it: the API may be about to change underneath you, and finishing a migration
against a version that is about to move is worse than pausing. Report and wait.

## Step 1 — Identify the PR and its canary snapshot

Every PR gets an npm **dist-tag** named `pr_<number>`, republished on every push. Read the tag
rather than the "NPM canary release" PR comment — the comment can be stale if it did not re-run.

```bash
gh pr list --head "$(git rev-parse --abbrev-ref HEAD)" --json number,title,url
npm view @cube-dev/ui-kit dist-tags --json | python3 -c "import json,sys; print(json.load(sys.stdin)['pr_<number>'])"
```

Confirm the snapshot is current before trusting it — compare its publish time to the PR's HEAD
commit. If the snapshot predates HEAD, the canary workflow has not finished; wait for it rather
than verifying a stale build.

```bash
npm view @cube-dev/ui-kit time --json | python3 -c "import json,sys; print(json.load(sys.stdin)['<version>'])"
git log -1 --format='%cI'
```

Report the resolved version to the user before installing.

## Step 2 — Read the API change before touching cloud

The migration is only as good as your model of what changed. Read, in this order:

1. **The changeset** in `.changeset/*.md` — the user-facing summary of what moved, what is
   deprecated, and what silently changed behaviour.
2. **`git diff origin/main...HEAD --stat`** — the blast radius.
3. **The rules doc for the area** (e.g. [input-components.md](../../../docs/rules/input-components.md)
   for form fields) — the canonical shape of the new API, which is what cloud should be migrated _to_.
4. **The diff of the types and the resolution helpers** — for a prop change, the prop
   interfaces (`src/shared/*.ts`, `**/types.ts`) and whatever normalizes them. This is where you
   learn whether the old prop was _deprecated_ (still works) or _deleted_ (breaks), and that
   distinction drives everything in Step 4.

Write down, explicitly, three lists:

- **Deleted** — removed exports and removed props. These break loudly at the type level.
- **Deprecated** — still accepted, normalized internally. These do _not_ break; they are the
  migration work.
- **Behavioural** — same types, different runtime result (precedence changes, a component no
  longer registering with a form, a state that now renders where it was previously ignored).
  These break silently and are the reason this skill exists.

## Step 3 — Branch and install in cloud

Cloud lives in a separate checkout. Ask which one to use if there is more than one and the user
has not said — branch off `origin/master`, never off whatever feature branch a checkout happens
to be sitting on.

```bash
git -C <cloud-dir> fetch origin master
git -C <cloud-dir> checkout -b <branch> origin/master
```

Install the snapshot with the repo's own script — it updates all four consumer packages
(`console-ui`, `sheets-ui`, `cloud-router-auth-ui`, `mcp-app-ui`) and refreshes `yarn.lock`:

```bash
cd <cloud-dir> && yarn update-uikit <version>
```

Then verify what actually landed, rather than trusting the install log:

```bash
node -e "console.log(require('./node_modules/@cube-dev/ui-kit/package.json').version)"
```

A failure in the optional `sse4_crc32` / `node-gyp` build is pre-existing noise on ARM Macs and
does not mean the install failed — check the version, not the log.

## Step 4 — Hunt the breakages

Types find the deleted things. You have to go find the rest yourself.

### 4a. Typecheck, and establish a baseline first

Cloud does not typecheck clean from a fresh checkout: workspace packages
(`@cube-dev/platform-client`, `@cubejs-enterprise/cross-runtime`, `@cubejs-enterprise/console-ui`)
are unbuilt, producing `TS2307` plus a long cascade of `TS7006`/`TS7031` implicit-any errors.
**Never** report those as ui-kit breakage.

```bash
cd <cloud-dir>/packages/console-ui     && yarn typecheck > /tmp/tc-console.txt 2>&1
cd <cloud-dir>/packages/sheets-ui      && yarn tsc      > /tmp/tc-sheets.txt  2>&1
cd <cloud-dir>/packages/cloud-router-auth-ui && yarn tsc > /tmp/tc-auth.txt   2>&1
```

Capture the **whole** output to a file and read the file. Do not pipe a typecheck through
`tail` — the interesting errors are usually not at the end, and a tail plus a `0` exit code from
the pipeline reads as "clean" when it is not. Check the exit code of `tsc` itself.

Filter the noise, then attribute what is left:

```bash
grep -vE "TS2307|TS7006|TS7031|Cannot find module|implicitly has an" /tmp/tc-console.txt
```

For each surviving error, decide whether it is yours: does the file import `@cube-dev/ui-kit`,
and does the error mention a ui-kit type? Errors in files that never import the ui kit are
pre-existing. Re-run the same typecheck after migrating and **diff the error lists** — that diff,
not the raw count, is the evidence that you fixed something and broke nothing.

### 4b. Find the silent breakages

This is the core of the skill. Types will not help here, so search for the _patterns_ the change
invalidated. For a validation-props change, that was:

| Pattern                                                                                                             | Why it breaks silently                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloud components reading a **removed-from-the-pipeline prop** off the result of `useFieldProps`                     | `useFieldProps` no longer returns it, so the destructured value is now permanently `undefined` and the styling it drove never renders. Nothing type-errors, because the component declares the prop itself. |
| Props passed to a ui-kit component through an **object-literal spread** (`{...{ a, b }}`, `{...(cond ? {…} : {})}`) | JSX excess-property checking does not reach through the spread, so a prop that no longer exists is silently dropped instead of erroring.                                                                    |
| Local prop types **mirroring** a ui-kit prop union (`validationState?: 'valid' \| 'invalid'`)                       | Still valid TypeScript, now wired to nothing.                                                                                                                                                               |
| A component that **stopped registering with the form**                                                              | Still renders, silently no longer bound. Grep its usages for `name=`, `rules=`, and `form=`.                                                                                                                |
| A prop that was **accepted and ignored**, and now takes effect                                                      | New visual state appears where nothing appeared before. Not a bug, but it belongs in the report.                                                                                                            |
| A **precedence flip** (explicit prop now wins over derived state)                                                   | Grep for elements carrying _both_ the explicit prop and the derived source (e.g. both `name=` and `isInvalid=`) — those are the only places a flip can change behaviour.                                    |

Grep by prop name across all four packages, and read every hit rather than blind-replacing —
separate genuine ui-kit props from cloud's own identically-named fields (cloud has its own
`validationStates` error shape that must be left alone).

```bash
grep -rn "<oldProp>" packages/*/src --include="*.ts" --include="*.tsx"
grep -rn "<removedExport>" packages/*/src
```

## Step 5 — Migrate

Migrate to the new API rather than leaning on the deprecation shim — the deprecated path logs
dev warnings and is scheduled to disappear. Follow the rules doc from Step 2 so cloud lands on the
same shape the ui kit documents.

Preserve the original semantics exactly. A conditional prop maps to the equivalent boolean, and
the tri-state cases are where mistakes hide:

- `validationState={err ? 'invalid' : undefined}` → `isInvalid={!!err}`
- `validationState={ok ? 'valid' : 'invalid'}` → `isInvalid={!ok} isValid={ok}` (both states were
  always set here — do not collapse it to a single prop)
- a `Record<string, 'invalid'>` lookup → a `Record<string, boolean>`, renamed to match

Keep the diff scoped to the API change. Cleanups the new API merely _permits_ — such as dropping a
`useFormProps` call that `useFieldProps` now applies internally — are a separate change; leave
them out unless asked.

**Do not add visual states the ui kit now renders but the cloud component never had.** It is
tempting: the ui kit gained a valid state, so giving a cloud card its `#success` border to match
feels like finishing the job. It is a behaviour change smuggled into a mechanical rename, it is
easy to miss in a 30-file diff, and it will be applied inconsistently — the fields that map only
`isInvalid` (because that is all their old expression had) end up disagreeing with the ones you
"improved" inside the same commit. Map exactly what the old expression mapped. If the new state is
worth adding, that is its own PR with its own design decision.

## Step 6 — Verify

In a fresh checkout `console-ui`'s tests do not merely fail, they fail to _load_: every test file
errors on `Failed to resolve import "@cubejs-enterprise/cross-runtime"` because that workspace
package is unbuilt. Build it first, or you will read a total wipeout as ui-kit fallout:

```bash
cd <cloud-dir>/packages/cross-runtime && yarn build
```

```bash
cd <cloud-dir>/packages/console-ui && yarn typecheck   # then diff against the Step 4a baseline
cd <cloud-dir>/packages/console-ui && yarn lint
cd <cloud-dir>/packages/console-ui && yarn test
cd <cloud-dir>/packages/sheets-ui  && yarn test
cd <cloud-dir> && npx prettier --check <changed files>
```

Quote file lists carefully — a mangled shell argument list makes prettier report every file as
failing, which is a false alarm, not a formatting problem.

### Proving a silent breakage is actually fixed

The existing suites pass either way — they never asserted on the state that broke. To get real
evidence, assert on the **computed style**, which resolves tasty's generated CSS even in jsdom:

```ts
const border = (el: HTMLElement) => getComputedStyle(el).border;
// invalid → "var(--border-width) solid var(--danger-color)"
// neutral → "var(--border-width) solid var(--border-color, currentColor)"
expect(border(screen.getByTestId('DirectoryTreeInput'))).toContain(
  '--danger-color',
);
```

Write a throwaway probe spec first that dumps `outerHTML` and the computed style for both states,
and build the assertion from what you actually see. Do not guess at an assertion and ship it when
it passes — a vacuous test is worse than none here. Note that `console.log` is swallowed by this
vitest reporter; write probe output to a file and `cat` it.

**Drive the state through the form, not through the prop.** A test that hands `isInvalid` in
directly asserts almost nothing — the component renders the caller's value either way, so it passes
against the broken version too and only _looks_ like a regression guard. Push the state in from the
form instead:

```ts
type Values = { folder?: string | null };
let form: CubeFormInstance<Values> | undefined;   // never `any` — AGENTS.md forbids it in tests,
                                                 // and `any` hides a setFields signature change
function Harness() {
  [form] = useForm<Values>();                    // returns a tuple
  return <Form form={form}>{/* field with name= */}</Form>;
}
// …render, assert neutral, then:
act(() => form!.setFields([{ name: 'folder', errors: ['Required'] }]));
```

`form.setFields` is the reliable lever. Clicking `SubmitButton` (that is the export name, not
`Submit`) did not run the rules in the console-ui harness — and a plain untouched `TextInput`
behaved identically, which is how you know it is the harness and not your migration.

**Then prove the test can fail.** Temporarily revert the component to its pre-migration form and
confirm the spec goes red, and say so in the commit message. A regression test you have only ever
seen pass is a guess.

Unit tests will not catch most Step 4b breakages; they are render-state bugs. If a migrated surface
matters, run the app and look at it (`yarn dev` in `packages/console-ui`), or say plainly in the
report that it was not visually verified.

## Step 7 — Ask for the release, then de-canary

The consumer PR **must not merge with a `0.0.0-canary-*` pin**: canary tags are mutable and
ephemeral, so a later `yarn install` or Docker rebuild can resolve to something else or fail once
the tag is collected. That makes the canary pin a blocker on the consumer PR which nothing you do
can clear — it needs a real published version to point at.

So once verification is clean and the ui-kit PR is otherwise ready, **ask the user to make the
release.** Do not merge it yourself: the release is two merges into `main` — the feature PR, then
the `Version Packages` PR the changesets bot opens from it, which is the merge that actually
publishes — and both are gated on branch protection. Do not self-approve, and do not `--admin` past
protection.

Give them what they need to decide, in one message: the verification result, that the ui-kit PR is
green and needs only their merge, and that the cloud PR is blocked on the canary until a version
exists.

When the release lands:

1. **Confirm the version is real on npm**, rather than trusting a green workflow:
   ```bash
   npm view @cube-dev/ui-kit dist-tags --json   # the new version should be `latest`
   ```
2. **Bump cloud off the canary** — all four packages plus `yarn.lock`:
   ```bash
   cd <cloud-dir> && yarn update-uikit <released-version>
   grep -rn "canary" packages/*/package.json yarn.lock   # must come back empty
   ```
3. **Re-run the consumer's checks.** The released build is not byte-identical to the canary, so
   this is a real re-verification, not a formality — typecheck, lint, prettier, and the test suites.
4. **Push it to the cloud PR** as its own commit, so the history shows the canary being replaced
   rather than quietly rewritten. Note in the message that it was re-verified against the released
   build.
5. Then the consumer PR is mergeable — by the user, not by you.

Expect a reviewer to flag the canary pin before this point, and do not treat it as something you
failed to fix — say explicitly that it is blocked on the release rather than leaving it looking
unaddressed.

## Step 8 — Report

Commit on the cloud branch and hand the user a review, not a summary of your activity:

- The canary version installed, and the PR it came from.
- **Breakages found**, split into what typechecking caught and what it did not — the silent list
  is the valuable half, and it is also feedback on the ui-kit PR itself (a prop that silently
  stops working may deserve a migration note in the changeset).
- Every file migrated, grouped by kind of change.
- What you verified, and what you did not.
- Anything left pre-existing-broken, stated explicitly so it is not mistaken for fallout.
- **The one thing you need from them**, stated as a single ask rather than buried in status — the
  Chromatic approval, the ui-kit approval, or the release. End on it.

If the hunt turns up a genuine problem with the ui-kit PR — a breaking change presented as
backwards-compatible, a missing deprecation path — say so. That finding is worth more than the
migration.

---

# Palette and token changes

Everything above assumes the API surface changed. When the **palette** changes — a Glaze bump, a
seed retune, a `lightness`→`tone` migration — typechecking and the test suites tell you almost
nothing, because no test asserts on a colour that nobody wrote an assertion for. Measure instead.

## Never eyeball a palette change; dump and diff it

Resolve every token in **all four scheme variants** and diff against a baseline. Tasty needs a DOM,
so run it as a throwaway vitest spec (jsdom is already configured) rather than a plain node script:

```ts
// src/__token-dump.test.ts — delete before committing
import { writeFileSync } from 'node:fs';

import { getPaletteTokens } from './tokens'; // cloud: '@/styles/palette'

it('dumps', () => {
  const t = getPaletteTokens() as Record<string, Record<string, string>>;
  const out: Record<string, string> = {};
  for (const k of Object.keys(t).sort())
    out[k] = Object.keys(t[k])
      .sort()
      .map((s) => `${s}=${t[k][s]}`)
      .join(' | ');
  writeFileSync(process.env.TOKEN_DUMP_OUT!, JSON.stringify(out, null, 1));
  expect(Object.keys(out).length).toBeGreaterThan(50);
});
```

Dump once per candidate (stash/patch the source between runs), then diff. To compare across a
format change (Glaze `0.x` emits `okhsl(...)`, `1.x` defaults to `oklch(...)`) a textual diff is
useless — convert both sides to RGB first and report a per-channel delta, grouped by token family
(`surface*` / `accent*` / `accent-disabled*`). A mean delta per group is what tells you whether a
change is a retune or a redesign.

**Light mode alone will mislead you.** Text tokens usually carry `contrast: ['AA','AAA']`, and the
contrast solver — not the authored `tone` — fixes their value, so an authored-delta change looks
like a no-op in light mode and still moves the `@hc` / `@dark & @hc` variants. A relative tone that
_overshoots_ the window is often deliberate: it is what drives a token to the absolute extremes in
high contrast. Before "fixing" an inconsistent-looking delta, diff all four variants; if only HC
moves, you are about to trade away contrast where the user explicitly asked for more.

## Long-lived ui-kit branches: canary drift

A canary is only as current as its branch's last merge from `main`. A branch that has been open a
while will publish snapshots that **predate an API `main` shipped and cloud master already adopted**
— cloud then fails to typecheck against the canary even though neither side is individually wrong.

Do not patch the cloud call sites and do not downgrade the pin. Fix it at the source: merge
`origin/main` into the ui-kit branch, push (the `Publish` workflow mints a fresh `pr_<N>` canary),
then repin cloud. Check the branch first — `git log --oneline HEAD..origin/main` — and resolve the
inevitable `package.json` / lockfile conflict deliberately: keep the branch's `@tenphi/glaze` (it is
the branch's whole point) and take `main`'s newer `@tenphi/tasty`.

A Glaze **major** bump is not a dependency bump. `1.x` removed `lightness` as a color-def input, so
the upgrade and the axis migration are one inseparable change — check `RegularColorDef` in
`node_modules/@tenphi/glaze/dist/index.d.mts` for what the version actually accepts before promising
a "just bump it" PR.

## Cloud mirrors the recipe in three places — move them together

Cloud does not import the ui-kit's theme builder, it **replicates** the recipe. A palette change has
to land in all of them or they silently diverge:

| File                                                                    | What it mirrors                                         |
| ----------------------------------------------------------------------- | ------------------------------------------------------- |
| `packages/console-ui/src/styles/palette.ts`                             | seed + query/APM themes                                 |
| `packages/sheets-ui/src/styles/palette.ts`                              | the query themes again, for the add-in                  |
| `packages/console-ui/src/modules/app-theme/engine/default-color-map.ts` | the ui-kit recipe verbatim, re-seeded per user accent   |
| `.../app-theme/engine/types.ts` → `DEFAULT_APP_THEME`                   | accent/background/foreground read off the native tokens |
| `.../app-theme/engine/build-app-theme-tokens.ts`                        | the `glaze(hue, saturation, …)` re-seed call            |

`app-theme-tokens.spec.ts` compares the mirror to the shipped tokens within ±2/channel and will
catch a seed mismatch — but it only checks the handful of tokens named in its list, and a sub-±2
divergence passes. Treat it as a smoke test, not proof, and re-read `DEFAULT_APP_THEME` from the
canary's own tokens whenever the palette moves.

Two more traps specific to cloud:

- **Per-hue saturation factors.** `apmThemes` scales the seed per hue (`SEED_SATURATION * 0.3`–`0.6`)
  precisely because the theme is not pastel. A `pastel: true` variant can drop them — pastel
  equalises chroma across hues — so copying a pastel palette onto a non-pastel seed silently makes
  every lane resolve at full saturation.
- **Baked e2e colour baselines.** `playwright/tests/probation/workbooks/table-alignment-and-coloring.spec.ts`
  hardcodes member header colours with a ±10/channel tolerance. Re-read them from the running app
  after a palette change; if they still pass, say so rather than re-baking blindly.

## Splitting a palette PR

If a palette PR has to be split so an upgrade can land ahead of a postponed redesign, verify the
split empirically — the intuitive cut is often wrong. Dropping `pastel` while leaving the seed at its
pastel value moved accents _further_ from `main` (mean Δ 43.7) than keeping pastel did (31.0); only
reverting the seed alongside it brought the delta down (13.3). Seed and `pastel` move together or not
at all. Copying files wholesale also drags unrelated changes along — audit every `package.json` and
lockfile diff down to the lines you meant to change, and re-run `yarn install` after reverting a
dependency so the lockfile agrees with the manifest.
