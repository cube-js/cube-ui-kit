/**
 * Advanced State Mapping - Predefined States Management
 *
 * This module handles global and local predefined states for the Tasty styling system.
 * See ADVANCED_STATE_MAPPING.md for full specification.
 */

import { hasStylesGenerated } from '../config';
import { Styles } from '../styles/types';
import { isDevEnv } from '../utils/isDevEnv';

/**
 * Parsed advanced state information
 */
export interface ParsedAdvancedState {
  type:
    | 'media'
    | 'container'
    | 'root'
    | 'own'
    | 'starting'
    | 'predefined'
    | 'modifier';
  condition: string; // e.g., 'width <= 920px' or 'hovered'
  containerName?: string; // for container queries
  raw: string; // original state key
  mediaType?: string; // for @media:screen, @media:print, etc.
}

/**
 * Context for state parsing operations
 */
export interface StateParserContext {
  localPredefinedStates: Record<string, string>;
  globalPredefinedStates: Record<string, string>;
  isSubElement?: boolean; // true when processing sub-element styles (for @own() validation)
}

/**
 * At-rule context for CSS generation
 */
export interface AtRuleContext {
  media?: string[]; // @media conditions to wrap rule in (merged with 'and')
  container?: { name?: string; condition: string }[]; // @container conditions (nested)
  startingStyle?: boolean;
  rootStates?: string[]; // :root state selectors (e.g., '[data-theme="dark"]')
  negatedRootStates?: string[]; // Negated :root state selectors for non-overlapping rules (e.g., ':not([data-theme="dark"])')
}

// Built-in state names that cannot be overridden
const BUILTIN_STATES = new Set([
  '@starting',
  '@keyframes',
  '@properties',
  '@supports',
]);

// Reserved prefixes that are built-in
const RESERVED_PREFIXES = [
  '@media',
  '@root',
  '@own',
  '@(',
  '@starting',
  '@keyframes',
  '@properties',
  '@supports',
];

// Global predefined states storage
let globalPredefinedStates: Record<string, string> = {};

// Warnings tracking to avoid duplicates
const emittedWarnings = new Set<string>();

const devMode = isDevEnv();

/**
 * Emit a warning only once
 */
function warnOnce(key: string, message: string): void {
  if (devMode && !emittedWarnings.has(key)) {
    emittedWarnings.add(key);
    console.warn(message);
  }
}

/**
 * Configure global predefined states
 */
export function setGlobalPredefinedStates(
  states: Record<string, string>,
): void {
  if (hasStylesGenerated()) {
    const newStateNames = Object.keys(states).join(', ');
    warnOnce(
      `dynamic-states:${newStateNames}`,
      `[Tasty] Cannot update predefined states after styles have been generated.\n` +
        `The new definition(s) for ${newStateNames} will be ignored.`,
    );
    return;
  }

  // Validate state names
  for (const [name, value] of Object.entries(states)) {
    // Check for valid name format
    if (!/^@[A-Za-z][A-Za-z0-9-]*$/.test(name)) {
      warnOnce(
        `invalid-state-name:${name}`,
        `[Tasty] Invalid predefined state name '${name}'. Must start with '@' followed by a letter.`,
      );
      continue;
    }

    // Check for reserved names
    if (BUILTIN_STATES.has(name)) {
      warnOnce(
        `reserved-state:${name}`,
        `[Tasty] Cannot define predefined state '${name}'. This name is reserved for built-in functionality.`,
      );
      continue;
    }

    // Check for reserved prefixes (but only exact matches, not user-defined states like @mobile)
    // Reserved prefixes are: @media, @root, @own, @(
    // A user state like @mobile should NOT be blocked
    const isReservedPrefix =
      name === '@media' ||
      name === '@root' ||
      name === '@own' ||
      name.startsWith('@(');

    if (isReservedPrefix) {
      warnOnce(
        `reserved-prefix:${name}`,
        `[Tasty] Cannot define predefined state '${name}'. This prefix is reserved for built-in functionality.`,
      );
      continue;
    }

    // Check for cross-references
    const crossRefs = extractPredefinedStateRefs(value);
    if (crossRefs.length > 0) {
      warnOnce(
        `cross-ref:${name}`,
        `[Tasty] Predefined state '${name}' references another predefined state '${crossRefs[0]}'.\n` +
          `Predefined states cannot reference each other. Use the full definition instead.`,
      );
      continue;
    }

    // Check for duplicates
    if (
      globalPredefinedStates[name] &&
      globalPredefinedStates[name] !== value
    ) {
      warnOnce(
        `duplicate-state:${name}`,
        `[Tasty] Duplicate predefined state '${name}' in configure(). The last definition will be used.`,
      );
    }

    globalPredefinedStates[name] = value;
  }
}

