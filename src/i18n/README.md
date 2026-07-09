# UI Kit i18n

`@cube-dev/ui-kit` **owns the i18n stack**. It depends on `i18next` + `react-i18next`
directly (regular `dependencies`, not peers), re-exports their public API, and owns
the single shared i18next instance every UI Kit component reads from. Consumers
(e.g. Cube Cloud) import **all** i18n symbols from `@cube-dev/ui-kit` so the whole
app runs on exactly one copy / one version / one instance.

## What's here

| File | Purpose |
| --- | --- |
| `locales.ts` | `SUPPORTED_LOCALES` (the 12 Cloud locales), `SupportedLocale`, `LOCALE_LABELS`, `isSupportedLocale`. Self-contained — no dependency on the cloud `cross-runtime` package. |
| `instance.ts` | Creates the shared instance (`createInstance()` → `initReactI18next` → `init(...)`), eagerly registers all 12 `uikit` bundles, exports `getUIKitI18n()`. |
| `useUIKitTranslation.ts` | Internal hook every UI Kit component uses: `useTranslation('uikit', { i18n: getUIKitI18n() })`. Binds explicitly to the shared instance so strings resolve even without an `<I18nextProvider>` (Storybook, unit tests, non-i18next hosts). |
| `index.ts` | Public UI Kit i18n API: `addUIKitLocale`, `configureUIKitI18n`, the instance, locale exports. |
| `locales/<locale>/uikit.json` | One bundle per locale. `en-US` is the source of truth. |

The instance is initialized with the options Cloud relies on: `enableSelector: true`
(the typed `t($ => $.key)` selector API), `interpolation.escapeValue: false`,
`fallbackLng: 'en-US'`, `load: 'currentOnly'`, `returnNull: false`,
`returnEmptyString: true`, `ns: ['uikit']`, and `react: { useSuspense: false }`.

## Using it inside the UI Kit

Never hardcode a user-facing string. Add a key to `locales/en-US/uikit.json`,
translate it into **all 12 locales** (see below), and read it with the internal hook:

```tsx
import { useUIKitTranslation } from '../../../i18n';

function MyComponent() {
  const { t } = useUIKitTranslation();

  // English default is kept inline as a belt-and-suspenders fallback.
  return <button aria-label={t('myComponent.close', 'Close')} />;
}
```

- Component props that expose a label (`emptyLabel`, `searchPlaceholder`, …) stay as
  **overrides** that win over the translated default: `emptyLabel = t('...', 'No items')`.
- Interpolation uses `{{double}}` braces (no ICU): `t('copySnippet.copied', '{{title}} copied', { title })`.
- If a string is also used as a DOM selector (e.g. TabButton queries the rename
  input by its `aria-label`), build the selector from the **same** `t(...)` value so
  they can't drift when the language changes.

## Translations — all 12 locales, always

`en-US` is the source of truth. Every key must exist in **all** locales with a real
translation (not an English placeholder). Follow Cloud's translation guide and
glossary (register/capitalization per locale, Do-Not-Translate brand/tech tokens):

- `packages/console-ui/src/i18n/README.md`
- `packages/console-ui/src/i18n/glossary.json`

`locale-parity.test.ts` fails CI if any locale's key set diverges from `en-US`, or if
a locale drops/adds an `{{interpolation}}` token relative to `en-US`.

### Adding languages beyond the shipped set

Hosts can register extra locales (or override individual strings) at runtime — this
drives the same shared instance, so it takes effect immediately:

```ts
import { addUIKitLocale } from '@cube-dev/ui-kit';

addUIKitLocale('zz-ZZ', { tag: { close: 'Zzz' } });
```

## How a host connects (architecture)

The UI Kit owns the library **and** the instance; the host owns its own strings and
drives language:

```
@cube-dev/ui-kit
  ├─ shared instance (createInstance + initReactI18next + init)
  ├─ re-exports: useTranslation, Trans, I18nextProvider, initReactI18next, i18next, …
  ├─ uikit namespace (12 locales) + addUIKitLocale
  └─ Root wraps children in <UIKitI18nProvider> (i18next instance + React Aria locale)

host (Cube Cloud)
  ├─ import i18next / react-i18next / the instance from @cube-dev/ui-kit
  ├─ addResourceBundle('chat', …) / loadNamespaces(…) on the SAME instance
  └─ changeLanguage(...) → flips UI Kit strings for free (one instance)
```

## Locale provider — formatting follows the language

Translated strings are only half of localization — dates, numbers, and string
collation are formatted by **React Aria**, which reads its locale from the nearest
`<I18nProvider>` (from `@react-aria/i18n`) and otherwise falls back to the browser
default. These are two independent library contexts (react-i18next carries the
_instance_; react-aria carries a _locale string_), so they can't be one physical
provider — but the language is one concept. `UIKitI18nProvider` composes both from a
single component, making the i18next instance the source of truth and _deriving_ React
Aria's locale from it. `Root` renders it once:

```
Root
  └─ <UIKitI18nProvider>                           ← single UI Kit provider
       ├─ <I18nextProvider i18n={getUIKitI18n()}>  ← translated strings
       └─ <I18nProvider locale={i18n.language}>     ← React Aria formatting
```

`UIKitI18nProvider` reads the current language via `useUIKitTranslation` (which
re-renders on `languageChanged`), so a single `getUIKitI18n().changeLanguage('de-DE')`
gives German labels **and** German number/date formatting. Consequently
`useLocale`, `useNumberFormatter`, `useDateFormatter`, `useCollator`, and `useFilter`
all resolve to the active language automatically — `NumberInput`, `Slider`, and the
`Calendar` family already benefit with no per-component wiring.

