/**
 * State Key Parser
 *
 * Parses state notation strings (like 'hovered & !disabled', '@media(w < 768px)')
 * into ConditionNode trees for processing in the pipeline.
 */

import { Lru } from '../parser/lru';
import {
  expandDimensionShorthands,
  expandTastyUnits,
  resolvePredefinedState,
  StateParserContext,
} from '../states';
import { camelToKebab } from '../utils/case-converter';

import {
  and,
  ConditionNode,
  createContainerDimensionCondition,
  createContainerStyleCondition,
  createMediaDimensionCondition,
  createMediaFeatureCondition,
  createMediaTypeCondition,
  createModifierCondition,
  createOwnCondition,
  createPseudoCondition,
  createRootCondition,
  createStartingCondition,
  not,
  NumericBound,
  or,
  trueCondition,
} from './conditions';

// ============================================================================
// Types
// ============================================================================

export interface ParseStateKeyOptions {
  context?: StateParserContext;
  isSubElement?: boolean;
}

// ============================================================================
// Caching
// ============================================================================

// Cache for parsed state keys (key -> ConditionNode)
const parseCache = new Lru<string, ConditionNode>(5000);

// ============================================================================
// Tokenizer Patterns
// ============================================================================

/**
 * Pattern for tokenizing state notation.
 * Matches: operators, parentheses, @-prefixed states, value mods, boolean mods,
 * pseudo-classes, class selectors, and attribute selectors.
 */
const STATE_TOKEN_PATTERN =
  /([&|!^])|([()])|(@media:[a-z]+)|(@media\([^)]+\))|(@root\([^)]+\))|(@own\([^)]+\))|(@\([^)]+\))|(@starting)|(@[A-Za-z][A-Za-z0-9-]*)|([a-z][a-z0-9-]*(?:\^=|\$=|\*=|=)(?:"[^"]*"|'[^']*'|[^\s&|!^()]+))|([a-z][a-z0-9-]+)|(:[a-z][a-z0-9-]*(?:\([^)]+\))?)|(\.[a-z][a-z0-9-]+)|(\[[^\]]+\])/gi;

// ============================================================================
// Token Types
// ============================================================================

type TokenType = 'AND' | 'OR' | 'NOT' | 'XOR' | 'LPAREN' | 'RPAREN' | 'STATE';

interface Token {
  type: TokenType;
  value: string;
  raw: string;
}

// ============================================================================
// Tokenizer
// ============================================================================

/**
 * Tokenize a state notation string
 */
function tokenize(stateKey: string): Token[] {
  const tokens: Token[] = [];
  let match: RegExpExecArray | null;

  // Replace commas with | outside of parentheses (for compatibility)
  const normalized = replaceCommasOutsideParens(stateKey);

  STATE_TOKEN_PATTERN.lastIndex = 0;
  while ((match = STATE_TOKEN_PATTERN.exec(normalized)) !== null) {
    const fullMatch = match[0];

    if (match[1]) {
      // Operator: &, |, !, ^
      switch (fullMatch) {
        case '&':
          tokens.push({ type: 'AND', value: '&', raw: fullMatch });
          break;
        case '|':
          tokens.push({ type: 'OR', value: '|', raw: fullMatch });
          break;
        case '!':
          tokens.push({ type: 'NOT', value: '!', raw: fullMatch });
          break;
        case '^':
          tokens.push({ type: 'XOR', value: '^', raw: fullMatch });
          break;
      }
    } else if (match[2]) {
      // Parenthesis
      if (fullMatch === '(') {
        tokens.push({ type: 'LPAREN', value: '(', raw: fullMatch });
      } else {
        tokens.push({ type: 'RPAREN', value: ')', raw: fullMatch });
      }
    } else {
      // State token (all other capture groups)
      tokens.push({ type: 'STATE', value: fullMatch, raw: fullMatch });
    }
  }

  return tokens;
}

/**
 * Replace commas with | only outside of parentheses
 */
function replaceCommasOutsideParens(str: string): string {
  let result = '';
  let depth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '(') {
      depth++;
      result += char;
    } else if (char === ')') {
      depth--;
      result += char;
    } else if (char === ',' && depth === 0) {
      result += '|';
    } else {
      result += char;
    }
  }

  return result;
}

// ============================================================================
// Recursive Descent Parser
// ============================================================================

/**
 * Parser state
 */
class Parser {
  private tokens: Token[];
  private pos = 0;
  private options: ParseStateKeyOptions;

  constructor(tokens: Token[], options: ParseStateKeyOptions) {
    this.tokens = tokens;
    this.options = options;
  }

  parse(): ConditionNode {
    if (this.tokens.length === 0) {
      return trueCondition();
    }
    const result = this.parseExpression();
    return result;
  }