/**
 * Get global predefined states
 */
export function getGlobalPredefinedStates(): Record<string, string> {
  return globalPredefinedStates;
}

/**
 * Clear global predefined states (for testing only)
 */
export function clearGlobalPredefinedStates(): void {
  globalPredefinedStates = {};
  emittedWarnings.clear();
}

/**
 * Regex to match predefined state references in a string
 * Matches @name that is NOT followed by ( or : and is a complete word
 * Uses word boundary and negative lookahead
 */
const PREDEFINED_STATE_PATTERN = /@([A-Za-z][A-Za-z0-9-]*)(?![A-Za-z0-9-:(])/g;

/**
 * Extract predefined state references from a string
 */
export function extractPredefinedStateRefs(value: string): string[] {
  const matches = value.matchAll(PREDEFINED_STATE_PATTERN);
  const refs: string[] = [];

  for (const match of matches) {
    const stateName = '@' + match[1];
    // Skip built-in states (@starting) and duplicates
    // Note: @media, @root, @own are always followed by '(' so the regex
    // negative lookahead (?![A-Za-z0-9-:(]) already excludes them
    if (!BUILTIN_STATES.has(stateName) && !refs.includes(stateName)) {
      refs.push(stateName);
    }
  }

  return refs;
}

/**
 * Check if a state key is a predefined state reference
 */
export function isPredefinedStateRef(stateKey: string): boolean {
  if (!stateKey.startsWith('@')) return false;
  if (BUILTIN_STATES.has(stateKey)) return false;

  // Check if it's NOT a built-in prefix
  for (const prefix of RESERVED_PREFIXES) {
    if (stateKey === prefix || stateKey.startsWith(prefix)) {
      // Check if it's exactly @media, @root, @own, or starts with @( or @media(
      if (
        stateKey === '@media' ||
        stateKey.startsWith('@media(') ||
        stateKey.startsWith('@media:')
      ) {
        return false;
      }
      if (stateKey === '@root' || stateKey.startsWith('@root(')) return false;
      if (stateKey === '@own' || stateKey.startsWith('@own(')) return false;
      if (stateKey.startsWith('@(')) return false;
    }
  }

  // Must match the predefined state pattern
  return /^@[A-Za-z][A-Za-z0-9-]*$/.test(stateKey);
}

/**
 * Extract local predefined states from a styles object
 * Local predefined states are top-level keys starting with @ that have string values
 * and are valid predefined state names (not built-in like @media, @root, etc.)
 */
export function extractLocalPredefinedStates(
  styles: Styles,
): Record<string, string> {
  const localStates: Record<string, string> = {};

  if (!styles || typeof styles !== 'object') {
    return localStates;
  }

  for (const [key, value] of Object.entries(styles)) {
    // Check if it's a predefined state definition (starts with @, has string value)
    if (key.startsWith('@') && typeof value === 'string') {
      // Validate name format - must be @[letter][letters/numbers/dashes]*
      if (!/^@[A-Za-z][A-Za-z0-9-]*$/.test(key)) {
        continue; // Skip invalid names silently (might be something else)
      }

      // Skip built-in states
      if (BUILTIN_STATES.has(key)) {
        continue;
      }

      // Skip reserved prefixes
      if (
        key === '@media' ||
        key === '@root' ||
        key === '@own' ||
        key.startsWith('@(')
      ) {
        continue;
      }

      // Check for cross-references (predefined states cannot reference each other)
      const crossRefs = extractPredefinedStateRefs(value);
      if (crossRefs.length > 0) {
        warnOnce(
          `local-cross-ref:${key}`,
          `[Tasty] Predefined state '${key}' references another predefined state '${crossRefs[0]}'.\n` +
            `Predefined states cannot reference each other. Use the full definition instead.`,
        );
        continue;
      }

      localStates[key] = value;
    }
  }

  return localStates;
}

/**
 * Create a state parser context from styles
 */
export function createStateParserContext(
  styles?: Styles,
  isSubElement?: boolean,
): StateParserContext {
  const localStates = styles ? extractLocalPredefinedStates(styles) : {};

  return {
    localPredefinedStates: localStates,
    globalPredefinedStates: getGlobalPredefinedStates(),
    isSubElement,
  };
}

/**
 * Resolve a predefined state reference to its value
 * Returns the resolved value or null if not found
 */
export function resolvePredefinedState(
  stateKey: string,
  ctx: StateParserContext,
): string | null {
  // Check local first (higher priority)
  if (ctx.localPredefinedStates[stateKey]) {
    return ctx.localPredefinedStates[stateKey];
  }

  // Then check global
  if (ctx.globalPredefinedStates[stateKey]) {
    return ctx.globalPredefinedStates[stateKey];
  }

  // Not found - emit warning
  warnOnce(
    `undefined-state:${stateKey}`,
    `[Tasty] Undefined predefined state '${stateKey}'.\n` +
      `Define it in configure({ states: { '${stateKey}': '...' } }) or in the component's styles.`,
  );

  return null;
}

/**
 * Normalize state key by trimming whitespace and removing trailing/leading operators
 */
export function normalizeStateKey(stateKey: string): {
  key: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  let key = stateKey;

  // Check for whitespace-only
  if (key.trim() === '') {
    if (key !== '') {
      warnings.push(
        `[Tasty] Whitespace-only state key normalized to default state ''.`,
      );
    }
    return { key: '', warnings };
  }

  // Trim whitespace
  key = key.trim();

  // Remove trailing operators
  const trailingOpMatch = key.match(/\s*[&|^]\s*$/);
  if (trailingOpMatch) {
    const originalKey = key;
    key = key.slice(0, -trailingOpMatch[0].length).trim();
    warnings.push(
      `[Tasty] State key '${originalKey}' has trailing operator. Normalized to '${key}'.`,
    );
  }

  // Remove leading operators (except !)
  const leadingOpMatch = key.match(/^\s*[&|^]\s*/);
  if (leadingOpMatch) {
    const originalKey = key;
    key = key.slice(leadingOpMatch[0].length).trim();
    warnings.push(
      `[Tasty] State key '${originalKey}' has leading operator. Normalized to '${key}'.`,
    );
  }

  return { key, warnings };
}

/**
 * Expand dimension shorthands in a condition string
 * w -> width, h -> height, is -> inline-size, bs -> block-size
 */
export function expandDimensionShorthands(condition: string): string {
  // Replace dimension shorthands (only when they appear as standalone words)
  let result = condition;

  // w -> width (but not part of other words)
  result = result.replace(/\bw\b/g, 'width');

  // h -> height
  result = result.replace(/\bh\b/g, 'height');

  // is -> inline-size
  result = result.replace(/\bis\b/g, 'inline-size');

  // bs -> block-size
  result = result.replace(/\bbs\b/g, 'block-size');

  return result;
}

/**
 * Convert tasty units in a string (e.g., 40x -> calc(var(--gap) * 40))
 */
export function expandTastyUnits(value: string): string {
  // Match number followed by 'x' unit (tasty gap unit)
  return value.replace(/(\d+(?:\.\d+)?)\s*x\b/g, (_, num) => {
    return `calc(var(--gap) * ${num})`;
  });
}

/**
 * Parse an advanced state key and return its type and components
 */
export function parseAdvancedState(
  stateKey: string,
  ctx: StateParserContext,
): ParsedAdvancedState {
  const raw = stateKey;

  // Check for @starting (exact match)
  if (stateKey === '@starting') {
    return {
      type: 'starting',
      condition: '',
      raw,
    };
  }

  // Check for @media:type (e.g., @media:print)
  if (stateKey.startsWith('@media:')) {
    const mediaType = stateKey.slice(7); // Remove '@media:'
    if (!['all', 'screen', 'print', 'speech'].includes(mediaType)) {
      warnOnce(
        `unknown-media-type:${mediaType}`,
        `[Tasty] Unknown media type '${mediaType}'. Valid types: all, screen, print, speech.`,
      );
    }
    return {
      type: 'media',
      condition: '',
      mediaType,
      raw,
    };
  }

  // Check for @media(...) - media query with condition
  if (stateKey.startsWith('@media(')) {
    const endParen = findMatchingParen(stateKey, 6);
    if (endParen === -1) {
      warnOnce(
        `unclosed-media:${stateKey}`,
        `[Tasty] Unclosed media query '${stateKey}'. Missing closing parenthesis.`,
      );
      return { type: 'modifier', condition: stateKey, raw };
    }

    let condition = stateKey.slice(7, endParen);

    // Check for empty condition
    if (!condition.trim()) {
      warnOnce(
        `empty-media:${stateKey}`,
        `[Tasty] Empty media query condition '${stateKey}'.`,
      );
      return { type: 'modifier', condition: stateKey, raw };
    }

    // Expand shorthands and units
    condition = expandDimensionShorthands(condition);
    condition = expandTastyUnits(condition);

    return {
      type: 'media',
      condition,
      raw,
    };
  }

  // Check for @root(...) - root state
  if (stateKey.startsWith('@root(')) {
    const endParen = findMatchingParen(stateKey, 5);
    if (endParen === -1) {
      warnOnce(
        `unclosed-root:${stateKey}`,
        `[Tasty] Unclosed root state '${stateKey}'. Missing closing parenthesis.`,
      );
      return { type: 'modifier', condition: stateKey, raw };
    }

    const condition = stateKey.slice(6, endParen);

    if (!condition.trim()) {
      warnOnce(
        `empty-root:${stateKey}`,
        `[Tasty] Empty root state condition '${stateKey}'.`,
      );
      return { type: 'modifier', condition: stateKey, raw };
    }

    return {
      type: 'root',
      condition,
      raw,
    };
  }

  // Check for @own(...) - sub-element own state
  if (stateKey.startsWith('@own(')) {
    const endParen = findMatchingParen(stateKey, 4);
    if (endParen === -1) {
      warnOnce(
        `unclosed-own:${stateKey}`,
        `[Tasty] Unclosed own state '${stateKey}'. Missing closing parenthesis.`,
      );
      return { type: 'modifier', condition: stateKey, raw };
    }

    const condition = stateKey.slice(5, endParen);

    if (!condition.trim()) {
      warnOnce(
        `empty-own:${stateKey}`,
        `[Tasty] Empty own state condition '${stateKey}'.`,
      );
      return { type: 'modifier', condition: stateKey, raw };
    }

    // Check if used outside sub-element context
    if (!ctx.isSubElement) {
      warnOnce(
        `own-outside-subelement:${stateKey}`,
        `[Tasty] @own(${condition}) used outside sub-element context.\n` +
          `@own() is equivalent to '${condition}' at the root level. ` +
          `Did you mean to use it inside a sub-element?`,
      );
      // Treat as regular modifier
      return {
        type: 'modifier',
        condition,
        raw,
      };
    }

    return {
      type: 'own',
      condition,
      raw,
    };
  }

  // Check for @(...) - container query (unnamed or named)
  if (stateKey.startsWith('@(')) {
    const endParen = findMatchingParen(stateKey, 1);
    if (endParen === -1) {
      warnOnce(
        `unclosed-container:${stateKey}`,
        `[Tasty] Unclosed container query '${stateKey}'. Missing closing parenthesis.`,
      );
      return { type: 'modifier', condition: stateKey, raw };
    }

    const content = stateKey.slice(2, endParen);

    if (!content.trim()) {
      warnOnce(
        `empty-container:${stateKey}`,
        `[Tasty] Empty container query '${stateKey}'.`,
      );
      return { type: 'modifier', condition: stateKey, raw };
    }

    // Check if named container (first token is name, followed by comma)
    const commaIndex = content.indexOf(',');
    let containerName: string | undefined;
    let condition: string;

    if (commaIndex !== -1) {
      // Named container: @(layout, w < 600px)
      containerName = content.slice(0, commaIndex).trim();
      condition = content.slice(commaIndex + 1).trim();
    } else {
      // Unnamed container: @(w < 600px)
      condition = content.trim();
    }

    // Check for style query (starts with $)
    if (condition.startsWith('$')) {
      // Style query: @(layout, $compact) or @(layout, $variant=compact)
      const styleCondition = parseStyleQuery(condition);
      if (!styleCondition) {
        warnOnce(
          `invalid-style-query:${stateKey}`,
          `[Tasty] Invalid style query '${condition}' in container query.`,
        );
        return { type: 'modifier', condition: stateKey, raw };
      }
      condition = styleCondition;
    } else {
      // Dimension query - expand shorthands and units
      condition = expandDimensionShorthands(condition);
      condition = expandTastyUnits(condition);
    }

    return {
      type: 'container',
      condition,
      containerName,
      raw,
    };
  }

  // Check for predefined state reference
  if (isPredefinedStateRef(stateKey)) {
    const resolved = resolvePredefinedState(stateKey, ctx);
    if (resolved) {
      // Recursively parse the resolved value to extract the actual state type
      // (e.g., @mobile -> @media(w < 768px) should become a media state)
      const parsedResolved = parseAdvancedState(resolved, ctx);
      return {
        ...parsedResolved,
        raw, // Keep original raw for traceability
      };
    }
    // If not resolved, treat as modifier (will likely produce invalid CSS)
    return {
      type: 'modifier',
      condition: stateKey,
      raw,
    };
  }

  // Regular modifier (boolean mod, pseudo-class, class, attribute)
  return {
    type: 'modifier',
    condition: stateKey,
    raw,
  };
}

/**
 * Parse a style query condition (e.g., $compact, $variant=compact, $variant="very compact")
 */
function parseStyleQuery(condition: string): string | null {
  // Remove $ prefix
  const query = condition.slice(1);

  // Check for comparison operators (not supported)
  if (/[<>]/.test(query)) {
    warnOnce(
      `style-query-comparison:${condition}`,
      `[Tasty] Style queries only support equality. '${condition}' is invalid. Use '${condition.split(/[<>]/)[0]}=...' instead.`,
    );
    return null;
  }

  // Check for equality
  const eqIndex = query.indexOf('=');
  if (eqIndex === -1) {
    // Just existence check: style(--compact)
    return `style(--${query})`;
  }

  const propName = query.slice(0, eqIndex).trim();
  let value = query.slice(eqIndex + 1).trim();

  // Handle quoted values
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    // Keep quotes for CSS
  } else {
    // Add quotes if needed
    value = `"${value}"`;
  }

  // Expand tasty units in value
  value = expandTastyUnits(value);

  return `style(--${propName}: ${value})`;
}

/**
 * Find matching closing parenthesis
 */
function findMatchingParen(str: string, startIndex: number): number {
  let depth = 1;
  let i = startIndex + 1;

  while (i < str.length && depth > 0) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')') depth--;
    i++;
  }

  return depth === 0 ? i - 1 : -1;
}

/**
 * Check if a state key is an advanced state (starts with @)
 */
export function isAdvancedState(stateKey: string): boolean {
  return stateKey.startsWith('@') || stateKey.startsWith('!@');
}

/**
 * Detect the type of advanced state from a raw state key
 */
export function detectAdvancedStateType(
  stateKey: string,
): ParsedAdvancedState['type'] {
  // Handle negation prefix
  const key = stateKey.startsWith('!') ? stateKey.slice(1) : stateKey;

  if (key === '@starting') return 'starting';
  if (key.startsWith('@media')) return 'media';
  if (key.startsWith('@root(')) return 'root';
  if (key.startsWith('@own(')) return 'own';
  if (key.startsWith('@(')) return 'container';
  if (isPredefinedStateRef(key)) return 'predefined';
  return 'modifier';
}
