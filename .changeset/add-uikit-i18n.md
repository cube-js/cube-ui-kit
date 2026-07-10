---
"@cube-dev/ui-kit": minor
---

Add built-in i18n: a shared i18next instance (read via `getI18n()`) with 12 locale bundles, an `I18nProvider` wired into `Root`, locale-aware formatters (`useFormatter`, `formatDate`, `formatNumber`, etc.), and translated defaults across UI Kit components. Re-export `i18next` and `react-i18next` so hosts import a single copy from `@cube-dev/ui-kit`.
