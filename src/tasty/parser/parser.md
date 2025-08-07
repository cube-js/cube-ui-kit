# Style Parser – Complete Specification (v3)

## Table of Contents

1. [Overview & Scope](#overview--scope)
2. [Public API](#public-api)
3. [Core Concepts](#core-concepts)
4. [Parsing Pipeline](#parsing-pipeline)
5. [Token-Classification Rules](#token-classification-rules)
6. [Replacement Rules](#replacement-rules)
7. [Grouping & ProcessedStyle Construction](#grouping--processedstyle-construction)
8. [Cache Behavior](#cache-behavior)
9. [Error Handling & Best-Effort Strategy](#error-handling--best-effort-strategy)
10. [Normalization Rules](#normalization-rules)
11. [Performance Constraints](#performance-constraints)
12. [Definitive Lists](#definitive-lists)
13. [Edge-Case Playbook](#edge-case-playbook)
14. [Non-Goals](#non-goals)
15. [Implementation Plan (for developers)](#implementation-plan-for-developers)

---

## 1. Overview & Scope

The Style Parser converts an arbitrary CSS-like value string into:

- **output** — a rewritten string that can be dropped into a style declaration, and
- **groups** — structured metadata (`StyleDetails[]`) for each top-level comma-separated segment.

**Supported features:**

- Color tokens and all CSS Color 5 functions.
- Custom units and auto-calc syntax (`2x`, `-.5r`, `(100% - 2r)` …).
- User-defined functions supplied via `funcs`.
- Custom properties with `$` syntax.
- Classification into values, colors, and modifiers.
- Whitespace compression.
- Bounded, configurable LRU cache.

The parser operates in a single pass and never throws on malformed input.

**Recent Change**: Custom properties with fallbacks now use the syntax `($prop-name, fallback)` instead of `$(prop-name, fallback)`.

---

## 2. Public API

### Types

```ts
type StyleDetails = {
  output: string;   // processed subgroup string
  mods:   string[]; // recognized modifiers
  values: string[]; // recognized numeric / functional / keyword values
  colors: string[]; // recognized colors
  all:    string[]; // colors ∪ values ∪ mods, in source order
};

type ProcessedStyle = {
  output: string;        // group outputs joined with ", "
  groups: StyleDetails[] // one per top-level comma
};
```

### Options

```ts
type UnitHandler = (scalar: number) => string;

interface ParserOptions {
  funcs?: Record<
    string,
    (parsedArgs: StyleDetails[]) => string
  >;
  units?: Record<string, string | UnitHandler>;
  cacheSize?: number;           // default = 1000
}
```

### Class

```ts
class StyleParser {
  constructor(opts?: ParserOptions);

  /** Parse a style string. */
  process(src: string): ProcessedStyle;

  /** Replace the entire funcs table. */
  setFuncs(funcs: Required<ParserOptions>['funcs']): void;

  /** Replace the entire units table. */
  setUnits(units: Required<ParserOptions>['units']): void;

  /** Patch any subset of options (including cacheSize). */
  updateOptions(patch: Partial<ParserOptions>): void;
}
```

Each `StyleParser` instance maintains its own LRU cache.

---

## 3. Core Concepts

| Term              | Meaning                                                                 |
|-------------------|-------------------------------------------------------------------------|
| token             | A contiguous chunk of input that is meaningful outside parentheses, URLs, and comments. |
| group             | A sequence of tokens delimited by a top-level comma (depth 0).          |
| value             | Magnitude/keyword/function that is not a color.                         |
| color             | A hash color token or a recognized color function call.                 |
| modifier          | Anything else (e.g., thin, right).                                      |
| auto-calc group   | Parentheses not immediately preceded by an identifier or `url(`; rewritten to `calc( … )`. |

---

## 4. Parsing Pipeline

1. **Pre-scan normalization**
   - Lower-case entire string.
   - Strip CSS comments `/* … */`.
2. **Single-pass state machine**
   - Track depth (parentheses), `inUrl`, and `inQuote` flags.
   - At depth 0 & outside quotes/url:
     - `,` → flush current token & end group.
     - Whitespace → flush token, collapse spaces.
3. **Token flush** → classify (see §5) → append to current `StyleDetails`.
4. **Post-group** → build `StyleDetails.output` (join processed tokens with single spaces).
5. **Post-file** → join group outputs with `, ` → build `ProcessedStyle.output`.

---

## 5. Token-Classification Rules

| Order | Rule                                                                                       | Bucket   |
|-------|--------------------------------------------------------------------------------------------|----------|
| 1     | URL – `url(` opens `inUrl`; everything to its `)` is a single token.                       | value    |
| 2     | Custom property – `$ident` → `var(--ident)`; `($ident,fallback)` → `var(--ident, <processed fallback>)`. Only first `$` per token counts. | value    |
| 3     | Hash token – `#xxxxxx` if valid hex → `var(--xxxxxx-color, #xxxxxx)`; otherwise `var(--name-color)`. | color    |
| 4     | Color function – name in list §12.2 followed by `(` (balanced).                            | color    |
| 5     | User / other function – `ident(` not in color list; parse args recursively, hand off to `funcs[name]` if provided; else rebuild with processed args. | value    |
| 6     | Auto-calc group – parentheses not preceded by identifier. See §6.                          | value    |
| 7     | Numeric + custom unit – regex `^[+-]?(\d*.\d+ \d+)([a-z][a-z0-9]*)$` and unit key exists.  |          |
| 8     | Literal value keyword – exactly `auto`, `max-content`, `min-content`, `fit-content`, `stretch`. | value    |
| 9     | Fallback                                                                                   | modifier |

Each processed string is inserted into its bucket and into `all` in source order.

---

## 6. Replacement Rules

| Situation                | Replacement                                                                                  |
|--------------------------|---------------------------------------------------------------------------------------------|
| Custom unit (`2x`, `.75r`, `-3cr`) | `units[unit]`: • string → `calc(n * replacement)` • function → `calc(handler(numeric))`<br> `0u` stays `calc(0 * …)` (unit info preserved). |
| Auto-calc parentheses    | Applies anywhere, nesting allowed.<br>Trigger = `(` whose previous non-space char is not `[a-z0-9_-]` and not `l` in `url(`.<br>Algorithm:<br>1. Strip outer parens.<br>2. Recursively parse inner text (so `2r`, `#fff`, nested auto-calc, etc., all expand).<br>3. Wrap in `calc( … )`. |
| Custom property          | `$ident` → `var(--ident)` \| `($ident,fallback)` → `var(--ident, <processed fallback>)` |
| Hash colors              | As in §5-3.                                                                                 |
| Color functions          | Arguments are parsed, inner colors re-expanded; function name retained.                     |
| User functions           | If `funcs[name]` exists → call with parsed arg-`StyleDetails[]`, use return string.<br>Else rebuild `ident(<processed args>)`. |

---

## 7. Grouping & ProcessedStyle Construction

- Group output = processed tokens joined by single spaces (redundant whitespace removed).
- File output = group outputs concatenated with `, ` (exactly one comma + space).
- Each bucket keeps original token order.

---

## 8. Cache Behavior

- Bounded LRU, keyed by the exact source string.
- Capacity = `options.cacheSize ?? 1000`.
- On hit, return the same `ProcessedStyle` object (no deep copy).

---

## 9. Error Handling & Best-Effort Strategy

- Parser never throws.
- On unmatched `)` / premature EOF → treat remainder as raw modifier token.
- Invalid unit number → leave token untouched, classify as modifier.
- Multiple `$` in one token → first valid custom-property processed, rest ignored.

---

## 10. Normalization Rules

- Entire input lower-cased before parsing.
- Outside parentheses/url, contiguous whitespace collapses to a single space.
- Leading & trailing spaces of the whole input are trimmed.

---

## 11. Performance Constraints

- Strict single-pass (O(n)) outer scan; recursion only for function/auto-calc substrings.
- No AST; minimal allocations.
- All regexes pre-compiled.

---

## 12. Definitive Lists

### 12.1 Value-keyword list

```
none auto max-content min-content fit-content
```

### 12.2 Recognized color functions

```
rgb rgba hsl hsla hwb lab lch oklab oklch color device-cmyk gray color-mix color-contrast
```
(case-insensitive)

### 12.3 CSS number (without exponent)

```
^[+-]?(\d*\.\d+|\d+)$
```

---

## 13. Edge-Case Playbook

| Case                           | Expected outcome                                                                 |
|--------------------------------|----------------------------------------------------------------------------------|
| `url("img,with,comma.png")`    | Single value token; comma doesn’t split.                                         |
| `sum(min(1x,2x),(1px+5%))`     | Inner `(1px+5%)` → `calc(1px + 5%)`.                                            |
| `.75x`                         | `calc(0.75 * var(--gap))` value.                                                |
| `1bw top #purple, 1ow right #dark-05` | Two groups; colors processed; positions as modifiers.                  |
| Comments `/*…*/2x`             | `calc(2 * var(--gap))`.                                                         |
| `#+not-hash`                   | Modifier (fails hex test).                                                      |
| `($custom-gap, 1x)`           | `var(--custom-gap, var(--gap))` (new custom property syntax).                  |
| Excess spaces/newlines         | Collapsed in output.                                                            |
| `+2r, 1e3x`                    | Invalid → modifiers.                                                            |
| Unicode identifiers            | Modifiers (parser supports only kebab-case ASCII idents).                       |

---

## 14. Non-Goals

- Full CSS selector/at-rule parsing.
- Constant-folding math inside `calc()`.
- Vendor prefix quirks.
- Generating an AST.

---

## 15. Implementation Plan (for developers)

1. Tokenizer + state machine per §4.
2. Classifier implementing §5 & §6.
3. Group builder (collect `StyleDetails`).
4. Output builder (whitespace collapse, commas).
5. LRU cache (simple doubly-linked list + map).
6. Exposed mutator methods (`setFuncs`, `setUnits`, `updateOptions`).
7. Unit tests – provided suite plus all edge cases in §13.
8. Benchmark with long strings to check O(n) behavior.
