---
"@cube-dev/ui-kit": minor
---

Migrate from internal tasty module to external `@tenphi/tasty` package.

**Breaking changes:**
- Removed sub-path exports: `@cube-dev/ui-kit/tasty/static`, `@cube-dev/ui-kit/tasty/zero`, `@cube-dev/ui-kit/tasty/zero/babel`, `@cube-dev/ui-kit/tasty/zero/next`
- Consumers should import these directly from `@tenphi/tasty/static`, `@tenphi/tasty/zero`, `@tenphi/tasty/babel-plugin`, `@tenphi/tasty/next` instead

**Internal changes:**
- Removed internal `src/tasty/` directory (~133 files)
- All internal imports now use `@tenphi/tasty` package
- Added `isDevEnv` utility to `src/utils/is-dev-env.ts`
