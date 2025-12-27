# Tasty Style Rendering Pipeline

This document describes the style rendering pipeline that transforms style objects into CSS rules. The pipeline ensures that each style value is applied to exactly one condition through exclusive condition building, boolean simplification, and intelligent CSS generation.

## Overview

The pipeline takes a `Styles` object and produces an array of `CSSRule` objects ready for injection into the DOM. The transformation happens in seven main stages:

```
Input: Styles Object
         ↓
    ┌─────────────────────────────────────┐
    │  1. PARSE CONDITIONS                │
    │     Parse state keys → ConditionNode│
    └─────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────┐
    │  2. EXPAND OR CONDITIONS            │
    │     Split ORs into exclusive entries│
    └─────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────┐
    │  3. BUILD EXCLUSIVE CONDITIONS      │
    │     Negate higher-priority entries  │
    └─────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────┐
    │  4. COMPUTE STATE COMBINATIONS      │
    │     Cartesian product across styles │
    └─────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────┐
    │  5. CALL HANDLERS                   │
    │     Compute CSS declarations        │
    └─────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────┐
    │  6. MERGE BY VALUE                  │
    │     Combine rules with same output  │
    └─────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────┐
    │  7. MATERIALIZE CSS                 │
    │     Condition → selectors + at-rules│
    └─────────────────────────────────────┘
         ↓
Output: CSSRule[]
```

---

## Stage 1: Parse Conditions

**File:** `parseStateKey.ts`

### What It Does

Converts state key strings (like `'hovered & !disabled'`, `'@media(w < 768px)'`) into `ConditionNode` trees that can be manipulated programmatically.

### How It Works

1. **Tokenization**: The state key is split into tokens using a regex pattern that recognizes:
   - Operators: `&` (AND), `|` (OR), `!` (NOT), `^` (XOR)
   - Parentheses for grouping
   - State tokens: `@media(...)`, `@root(...)`, `@own(...)`, `@(...)`, `@starting`, `@predefined`, modifiers, pseudo-classes

2. **Recursive Descent Parsing**: Tokens are parsed with operator precedence:
   ```
   ! (NOT) > ^ (XOR) > | (OR) > & (AND)
   ```

3. **State Token Interpretation**: Each state token is converted to a specific condition type:
   - `hovered` → `ModifierCondition` with `attribute: 'data-hovered'`
   - `theme=dark` → `ModifierCondition` with `attribute: 'data-theme', value: 'dark'`
   - `:hover` → `PseudoCondition`
   - `@media(w < 768px)` → `MediaCondition` with dimension bounds
   - `@root(theme=dark)` → `RootCondition` with selector `[data-theme="dark"]`
   - `@own(hovered)` → `OwnCondition` wrapping the parsed inner condition
   - `@(w < 600px)` → `ContainerCondition`
   - `@mobile` → Resolved via predefined states, then parsed recursively

### Why

The condition tree representation enables:
- Boolean algebra operations (simplification, negation)
- Semantic analysis (detect contradictions)
- Flexible CSS generation (different output for media vs. selectors)

### Example

```typescript
// Input
'hovered & @media(w < 768px)'

// Output ConditionNode
{
  kind: 'compound',
  operator: 'AND',
  children: [
    { kind: 'state', type: 'modifier', attribute: 'data-hovered', ... },
    { kind: 'state', type: 'media', subtype: 'dimension', upperBound: { value: '768px', ... }, ... }
  ]
}
```

---

## Stage 2: Expand OR Conditions

**File:** `exclusive.ts` (`expandOrConditions`)

### What It Does

Splits OR conditions into multiple exclusive entries, ensuring each OR branch only matches when prior branches don't.

### How It Works

For a condition `A | B | C`, creates three separate entries:
1. Condition: `A`
2. Condition: `B & !A`
3. Condition: `C & !A & !B`

### Why

OR conditions in CSS would normally overlap (multiple rules match simultaneously). By making branches exclusive **before** the main exclusive pass, we ensure:
- No overlapping CSS rules
- Correct precedence (first branch wins)
- Cleaner CSS output

### Example

```typescript
// Input entry
{ condition: '@media(light) | @media(no-preference)', value: 'dark' }

// Output entries
[
  { condition: '@media(light)', value: 'dark' },
  { condition: '@media(no-preference) & !@media(light)', value: 'dark' }
]
```

---

## Stage 3: Build Exclusive Conditions

**File:** `exclusive.ts` (`buildExclusiveConditions`)

### What It Does

Ensures each style entry applies in exactly one scenario by ANDing each condition with the negation of all higher-priority conditions.

### How It Works

Given entries ordered by priority (highest first):
```
A: value1 (priority 2)
B: value2 (priority 1)  
C: value3 (priority 0)
```

Produces:
```
A: A                    (highest priority, no negation needed)
B: B & !A               (applies only when A doesn't)
C: C & !A & !B          (applies only when neither A nor B)
```

