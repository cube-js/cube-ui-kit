# Contributing

## Requirements

- [Node.js](https://nodejs.org/) >= 22.14.0
- [pnpm](https://pnpm.io/) >= 10

## Getting Started

```bash
pnpm install
pnpm storybook   # starts Storybook on http://localhost:6060
```

## Commit Convention

Follow the `category: message` format:

| Category | Use for |
|----------|---------|
| `feat` | New features or components |
| `fix` | Bug fixes (reference an issue when possible) |
| `refactor` | Code changes that are neither a fix nor a feature |
| `docs` | Documentation updates |
| `build` | Build config or dependency changes |
| `test` | Adding or updating tests |
| `ci` | CI/CD configuration |
| `chore` | Everything else (formatting, tooling, etc.) |

See the [Conventional Commits](https://www.conventionalcommits.org/) spec for details.

## Steps to PR

1. **Branch** off `main` using the convention `type/scope` — e.g. `fix/select-overflow`, `feat/date-range-picker`, `docs/menu-typo`.

2. **Develop** your changes. Verify as you go:

```bash
pnpm build          # check the build
pnpm test           # run unit tests (Vitest)
pnpm fix            # lint + format
```

3. **Create a changeset** to describe your changes for the changelog:

```bash
pnpm changeset
```

   [Learn more about Changesets.](https://github.com/atlassian/changesets/tree/master/packages/cli)

   > For trivial changes (CI config, formatting, etc.) use `pnpm changeset add --empty`.
   >
   > If your changeset includes JSX snippets, disable live preview: `` ```jsx live=false ``

4. **Push** and open a Pull Request against `main`.

## Tests

All bug fixes and new features should include tests. The project uses [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) and [Chromatic](https://www.chromatic.com/) for visual regression.

```bash
pnpm test             # run all tests
pnpm test -- Button   # run tests matching "Button"
pnpm test -u          # update snapshots
pnpm chromatic        # visual regression (requires token)
```
