---
"@cube-dev/ui-kit": minor
---

Add built-in i18n: a shared i18next instance with 12 locale bundles, `UIKitI18nProvider` wired into `Root`, locale-aware formatters (`useFormatter`, `formatDate`, `formatNumber`, etc.), and translated defaults across UI Kit components. Re-export `i18next` and `react-i18next` so hosts import a single copy from `@cube-dev/ui-kit`.
