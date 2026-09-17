# Modern Form: Cloud type-check comparison

Measured on 2026-09-17 with Node 22.14.0 and Cloud's TypeScript 7.0.2 compiler, without incremental compilation. Baseline: installed UI Kit 0.177.0. Candidate: UI Kit commit `1caa190b`, including Phases 5–8. Cloud checkout: `8742fe489a92274712e4508b41ae548b7040c8f3`.

The roots are the existing `NarrowForm`, `SAMLOptionsForm`, `LDAPOptionsForm`, `SettingsEnvVarsForm`, and `SaveableCard` sources, plus Cloud's ambient declarations. Their real import graph covers roughly 6,000 files; no application imports are stubbed. This exercises existing legacy usage after a declaration upgrade. Modern typed commands and examples are checked separately by `pnpm test:types:consumer`.

## Method and scope

Build UI Kit with its pinned Node 24 environment, then run `node scripts/benchmark-cloud-form-types.mjs /path/to/cloud 3` under Cloud's Node 22.14. The script writes configs, candidate declaration copies, logs, and a JSON report to the OS temporary directory. It never installs dependencies, changes Cloud files, or writes Cloud's incremental cache. The script alternates installed/candidate order across three pairs and checks that diagnostics are stable across repeats.

Both variants resolve through Cloud's installed dependency graph, including React 19.1.1, its React types, i18next 26.3.2, and Tasty 3.7.0. The candidate declaration copy has a temporary dependency-directory symlink outside the Cloud checkout. Reading UI Kit's `dist` in place would resolve its own React/i18next copies and introduce unrelated identity errors. This controlled comparison measures declaration compatibility and cost; it does not simulate a complete dependency installation or certify a Cloud release with newer Tasty. UI Kit's own source/consumer, React 18/19, and compiled adapter gates use its actual Tasty 3.9.2 dependency.

## Results

| Metric | Installed | Candidate | Difference |
| --- | --: | --: | --: |
| Median check time | 11.903 s | 12.445 s | +0.542 s (+4.6%) |
| Median total time | 12.706 s | 13.188 s | +0.482 s (+3.8%) |
| Median memory, compiler-reported K | 4,136,428 | 4,139,828 | +3,400 (+0.08%) |
| Types | 5,856,854 | 5,857,994 | +1,140 (+0.02%) |
| Instantiations | 7,470,697 | 7,475,324 | +4,627 (+0.06%) |
| Files | 5,999 | 6,008 | +9 |
| Existing diagnostic headlines | 75 | 75 | No additions or removals |

| Pair                | Installed check / total | Candidate check / total |
| ------------------- | ----------------------- | ----------------------- |
| 1                   | 11.899 / 12.666 s       | 12.544 / 13.352 s       |
| 2 (candidate first) | 11.903 / 12.706 s       | 11.921 / 12.681 s       |
| 3                   | 12.015 / 12.792 s       | 12.445 / 13.188 s       |

The candidate introduces no new diagnostic headlines. Both compilations still exit with type errors: the same 75 existing diagnostics occur in the baseline and candidate, so this is not a claim that Cloud fully typechecks. Timings overlap across runs; three local pairs give a useful regression comparison, not a precise universal cost. Type and instantiation growth stays below 0.1%, with no recursive path-enumeration blow-up.

## Fixes found by the comparison

The initial candidate exposed two Form compatibility issues: a union root signature lost contextual typing for inline submit/failure callbacks, and strict modern rules rejected some existing legacy validator signatures and grouped arrays. Phase 8 introduces root overloads and compatible shared input rule types, with compiled consumer regressions. Modern validators can still be checked strictly with `ModernValidationRule`; legacy validators that resolve a data object must be adapted before moving that form to the modern backend. No Cloud source was changed to make the candidate pass the comparison.
