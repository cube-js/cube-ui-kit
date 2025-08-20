### React 18 → React 19 migration plan for `@cube-dev/ui-kit`

This plan is tailored for this library codebase and aims to add React 19 support while keeping React 18 compatibility. It prioritizes automation to minimize manual refactoring and includes validation steps across build, tests, and Storybook.

---

### Scope and goals

- Maintain React 18 compatibility for consumers; add React 19 support.
- Keep `peerDependencies` compatible with 18 and 19 while updating local dev/test deps to 19.
- Fully green on: typecheck, unit tests, Storybook build, library build/size checks.
- No breaking API changes in the library unless strictly required.

---

### Current state overview (detected)

- Library uses React 18 in dev: `devDependencies.react`, `react-dom`, `react-test-renderer` are `^18.2.0`.
- `peerDependencies`: `react`, `react-dom` are `>= 18.0.0` (already semver-compatible with 19). No required change, but see “Peer range” below.
- JSX transform: TypeScript `jsx: react-jsx` (OK for React 19).
- One import of `act` from `react-dom/test-utils` found at `src/components/content/PrismCode/__tests__/PrismCode.test.tsx`.
- No uses of `ReactDOM.render`, `ReactDOM.hydrate`, `findDOMNode`, or `defaultProps` on function components detected.
- Portals: `src/components/portal/Portal.tsx` uses `ReactDOM.createPortal` via default import, and `overlays/Modal/Overlay.tsx` uses a named `createPortal` import. Both are supported; named import is preferred but not mandatory.

---

### Migration strategy (high level)

1) Prepare branch, tooling, and CI matrix to test both React 18 and 19.
2) Upgrade local dev/test deps to React 19 in a dedicated workflow while keeping peer ranges broad.
3) Apply automated refactors (imports for `act`, optional portal import normalization, checks for other removed APIs).
4) Upgrade ecosystem dependencies where needed for React 19 support (testing, Storybook, etc.).
5) Validate: lint, typecheck, unit tests, Storybook build, library build, size limits.
6) Release using Changesets, noting React 19 support.

---

### 1) Preparation

- Create a branch: `chore/react-19`.
- Ensure Node 20+ (the repo already targets Node >= 20.19.2).
- Clean install: `pnpm i`.
- Ensure a clean baseline: `pnpm test`, `pnpm run build`, `pnpm run build-storybook`.

---

### 2) Peer range and dev/test dependencies

- Peer range: leaving as `>=18.0.0` is sufficient to include React 19. Optionally, make the intent explicit as `">=18.0.0 <20"` or `^18 || ^19` (not required; `>=18` is already valid).
- For local development and CI validation with React 19, bump dev/test-time versions:

```bash
# Upgrade dev/test deps to React 19 for the branch
pnpm up -D react@^19 react-dom@^19 react-test-renderer@^19 @types/react@^19 @types/react-dom@^19

# Keep styled-components v6 (works with React 19), but align to latest
pnpm up -D styled-components@^6

# Update testing toolchain to latest compatible versions
pnpm up -D @testing-library/react@latest @testing-library/dom@latest @testing-library/jest-dom@latest @testing-library/user-event@latest jest@latest jest-environment-jsdom@latest

# Optional: update Storybook toolchain to latest 9.x (already at 9.1.2)
pnpm up -D storybook@latest @storybook/react@latest @storybook/react-vite@latest @storybook/addon-docs@latest @storybook/addon-links@latest eslint-plugin-storybook@latest

# Vite React plugin
pnpm up -D @vitejs/plugin-react@latest
```

Tip for CI matrix (without committing version bumps): you can patch `package.json` on the fly during a job, for example using `jq` or `npm pkg set` to temporarily set `devDependencies` to React 19, run tests, then discard changes. See “CI matrix” below.

---

### 3) Automated code refactors

#### 3.1 Replace `act` import path (automated)

React 19 expects `act` to be imported from `react` (not `react-dom/test-utils`). We detected exactly one occurrence:
- `src/components/content/PrismCode/__tests__/PrismCode.test.tsx`

Automated replacements (choose one):

```bash
# Using ripgrep + perl (works on macOS and Linux)
rg -l "from 'react-dom/test-utils'" src | xargs perl -pi -e "s/from 'react-dom\/test-utils'/from 'react'/g"

# Or (BSD sed on macOS)
rg -l "from 'react-dom/test-utils'" src | xargs sed -i '' "s/from 'react-dom\/test-utils'/from 'react'/g"
```

Validate with `pnpm test`.

#### 3.2 Optional: Normalize `createPortal` import (automated)

Not required for React 19, but we can modernize default `react-dom` import to named `createPortal` import for ESM/tree-shaking consistency.

Targets:
- `src/components/portal/Portal.tsx` (currently `ReactDOM.createPortal`) → `import { createPortal } from 'react-dom'` and call `createPortal(children, mountRoot)`.

If you prefer a simpler approach for `Portal.tsx` only:

```bash
# 1) change default import to named
perl -0777 -pe "s/import ReactDOM from 'react-dom';/import { createPortal } from 'react-dom';/" -i src/components/portal/Portal.tsx

# 2) replace call sites
perl -pi -e "s/ReactDOM\.createPortal\(/createPortal(/g" src/components/portal/Portal.tsx
```

Re-run build and tests after this optional change.

#### 3.3 Safety checks for removed/deprecated APIs (automated scans)

Run the scans below and confirm there are no hits (all should return empty):