`I18nProvider` and `useLocale` are re-exported from `@cube-dev/ui-kit` so hosts read
the same locale context; `UIKitI18nProvider` also accepts an optional `locale` prop to
force a specific BCP-47 tag when a subtree must diverge from the shared language.

> **Note:** `DateInput` / `DatePickerInput` keep an explicit `useLocale` opt-in prop
> and default to `'en-US'` formatting for backward compatibility. Pass `useLocale`
> to have those components follow the shared language too.

## Formatting — `useFormatter()` and the pure helpers

Building on the locale provider, the UI Kit exposes a locale-aware formatting API
so dates, numbers, currency, etc. follow the active language without every consumer
re-implementing `Intl.*`. It wraps React Aria's / the platform's `Intl` primitives;
all instances are memoized (by locale + kind + options).

**In components — one hook, many helpers:**

```tsx
import { useFormatter } from '@cube-dev/ui-kit';

function Row({ createdAt, amount }) {
  const { formatDate, formatCurrency } = useFormatter();

  return (
    <>
      <span>{formatDate(createdAt)}</span>
      <span>{formatCurrency(amount)}</span>
    </>
  );
}
```

`useFormatter()` reads the locale from React Aria's `useLocale()` (the provider), so
it re-binds automatically when the language changes.

**In non-render code — pure helpers.** Table column definitions, event handlers, and
plain utilities can't call a hook, so use the top-level functions. They read the
locale from a module mirror that `UIKitI18nProvider` keeps in sync:

```ts
import { formatDate, formatCurrency, formatBytes } from '@cube-dev/ui-kit';

const columns = [
  { key: 'createdAt', render: (v) => formatDate(v) },
  { key: 'cost', render: (v) => formatCurrency(v) },
];
```

For a locale that must diverge from the shared language, build a bundle explicitly:
`createFormatter('de-DE').formatCurrency(...)`.

**The bundle** (`useFormatter()` / `createFormatter(locale)`): `formatDate`,
`formatTime`, `formatDateTime`, `formatRelativeTime`, `formatNumber`,
`formatCurrency`, `formatPercent`, `formatBytes`, `formatList`, plus `locale`. The
pure top-level exports mirror these **except** `formatRelativeTime` (see below).

### Conventions

- **Date input** accepts `Date | number | string` (ISO parsed); invalid input →
  `''` (callers own placeholders like `'Never'`). The date-value type is exported as
  `FormatDateInput` (not `DateInput` — that name is the DatePicker field component).
- **`formatDate` / `formatTime` / `formatDateTime`** use Intl style presets
  (`dateStyle: 'medium'`, `timeStyle: 'short'`); pass any `Intl.DateTimeFormatOptions`
  to override. This is skeleton-based, so date-fns-style custom patterns
  (`"MMM d 'at' HH:mm"`) are intentionally not reproduced — Intl localizes correctly
  across all 12 locales, which en-centric patterns don't.
- **`formatPercent`** takes a fraction: `0.5` → `"50%"`.
- **`formatBytes`** uses decimal (1000-based) units and lets Intl localize the unit
  label (`"1.5 kB"`, auto-scaled by magnitude).
- **`formatCurrency`** defaults to `{ currency: 'USD' }`.
- **`formatRelativeTime`** uses `Intl.RelativeTimeFormat` for true locale-native
  output (`"5 minutes ago"`, `"vor 5 Minuten"`). It is **not** a top-level pure export
  — the name `formatRelativeTime` is already taken by the Notifications module's
  compact, translation-key-based variant (`"5 min ago"`). Reach the Intl version via
  `useFormatter().formatRelativeTime` or `createFormatter(locale).formatRelativeTime`.

## Future Cloud migration (out of scope for this change — no Cloud edits yet)

When Cloud adopts this, the steps are:

1. **Drop Cloud's own i18n libraries.** Remove `i18next` + `react-i18next` from
   `packages/console-ui/package.json`; import them (and `Trans`, `useTranslation`,
   `I18nextProvider`, etc.) from `@cube-dev/ui-kit` instead. This guarantees a single
   physical copy and version across the app.
2. **Use the exported shared instance.** Replace the `createInstance()` / `init()` in
   `packages/console-ui/src/i18n/index.ts` with the instance imported from
   `@cube-dev/ui-kit`. Move the current `init({ resources, ns })` onto it as
   `addResourceBundle(...)` + `loadNamespaces(...)` — Cloud's `ensureLocaleLoaded`
   already uses `addResourceBundle`, so this is a natural change. i18next allows only
   one `init()`, and the UI Kit already did it.
3. **Keep `defaultNS` as Cloud needs it.** Call `configureUIKitI18n({ defaultNS: 'chat' })`
   (or `setDefaultNamespace`) if Cloud wants a non-`uikit` default. UI Kit components
   always request `'uikit'` explicitly, so they're unaffected either way.
4. **Leave `i18next.d.ts` augmentation as-is.** Cloud's global `CustomTypeOptions`
   augmentation still applies because there's exactly one real `i18next` package in the
   tree. The UI Kit deliberately does **not** re-augment that interface (it would
   conflict at `tsc`) — it types its own `t` locally from the `en-US` JSON shape.

Because it's the same instance, switching language in Cloud switches UI Kit strings
automatically — no bridging code, no second instance, no version skew.