Each exclusive condition is simplified. Entries that simplify to `FALSE` (impossible) are filtered out.

### Why

This eliminates CSS specificity wars. Instead of relying on cascade order, each CSS rule matches in exactly one scenario. Benefits:
- Predictable styling regardless of rule order
- No conflicts from overlapping conditions
- Easier debugging (each rule is mutually exclusive)

### Example

```typescript
// Style value mapping
{ padding: { '': '2x', 'compact': '1x', '@media(w < 768px)': '0.5x' } }

// After exclusive building (highest priority first):
// @media(w < 768px): applies when media matches
// compact & !@media(w < 768px): applies when compact but NOT media
// !compact & !@media(w < 768px): default, applies when neither
```

---

## Stage 4: Compute State Combinations

**File:** `index.ts` (`computeStateCombinations`)

### What It Does

Computes the Cartesian product of all style entries for a handler, creating snapshots of which value each style has for each possible state combination.

### How It Works

1. Collect exclusive entries for each style the handler uses
2. Compute Cartesian product: every combination of entries
3. For each combination:
   - AND all exclusive conditions together
   - Simplify the result
   - Skip if simplified to `FALSE`
   - Record the values for each style

### Why

Style handlers often depend on multiple style properties (e.g., `padding` might look at both `padding` and `gap`). By computing all valid combinations, we can call the handler once per unique state and get the correct CSS output.

### Example

```typescript
// Handler looks up: ['padding', 'size']
// padding has entries: [{ value: '2x', condition: A }, { value: '1x', condition: B }]
// size has entries: [{ value: 'large', condition: C }, { value: 'small', condition: D }]

// Combinations:
// { padding: '2x', size: 'large', condition: A & C }
// { padding: '2x', size: 'small', condition: A & D }
// { padding: '1x', size: 'large', condition: B & C }
// { padding: '1x', size: 'small', condition: B & D }
```

---

## Stage 5: Call Handlers

**File:** `index.ts` (within `processStyles`)

### What It Does

Invokes style handlers with computed value snapshots to produce CSS declarations.

### How It Works

1. For each state snapshot (condition + values):
   - Call the handler with the values
   - Handler returns CSS properties (e.g., `{ 'padding-top': '16px', 'padding-bottom': '16px' }`)
   - Handler may also return `$` (selector suffix) for pseudo-elements
2. Create computed rules with the condition, declarations, and selector suffix

### Why

Style handlers encapsulate the logic for translating design tokens (like `'2x'`) to actual CSS values (like `'16px'`). They can also handle complex multi-property styles (e.g., `padding` → `padding-top`, `padding-right`, etc.).

---

## Stage 6: Merge By Value

**File:** `index.ts` (`mergeByValue`)

### What It Does

Combines rules that have identical CSS output into a single rule with an OR condition.

### How It Works

1. Group rules by their declarations + selector suffix
2. For rules in the same group:
   - Merge their conditions with OR
   - Simplify the resulting condition
3. Output one rule per group

### Why

Different state combinations might produce the same CSS output. Rather than emitting duplicate CSS, we combine them into a single rule. This reduces CSS size and improves performance.

### Example

```typescript
// Before merging:
// condition: A → { color: 'red' }
// condition: B → { color: 'red' }

// After merging:
// condition: A | B → { color: 'red' }
```

---

## Stage 7: Materialize CSS

**File:** `materialize.ts`

### What It Does

Converts condition trees into actual CSS selectors and at-rules.

### How It Works

1. **Condition to CSS Components**: Walk the condition tree:
   - `ModifierCondition` → attribute selector (e.g., `[data-hovered]`)
   - `PseudoCondition` → pseudo-class (e.g., `:hover`)
   - `MediaCondition` → `@media` at-rule
   - `ContainerCondition` → `@container` at-rule
   - `RootCondition` → root prefix (e.g., `:root[data-theme="dark"]`)
   - `OwnCondition` → selector for parent element
   - `StartingCondition` → `@starting-style` wrapper

2. **AND (Cartesian Product)**: AND of conditions produces merged variants:
   ```
   (A1 | A2) & (B1 | B2) → A1&B1 | A1&B2 | A2&B1 | A2&B2
   ```

3. **OR (Concatenation)**: OR produces multiple variants (comma-separated selectors or multiple rules)

4. **Contradiction Detection**: During variant merging, detect impossible combinations:
   - Media contradictions: `@media (light) and not (light)`
   - Root contradictions: `:root[x]:not([x])`
   - Modifier contradictions: `[data-x]:not([data-x])`

5. **Grouping by At-Rules**: Variants with the same at-rules are grouped together (comma-separated selectors). Different at-rules produce separate CSS rules.

### Why

CSS has different mechanisms for different condition types:
- Modifiers → attribute selectors
- Media queries → `@media` blocks
- Container queries → `@container` blocks
- Root state → `:root` prefix

