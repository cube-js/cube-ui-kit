# update-tasty

Update the `@tenphi/tasty` dependency to the latest published version (or a specific version if provided by the user), install it, migrate any breaking changes, and add a changeset.

## Steps

### 1. Determine Versions

- Read the current `@tenphi/tasty` version from `package.json` (`dependencies["@tenphi/tasty"]`). Strip any semver range prefix (`^`, `~`, `>=`, etc.) to get the exact installed version.
- Resolve the **target version**:
  - If the user provided a version string (e.g. `1.2.0` or `2.0.0-snapshot.abc123`), use it.
  - Otherwise, run `npm view @tenphi/tasty version` to get the latest stable version.
- If current version equals the target version, report "already up to date" and stop.

### 2. Update `package.json`

- In `package.json`, set `dependencies["@tenphi/tasty"]` to the exact target version (no semver range prefix — the package is pinned to an exact version).
- Do **not** modify any other field.

### 3. Install

Run:

```
pnpm install
```

### 4. Check for Dev Snapshot

Determine whether the target version is a pre-release/snapshot by checking if its version string contains a hyphen (e.g. `2.0.0-snapshot.abc123`, `2.0.0-beta.1`). If it **is** a snapshot, skip steps 5–6 and go directly to step 7.

### 5. Read the Changelog

Fetch the changelog from:

```
https://raw.githubusercontent.com/tenphi/tasty/refs/heads/main/CHANGELOG.md
```

Parse all changelog entries **strictly between** the current (old) version and the target (new) version — inclusive of the target, exclusive of the old. Collect only entries for the versions in that range.

### 6. Perform Migration

Analyze the collected changelog entries. Perform **only migrations that are relevant to `@cube-dev/ui-kit`** — i.e. changes to the runtime tasty API, style syntax, tokens, and modifiers used in this codebase. Skip anything related to:

- Zero-runtime / `tastyStatic` / Babel plugin / Next.js / Turbopack
- SSR entry points (`@tenphi/tasty/ssr`)
- Build, packaging, or internal test infrastructure of the `tasty` package itself

For each relevant breaking change or recommended migration in the changelog, scan the codebase and apply the necessary updates. Common migration patterns to watch for (not limited to these):

| Change | What to look for | What to do |
|--------|------------------|------------|
| Preset modifier syntax: space-separated → slash-separated (e.g. `h2 strong` → `h2 / strong`) | `preset="…"` props and `preset:` style keys with two space-separated words | Replace with slash-separated form |
| Recipe separator: `\|` → `/` | `recipe="…"` values using `\|` | Replace with `/` |
| Font CSS custom property rename: `--font` → `--font-sans`, `--monospace-font` → `--font-mono` | Direct CSS variable references | Update references |
| `lh` unit removed | Uses of `lh` as a custom unit in style props | Replace with native CSS `lh` |
| `--line-height` / `--font-size` CSS variables removed from presets | Direct references to those custom properties | Remove or replace |
| Color companion variable suffix: `-rgb` → `-oklch` | Uses of `--*-rgb` companion variables | Update to `--*-oklch` |

If a migration requires widespread search-and-replace, use targeted search tools to find all occurrences before modifying.

After applying migrations, verify that TypeScript still compiles:

```
pnpm tsc --noEmit 2>&1 | head -50
```

Fix any type errors introduced by the upgrade.

### 7. Add Changeset

Follow the `add-changeset` command conventions:

- Place the changeset file in `.changeset/` with a descriptive kebab-case name (e.g. `tasty-1-2-0-update.md`).
- **Version bump rule:**
  - `patch` if only bug fixes and no breaking changes for ui-kit consumers.
  - `minor` if new features or breaking/noticeable changes are introduced.
- **Content guidelines:**
  - Lead with the tasty version update (e.g. "Update `@tenphi/tasty` to `X.Y.Z`").
  - List only the tasty changes that are **relevant to ui-kit** (runtime API, style syntax, tokens, component behavior). Do **not** mention zero-runtime, static, SSR, build, or packaging changes from the tasty changelog.
  - For snapshots: just note the version bump with no changelog details.
  - If migrations were applied, briefly describe what was changed in the ui-kit codebase.
  - Keep it concise and user-focused.

Changeset format:

```md
---
"@cube-dev/ui-kit": minor
---

Update `@tenphi/tasty` to `X.Y.Z`.

- Describe relevant tasty change 1
- Describe relevant tasty change 2

Migrated: brief description of what was changed in this codebase.
```

### 8. Commit

Read the commit-changes rule. Create a single commit with a message like:

```
chore(tasty): update to X.Y.Z
```

If migrations were applied, the commit message may reflect that:

```
chore(tasty): update to X.Y.Z and migrate breaking changes
```
