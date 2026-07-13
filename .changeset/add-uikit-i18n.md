---
'@cube-dev/ui-kit': minor
---

Add built-in i18n: a default i18next instance (read via `getI18n()`), request-local instances from `createUIKitI18n(locale)`, 12 locale bundles, an `I18nProvider` wired into `Root`, locale-aware formatters (`useFormatter` and `createFormatter(locale)`), and translated defaults across UI Kit components. Re-export `i18next` and `react-i18next` so hosts import a single copy from `@cube-dev/ui-kit`.