The materialization layer handles these differences while maintaining the logical semantics of the condition tree.

### Output Structure

```typescript
interface CSSRule {
  selector: string | string[];  // Selector fragment(s)
  declarations: string;          // CSS declarations (e.g., 'color: red;')
  atRules?: string[];            // Wrapping at-rules
  rootPrefix?: string;           // Root state prefix
}
```

---

## Condition Types

**File:** `conditions.ts`

### ConditionNode Hierarchy

```
ConditionNode
├── TrueCondition     (matches everything)
├── FalseCondition    (matches nothing)
├── CompoundCondition (AND/OR of children)
└── StateCondition
    ├── ModifierCondition    (data attributes: [data-hovered])
    ├── PseudoCondition      (CSS pseudo-classes: :hover)
    ├── MediaCondition       (media queries: @media(w < 768px))
    ├── ContainerCondition   (container queries: @container(w < 600px))
    ├── RootCondition        (root state: :root[data-theme="dark"])
    ├── OwnCondition         (parent element state: @own(hovered))
    └── StartingCondition    (@starting-style wrapper)
```

### Key Operations

- `and(...conditions)`: Create AND with short-circuit and flattening
- `or(...conditions)`: Create OR with short-circuit and flattening
- `not(condition)`: Negate with De Morgan's law support
- `getConditionUniqueId(condition)`: Get canonical ID for comparison

---

## Simplification

**File:** `simplify.ts`

### What It Does

Applies boolean algebra rules to reduce condition complexity and detect impossible combinations.

### Rules Applied

1. **Identity Laws**:
   - `A & TRUE = A`
   - `A | FALSE = A`

2. **Annihilator Laws**:
   - `A & FALSE = FALSE`
   - `A | TRUE = TRUE`

3. **Contradiction Detection**:
   - `A & !A = FALSE`

4. **Tautology Detection**:
   - `A | !A = TRUE`

5. **Idempotent Laws** (via deduplication):
   - `A & A = A`
   - `A | A = A`

6. **Absorption Laws**:
   - `A & (A | B) = A`
   - `A | (A & B) = A`

7. **Range Intersection**: For dimension queries
   - `@media(w > 400px) & @media(w < 300px) = FALSE` (impossible range)

8. **Attribute Conflict Detection**:
   - `[data-theme="dark"] & [data-theme="light"] = FALSE`

### Why

Simplification reduces CSS output size and catches impossible combinations early, preventing invalid CSS rules from being generated.

---

## Caching Strategy

Each pipeline stage uses LRU caching:

| Cache | Key | Purpose |
|-------|-----|---------|
| `pipelineCache` | Stringified styles | Skip full pipeline for identical styles |
| `parseCache` | State key + context | Skip re-parsing identical state keys |
| `simplifyCache` | Condition unique ID | Skip re-simplifying identical conditions |
| `conditionCache` | Condition key | Skip re-materializing identical conditions |

---

## Example Walkthrough

### Input

```typescript
const styles = {
  color: {
    '': '#white',
    '@media(prefers-color-scheme: dark)': '#dark',
    'hovered': '#highlight'
  }
}
```

### Stage 1: Parse Conditions

```
'' → TrueCondition
'@media(prefers-color-scheme: dark)' → MediaCondition(feature='prefers-color-scheme', value='dark')
'hovered' → ModifierCondition(attribute='data-hovered')
```

### Stage 2: Expand OR Conditions

No ORs present, entries unchanged.

### Stage 3: Build Exclusive Conditions

Processing order (highest priority first): `hovered`, `@media(dark)`, `default`

```
hovered: [data-hovered]
@media(dark) & !hovered: @media(dark) & :not([data-hovered])
!hovered & !@media(dark): :not([data-hovered]) & not @media(dark)
```

### Stage 4-5: Compute Combinations & Call Handler

Single style, three entries → three snapshots, each producing a color declaration.

### Stage 6: Merge By Value

Each has different color, no merging occurs.

### Stage 7: Materialize CSS

```css
.t1.t1[data-hovered] { color: var(--highlight-color); }
@media (prefers-color-scheme: dark) { .t1.t1:not([data-hovered]) { color: var(--dark-color); } }
@media not (prefers-color-scheme: dark) { .t1.t1:not([data-hovered]) { color: var(--white-color); } }
```

---

## Key Design Decisions

### 1. Exclusive Conditions Over CSS Specificity

Rather than relying on CSS cascade rules, we generate mutually exclusive selectors. This makes styling predictable and debuggable.

### 2. DNF for OR Conditions

OR conditions are expanded to Disjunctive Normal Form (OR of ANDs), which maps directly to CSS comma-separated selectors or multiple rules.

### 3. Early Contradiction Detection

Impossible combinations are detected at multiple levels (simplification, variant merging) to avoid generating invalid CSS.

### 4. Aggressive Caching

Each stage is cached independently, enabling fast re-rendering when only parts of the style object change.