  private current(): Token | undefined {
    return this.tokens[this.pos];
  }

  private advance(): Token | undefined {
    return this.tokens[this.pos++];
  }

  private match(type: TokenType): boolean {
    if (this.current()?.type === type) {
      this.advance();
      return true;
    }
    return false;
  }

  /**
   * Parse expression with operator precedence:
   * ! (NOT) > ^ (XOR) > | (OR) > & (AND)
   */
  private parseExpression(): ConditionNode {
    return this.parseAnd();
  }

  private parseAnd(): ConditionNode {
    let left = this.parseOr();

    while (this.current()?.type === 'AND') {
      this.advance();
      const right = this.parseOr();
      left = and(left, right);
    }

    return left;
  }

  private parseOr(): ConditionNode {
    let left = this.parseXor();

    while (this.current()?.type === 'OR') {
      this.advance();
      const right = this.parseXor();
      left = or(left, right);
    }

    return left;
  }

  private parseXor(): ConditionNode {
    let left = this.parseUnary();

    while (this.current()?.type === 'XOR') {
      this.advance();
      const right = this.parseUnary();
      // XOR: (A & !B) | (!A & B)
      left = or(and(left, not(right)), and(not(left), right));
    }

    return left;
  }

  private parseUnary(): ConditionNode {
    if (this.match('NOT')) {
      const operand = this.parseUnary();
      return not(operand);
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ConditionNode {
    // Handle parentheses
    if (this.match('LPAREN')) {
      const expr = this.parseExpression();
      this.match('RPAREN'); // Consume closing paren (lenient if missing)
      return expr;
    }

    // Handle state tokens
    const token = this.current();
    if (token?.type === 'STATE') {
      this.advance();
      return this.parseStateToken(token.value);
    }

    // Fallback for empty/invalid - return TRUE
    return trueCondition();
  }

  /**
   * Parse a state token into a ConditionNode
   */
  private parseStateToken(value: string): ConditionNode {
    // @starting
    if (value === '@starting') {
      return createStartingCondition(false, value);
    }

    // @media:type (e.g., @media:print)
    if (value.startsWith('@media:')) {
      const mediaType = value.slice(7) as 'print' | 'screen' | 'all' | 'speech';
      return createMediaTypeCondition(mediaType, false, value);
    }

    // @media(...) - media query
    if (value.startsWith('@media(')) {
      return this.parseMediaQuery(value);
    }

    // @root(...) - root state
    if (value.startsWith('@root(')) {
      return this.parseRootState(value);
    }

    // @own(...) - own state (sub-element)
    if (value.startsWith('@own(')) {
      return this.parseOwnState(value);
    }

    // @(...) - container query
    if (value.startsWith('@(')) {
      return this.parseContainerQuery(value);
    }

    // @name - predefined state
    if (value.startsWith('@') && /^@[A-Za-z][A-Za-z0-9-]*$/.test(value)) {
      return this.parsePredefinedState(value);
    }

    // Pseudo-class (e.g., :hover, :focus-visible, :nth-child(2n))
    if (value.startsWith(':')) {
      return createPseudoCondition(value, false, value);
    }

    // Class selector (e.g., .active)
    if (value.startsWith('.')) {
      return createPseudoCondition(value, false, value);
    }

    // Attribute selector (e.g., [disabled], [data-state="active"])
    if (value.startsWith('[')) {
      return createPseudoCondition(value, false, value);
    }

    // Value modifier (e.g., theme=danger, size=large)
    if (value.includes('=')) {
      return this.parseValueModifier(value);
    }

    // Boolean modifier (e.g., hovered, disabled)
    return this.parseBooleanModifier(value);
  }

  /**
   * Parse @media(...) query
   */
  private parseMediaQuery(raw: string): ConditionNode {
    const content = raw.slice(7, -1); // Remove '@media(' and ')'
    if (!content.trim()) {
      return trueCondition();
    }

    // Expand shorthands and units
    let condition = expandDimensionShorthands(content);
    condition = expandTastyUnits(condition);

    // Check for feature queries (contains ':' but not dimension comparison)
    if (
      condition.includes(':') &&
      !condition.includes('<') &&
      !condition.includes('>') &&
      !condition.includes('=')
    ) {
      // Feature query: @media(prefers-contrast: high)
      const colonIdx = condition.indexOf(':');
      const feature = condition.slice(0, colonIdx).trim();
      const featureValue = condition.slice(colonIdx + 1).trim();
      return createMediaFeatureCondition(feature, featureValue, false, raw);
    }

    // Boolean feature query: @media(prefers-reduced-motion)
    if (
      !condition.includes('<') &&
      !condition.includes('>') &&
      !condition.includes('=')
    ) {
      return createMediaFeatureCondition(
        condition.trim(),
        undefined,
        false,
        raw,
      );
    }

    // Dimension query - parse bounds
    const { dimension, lowerBound, upperBound } =
      this.parseDimensionCondition(condition);

    if (!dimension) {
      // Fallback for unparseable - treat as pseudo
      return createPseudoCondition(raw, false, raw);
    }

    return createMediaDimensionCondition(
      dimension as 'width' | 'height',
      lowerBound,
      upperBound,
      false,
      raw,
    );
  }

  /**
   * Parse dimension condition string (e.g., "width < 768px", "600px <= width < 1200px")
   */
  private parseDimensionCondition(condition: string): {
    dimension?: string;
    lowerBound?: NumericBound;
    upperBound?: NumericBound;
  } {
    // Range syntax: "600px <= width < 1200px"
    const rangeMatch = condition.match(
      /^(.+?)\s*(<=|<)\s*(width|height|inline-size|block-size)\s*(<=|<)\s*(.+)$/,
    );
    if (rangeMatch) {
      const [, lowerValue, lowerOp, dimension, upperOp, upperValue] =
        rangeMatch;
      return {
        dimension,
        lowerBound: {
          value: lowerValue.trim(),
          valueNumeric: parseNumericValue(lowerValue.trim()),
          inclusive: lowerOp === '<=',
        },
        upperBound: {
          value: upperValue.trim(),
          valueNumeric: parseNumericValue(upperValue.trim()),
          inclusive: upperOp === '<=',
        },
      };
    }

    // Simple comparison: "width < 768px"
    const simpleMatch = condition.match(
      /^(width|height|inline-size|block-size)\s*(<=|>=|<|>|=)\s*(.+)$/,
    );
    if (simpleMatch) {
      const [, dimension, operator, value] = simpleMatch;
      const numeric = parseNumericValue(value.trim());

      if (operator === '<' || operator === '<=') {
        return {
          dimension,
          upperBound: {
            value: value.trim(),
            valueNumeric: numeric,
            inclusive: operator === '<=',
          },
        };
      } else if (operator === '>' || operator === '>=') {
        return {
          dimension,
          lowerBound: {
            value: value.trim(),
            valueNumeric: numeric,
            inclusive: operator === '>=',
          },
        };
      } else if (operator === '=') {
        // Exact match: both bounds are the same and inclusive
        return {
          dimension,
          lowerBound: {
            value: value.trim(),
            valueNumeric: numeric,
            inclusive: true,
          },
          upperBound: {
            value: value.trim(),
            valueNumeric: numeric,
            inclusive: true,
          },
        };
      }
    }

    // Reversed: "768px > width"
    const reversedMatch = condition.match(
      /^(.+?)\s*(<=|>=|<|>|=)\s*(width|height|inline-size|block-size)$/,
    );
    if (reversedMatch) {
      const [, value, operator, dimension] = reversedMatch;
      const numeric = parseNumericValue(value.trim());

      // Reverse the operator
      if (operator === '<' || operator === '<=') {
        return {
          dimension,
          lowerBound: {
            value: value.trim(),
            valueNumeric: numeric,
            inclusive: operator === '<=',
          },
        };
      } else if (operator === '>' || operator === '>=') {
        return {
          dimension,
          upperBound: {
            value: value.trim(),
            valueNumeric: numeric,
            inclusive: operator === '>=',
          },
        };
      }
    }

    return {};
  }

  /**
   * Parse @root(...) state
   */
  private parseRootState(raw: string): ConditionNode {
    const content = raw.slice(6, -1); // Remove '@root(' and ')'
    if (!content.trim()) {
      return trueCondition();
    }

    // Build selector from condition
    const selector = buildRootSelector(content);
    return createRootCondition(selector, false, raw);
  }

  /**
   * Parse @own(...) state
   */
  private parseOwnState(raw: string): ConditionNode {
    const content = raw.slice(5, -1); // Remove '@own(' and ')'
    if (!content.trim()) {
      return trueCondition();
    }

    // Parse the inner condition recursively
    const innerCondition = parseStateKey(content, this.options);
    return createOwnCondition(innerCondition, false, raw);
  }

  /**
   * Parse @(...) container query
   */
  private parseContainerQuery(raw: string): ConditionNode {
    const content = raw.slice(2, -1); // Remove '@(' and ')'
    if (!content.trim()) {
      return trueCondition();
    }

    // Check for named container: @(layout, w < 600px)
    const commaIdx = content.indexOf(',');
    let containerName: string | undefined;
    let condition: string;

    if (commaIdx !== -1) {
      containerName = content.slice(0, commaIdx).trim();
      condition = content.slice(commaIdx + 1).trim();
    } else {
      condition = content.trim();
    }

    // Check for style query: @($variant=primary)
    if (condition.startsWith('$')) {
      const styleQuery = condition.slice(1); // Remove '$'
      const eqIdx = styleQuery.indexOf('=');

      if (eqIdx === -1) {
        // Existence check: @($variant)
        return createContainerStyleCondition(
          styleQuery,
          undefined,
          containerName,
          false,
          raw,
        );
      }

      const property = styleQuery.slice(0, eqIdx).trim();
      let propertyValue = styleQuery.slice(eqIdx + 1).trim();

      // Remove quotes if present
      if (
        (propertyValue.startsWith('"') && propertyValue.endsWith('"')) ||
        (propertyValue.startsWith("'") && propertyValue.endsWith("'"))
      ) {
        propertyValue = propertyValue.slice(1, -1);
      }

      return createContainerStyleCondition(
        property,
        propertyValue,
        containerName,
        false,
        raw,
      );
    }

    // Dimension query
    let expandedCondition = expandDimensionShorthands(condition);
    expandedCondition = expandTastyUnits(expandedCondition);

    const { dimension, lowerBound, upperBound } =
      this.parseDimensionCondition(expandedCondition);

    if (!dimension) {
      // Fallback
      return createPseudoCondition(raw, false, raw);
    }

    return createContainerDimensionCondition(
      dimension as 'width' | 'height',
      lowerBound,
      upperBound,
      containerName,
      false,
      raw,
    );
  }

  /**
   * Parse predefined state (@mobile, @dark, etc.)
   */
  private parsePredefinedState(raw: string): ConditionNode {
    const ctx = this.options.context;
    if (!ctx) {
      // No context - can't resolve predefined states
      return createPseudoCondition(raw, false, raw);
    }

    const resolved = resolvePredefinedState(raw, ctx);
    if (!resolved) {
      // Undefined predefined state - treat as modifier
      return createModifierCondition(
        `data-${camelToKebab(raw.slice(1))}`,
        undefined,
        '=',
        false,
        raw,
      );
    }

    // Parse the resolved value recursively
    return parseStateKey(resolved, this.options);
  }

  /**
   * Parse value modifier (e.g., theme=danger, size^=sm)
   */
  private parseValueModifier(raw: string): ConditionNode {
    // Match operators: =, ^=, $=, *=
    const opMatch = raw.match(/^([a-z][a-z0-9-]*)(\^=|\$=|\*=|=)(.+)$/i);
    if (!opMatch) {
      return createModifierCondition(
        `data-${camelToKebab(raw)}`,
        undefined,
        '=',
        false,
        raw,
      );
    }

    const [, key, operator, value] = opMatch;
    let cleanValue = value;

    // Remove quotes if present
    if (
      (cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
      (cleanValue.startsWith("'") && cleanValue.endsWith("'"))
    ) {
      cleanValue = cleanValue.slice(1, -1);
    }

    return createModifierCondition(
      `data-${camelToKebab(key)}`,
      cleanValue,
      operator as '=' | '^=' | '$=' | '*=',
      false,
      raw,
    );
  }

  /**
   * Parse boolean modifier (e.g., hovered, disabled)
   */
  private parseBooleanModifier(raw: string): ConditionNode {
    return createModifierCondition(
      `data-${camelToKebab(raw)}`,
      undefined,
      '=',
      false,
      raw,
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse a numeric value from a CSS value string
 */
function parseNumericValue(value: string): number | null {
  const match = value.match(/^(\d+(?:\.\d+)?)(px|em|rem|vh|vw|%)?$/);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
}

/**
 * Build a root state selector from a condition string
 */
function buildRootSelector(condition: string): string {
  // Handle class selector: .className
  if (condition.startsWith('.')) {
    return condition;
  }

  // Handle attribute selector: [attr]
  if (condition.startsWith('[')) {
    return condition;
  }

  // Handle value mod: theme=dark
  if (condition.includes('=')) {
    const [key, value] = condition.split('=');
    return `[data-${camelToKebab(key.trim())}="${value.trim()}"]`;
  }

  // Boolean mod: camelCase -> [data-camel-case]
  return `[data-${camelToKebab(condition)}]`;
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Parse a state key string into a ConditionNode
 */
export function parseStateKey(
  stateKey: string,
  options: ParseStateKeyOptions = {},
): ConditionNode {
  // Handle empty/default state
  if (!stateKey || !stateKey.trim()) {
    return trueCondition();
  }

  const trimmed = stateKey.trim();

  // Check cache
  const cacheKey = JSON.stringify([trimmed, options.isSubElement]);
  const cached = parseCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Tokenize and parse
  const tokens = tokenize(trimmed);
  const parser = new Parser(tokens, options);
  const result = parser.parse();

  // Cache result
  parseCache.set(cacheKey, result);

  return result;
}

/**
 * Clear the parse cache (for testing)
 */
export function clearParseCache(): void {
  parseCache.clear();
}