```bash
# legacy renders (not expected in a library)
rg "ReactDOM\.(render|hydrate)\(" src || true

# legacy DOM access
rg "findDOMNode\(" src || true

# function component defaultProps
rg "\.defaultProps\s*=" src || true

# string refs
rg -n "ref=\"" src || true
```

If any appear unexpectedly, address them per official guidance:
- `render`/`hydrate` → `createRoot`/`hydrateRoot` (app-level only).
- `findDOMNode` → use a `ref` on the element directly.
- `defaultProps` on function components → default parameters or property defaults.
- String refs → callback refs or `useRef`.

---

### 4) Ecosystem compatibility and upgrades

- Testing libraries:
  - Ensure `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, and `@testing-library/user-event` are updated to latest. They support React 19.
  - If `@testing-library/react-hooks` usage becomes problematic on React 19, migrate tests to `renderHook` from `@testing-library/react`.
  - Keep `global.IS_REACT_ACT_ENVIRONMENT = true` in `src/test/setup.ts` unless it causes issues.

- Storybook:
  - You’re on Storybook 9.x already. Keep to the latest 9.x for React 19 compatibility. Validate both `dev` and `build`.

- Styled Components:
  - v6 is compatible with modern React. Stay on v6 and update to the latest patch.

- Other libs to sanity-check for compatibility with React 19:
  - `react-transition-group` (update to latest 4.x or 5.x if released for React 19).
  - `react-is` (update to latest; 18.3.x works broadly but you can adopt 19.x when available).
  - `@react-aria`, `@react-stately`, `@react-types` (✅ **Updated to latest versions with React 19 support**: `react-aria` 3.42.0, `react-stately` 3.40.0, and all related packages updated).
  - `@vitejs/plugin-react` (update to latest; already present).

Run after upgrades:

```bash
pnpm i
pnpm run fix
pnpm test
pnpm run build
pnpm run build-storybook
pnpm size
```

---

### 5) CI matrix for React 18 and 19 (automation)

Add a GitHub Actions job matrix to run tests and build against React 18 and React 19 without committing permanent version changes. Example outline:

```yaml
jobs:
  test-react:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        react: ["18", "19"]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm i
      - name: Switch dev React to target matrix version
        run: |
          if [ "${{ matrix.react }}" = "19" ]; then \
            npm pkg set devDependencies.react="^19" ; \
            npm pkg set devDependencies.react-dom="^19" ; \
            npm pkg set devDependencies.react-test-renderer="^19" ; \
            npm pkg set devDependencies.@types\u002freact="^19" ; \
            npm pkg set devDependencies.@types\u002freact-dom="^19" ; \
          else \
            npm pkg set devDependencies.react="^18" ; \
            npm pkg set devDependencies.react-dom="^18" ; \
            npm pkg set devDependencies.react-test-renderer="^18" ; \
            npm pkg set devDependencies.@types\u002freact="^18" ; \
            npm pkg set devDependencies.@types\u002freact-dom="^18" ; \
          fi
          pnpm i
      - run: pnpm run fix
      - run: pnpm test
      - run: pnpm run build
      - run: pnpm run build-storybook
```

This validates both major versions without altering `peerDependencies`.

---

### 6) Validation checklist

- Types: `tsc -p tsconfig.json` succeeds.
- Lint: `pnpm run fix` reports no new violations.
- Tests: `pnpm test` are green on both React 18 and 19.
- Storybook: `pnpm run build-storybook` succeeds, preview manual smoke test locally.
- Build: `pnpm run build` emits the same public API. No bundling regressions.
- Size: `pnpm size` shows no meaningful regression.

---

### 7) Release

- Prepare a changeset: `pnpm changeset`.
- Changelog notes: “Add official support for React 19. Update dev/test dependencies to React 19; keep `peerDependencies` as `>=18`.”
- Publish via existing workflow: `pnpm release`.

---

### Appendix: One-liner automation summary

```bash
# 1) Upgrade dev/test deps to React 19
pnpm up -D react@^19 react-dom@^19 react-test-renderer@^19 @types/react@^19 @types/react-dom@^19

# 2) Update testing libs
pnpm up -D @testing-library/react@latest @testing-library/dom@latest @testing-library/jest-dom@latest @testing-library/user-event@latest

# 3) Fix act import automatically
rg -l "from 'react-dom/test-utils'" src | xargs perl -pi -e "s/from 'react-dom\/test-utils'/from 'react'/g"

# 4) Optional: normalize portal import in Portal.tsx
perl -0777 -pe "s/import ReactDOM from 'react-dom';/import { createPortal } from 'react-dom';/" -i src/components/portal/Portal.tsx && \
perl -pi -e "s/ReactDOM\.createPortal\(/createPortal(/g" src/components/portal/Portal.tsx

# 5) Verify nothing else is required
rg "ReactDOM\.(render|hydrate)\(" src || true
rg "findDOMNode\(" src || true
rg "\.defaultProps\s*=" src || true
rg -n "ref=\"" src || true

# 6) Validate
pnpm run fix && pnpm test && pnpm run build && pnpm run build-storybook && pnpm size
```

---

### Notes and caveats

- This repo is a component library, not an application; `createRoot`/`hydrateRoot` changes don’t apply here.
- The optional portal import normalization is a cleanup, not a requirement.
- Avoid speculative large-scale refactors (e.g., removing `useMemo`/`useCallback`) unless adopting the React Compiler with measured perf gains. These hooks still work in React 19.
- Keep an eye on ecosystem compatibility (e.g., `react-transition-group`) and bump conservatively to versions that declare React 19 support.


