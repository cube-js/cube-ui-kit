/**
 * ConditionNode Types and Helpers
 *
 * Core data structures for representing style conditions as an abstract syntax tree.
 * Used throughout the pipeline for parsing, simplification, and CSS generation.
 */

// ============================================================================
// Core ConditionNode Types
// ============================================================================

/**
 * Base interface for all state conditions (leaf nodes)
 */
interface BaseStateCondition {
  kind: 'state';
  negated: boolean;
  raw: string; // Original string for debugging/caching
  uniqueId: string; // Normalized ID for comparison (built from props)
}

/**
 * Modifier condition: [data-attr] or [data-attr="value"]
 */
export interface ModifierCondition extends BaseStateCondition {
  type: 'modifier';
  attribute: string; // e.g., 'data-theme', 'data-size'
  value?: string; // e.g., 'danger', 'large' (undefined = boolean attr)
  operator?: '=' | '^=' | '$=' | '*='; // Attribute match operator
}

/**
 * Pseudo-class condition: :hover, :focus-visible
 */
export interface PseudoCondition extends BaseStateCondition {
  type: 'pseudo';
  pseudo: string; // e.g., ':hover', ':focus-visible', ':nth-child(2n)'
}

/**
 * Numeric bound for dimension queries
 */
export interface NumericBound {
  value: string; // e.g., '768px', 'calc(var(--gap) * 40)'
  valueNumeric: number | null; // Parsed numeric value for comparison
  inclusive: boolean; // true for >=/<= , false for >/<
}

/**
 * Media query condition
 */
export interface MediaCondition extends BaseStateCondition {
  type: 'media';
  subtype: 'dimension' | 'feature' | 'type';

  // For dimension queries: @media(w < 768px), @media(600px <= w < 1200px)
  dimension?: 'width' | 'height' | 'inline-size' | 'block-size';
  lowerBound?: NumericBound; // >= or >
  upperBound?: NumericBound; // <= or <

  // For feature queries: @media(prefers-contrast: high)
  feature?: string; // e.g., 'prefers-contrast', 'prefers-color-scheme'
  featureValue?: string; // e.g., 'high', 'dark' (undefined = boolean feature)

  // For type queries: @media:print
  mediaType?: 'print' | 'screen' | 'all' | 'speech';
}

/**
 * Container query condition
 */
export interface ContainerCondition extends BaseStateCondition {
  type: 'container';
  subtype: 'dimension' | 'style';
  containerName?: string; // e.g., 'layout', 'sidebar' (undefined = nearest)

  // For dimension queries: @(w < 600px), @(layout, w < 600px)
  dimension?: 'width' | 'height' | 'inline-size' | 'block-size';
  lowerBound?: NumericBound;
  upperBound?: NumericBound;

  // For style queries: @(layout, $variant=danger), @($theme)
  property?: string; // CSS custom property name (without --)
  propertyValue?: string; // e.g., 'danger' (undefined = existence check)
}

/**
 * Root state condition: @root(theme=dark)
 */
export interface RootCondition extends BaseStateCondition {
  type: 'root';
  selector: string; // e.g., '[data-theme="dark"]'
}

/**
 * Own state condition: @own(hovered)
 */
export interface OwnCondition extends BaseStateCondition {
  type: 'own';
  innerCondition: ConditionNode; // The parsed inner condition
}

/**
 * Starting style condition: @starting
 */
export interface StartingCondition extends BaseStateCondition {
  type: 'starting';
}

/**
 * Supports query condition: @supports(display: grid), @supports($, :has(*))
 */
export interface SupportsCondition extends BaseStateCondition {
  type: 'supports';
  subtype: 'feature' | 'selector';
  // The raw condition string (e.g., "display: grid" or ":has(*)")
  condition: string;
}

/**
 * Union of all state condition types
 */
export type StateCondition =
  | ModifierCondition
  | PseudoCondition
  | MediaCondition
  | ContainerCondition
  | RootCondition
  | OwnCondition
  | StartingCondition
  | SupportsCondition;

/**
 * Compound node: combines conditions with AND/OR
 */
export interface CompoundCondition {
  kind: 'compound';
  operator: 'AND' | 'OR';
  children: ConditionNode[];
}

/**
 * True condition (matches everything)
 */
export interface TrueCondition {
  kind: 'true';
}

/**
 * False condition (matches nothing - skip this rule)
 */
export interface FalseCondition {
  kind: 'false';
}

/**
 * Union of all condition node types
 */
export type ConditionNode =
  | StateCondition
  | CompoundCondition
  | TrueCondition
  | FalseCondition;

// ============================================================================
// Constructor Functions
// ============================================================================

/**
 * Create a TRUE condition (matches everything)
 */
export function trueCondition(): TrueCondition {
  return { kind: 'true' };
}

/**
 * Create a FALSE condition (matches nothing)
 */
export function falseCondition(): FalseCondition {
  return { kind: 'false' };
}

/**
 * Create an AND compound condition
 */
export function and(...children: ConditionNode[]): ConditionNode {
  const filtered: ConditionNode[] = [];

  for (const child of children) {
    // Short-circuit on FALSE
    if (child.kind === 'false') {
      return falseCondition();
    }
    // Skip TRUE (identity for AND)
    if (child.kind === 'true') {
      continue;
    }
    // Flatten nested ANDs
    if (child.kind === 'compound' && child.operator === 'AND') {
      filtered.push(...child.children);
    } else {
      filtered.push(child);
    }
  }

  if (filtered.length === 0) {
    return trueCondition();
  }
  if (filtered.length === 1) {
    return filtered[0];
  }

  return {
    kind: 'compound',
    operator: 'AND',
    children: filtered,
  };
}

/**
 * Create an OR compound condition
 */
export function or(...children: ConditionNode[]): ConditionNode {
  const filtered: ConditionNode[] = [];

  for (const child of children) {
    // Short-circuit on TRUE
    if (child.kind === 'true') {
      return trueCondition();
    }
    // Skip FALSE (identity for OR)
    if (child.kind === 'false') {
      continue;
    }
    // Flatten nested ORs
    if (child.kind === 'compound' && child.operator === 'OR') {
      filtered.push(...child.children);
    } else {
      filtered.push(child);
    }
  }

  if (filtered.length === 0) {
    return falseCondition();
  }
  if (filtered.length === 1) {
    return filtered[0];
  }

  return {
    kind: 'compound',
    operator: 'OR',
    children: filtered,
  };
}

/**
 * Negate a condition
 */
export function not(node: ConditionNode): ConditionNode {
  // NOT(TRUE) = FALSE
  if (node.kind === 'true') {
    return falseCondition();
  }

  // NOT(FALSE) = TRUE
  if (node.kind === 'false') {
    return trueCondition();
  }

  // NOT(state) = toggle negated flag
  if (node.kind === 'state') {
    return {
      ...node,
      negated: !node.negated,
      uniqueId: node.negated
        ? node.uniqueId.replace(/^!/, '')
        : `!${node.uniqueId}`,
    };
  }

  // NOT(AND(a, b, ...)) = OR(NOT(a), NOT(b), ...) - De Morgan's law
  if (node.kind === 'compound' && node.operator === 'AND') {
    return or(...node.children.map((c) => not(c)));
  }

  // NOT(OR(a, b, ...)) = AND(NOT(a), NOT(b), ...) - De Morgan's law
  if (node.kind === 'compound' && node.operator === 'OR') {
    return and(...node.children.map((c) => not(c)));
  }

  // Fallback - should not reach here
  return node;
}

// ============================================================================
// Condition Type Checking
// ============================================================================

/**
 * Check if a condition is a state condition
 */
export function isStateCondition(node: ConditionNode): node is StateCondition {
  return node.kind === 'state';
}

/**
 * Check if a condition is a compound condition
 */
export function isCompoundCondition(
  node: ConditionNode,
): node is CompoundCondition {
  return node.kind === 'compound';
}

/**
 * Check if a condition is TRUE
 */
export function isTrueCondition(node: ConditionNode): node is TrueCondition {
  return node.kind === 'true';
}

/**
 * Check if a condition is FALSE
 */
export function isFalseCondition(node: ConditionNode): node is FalseCondition {
  return node.kind === 'false';
}

// ============================================================================
// UniqueId Generation
// ============================================================================

/**
 * Generate a normalized unique ID for a modifier condition
 */
export function modifierUniqueId(
  attribute: string,
  value?: string,
  operator: string = '=',
  negated: boolean = false,
): string {
  const base = value
    ? `mod:${attribute}${operator}${value}`
    : `mod:${attribute}`;
  return negated ? `!${base}` : base;
}

/**
 * Generate a normalized unique ID for a pseudo condition
 */
export function pseudoUniqueId(
  pseudo: string,
  negated: boolean = false,
): string {
  const base = `pseudo:${pseudo}`;
  return negated ? `!${base}` : base;
}

/**
 * Generate a normalized unique ID for a media condition
 */
export function mediaUniqueId(
  subtype: 'dimension' | 'feature' | 'type',
  props: {
    dimension?: string;
    lowerBound?: NumericBound;
    upperBound?: NumericBound;
    feature?: string;
    featureValue?: string;
    mediaType?: string;
  },
  negated: boolean = false,
): string {
  let base: string;

  if (subtype === 'dimension') {
    const parts = ['media', 'dim', props.dimension];
    if (props.lowerBound) {
      parts.push(props.lowerBound.inclusive ? '>=' : '>');
      parts.push(props.lowerBound.value);
    }
    if (props.upperBound) {
      parts.push(props.upperBound.inclusive ? '<=' : '<');
      parts.push(props.upperBound.value);
    }
    base = parts.join(':');
  } else if (subtype === 'feature') {
    base = props.featureValue
      ? `media:feat:${props.feature}:${props.featureValue}`
      : `media:feat:${props.feature}`;
  } else {
    base = `media:type:${props.mediaType}`;
  }

  return negated ? `!${base}` : base;
}

/**
 * Generate a normalized unique ID for a container condition
 */
export function containerUniqueId(
  subtype: 'dimension' | 'style',
  props: {
    containerName?: string;
    dimension?: string;
    lowerBound?: NumericBound;
    upperBound?: NumericBound;
    property?: string;
    propertyValue?: string;
  },
  negated: boolean = false,
): string {
  let base: string;
  const name = props.containerName || '_';

  if (subtype === 'dimension') {
    const parts = ['container', 'dim', name, props.dimension];
    if (props.lowerBound) {
      parts.push(props.lowerBound.inclusive ? '>=' : '>');
      parts.push(props.lowerBound.value);
    }
    if (props.upperBound) {
      parts.push(props.upperBound.inclusive ? '<=' : '<');
      parts.push(props.upperBound.value);
    }
    base = parts.join(':');
  } else {
    base = props.propertyValue
      ? `container:style:${name}:--${props.property}:${props.propertyValue}`
      : `container:style:${name}:--${props.property}`;
  }

  return negated ? `!${base}` : base;
}

/**
 * Generate a normalized unique ID for a root condition
 */
export function rootUniqueId(
  selector: string,
  negated: boolean = false,
): string {
  const base = `root:${selector}`;
  return negated ? `!${base}` : base;
}

/**
 * Generate a normalized unique ID for an own condition
 */
export function ownUniqueId(
  innerUniqueId: string,
  negated: boolean = false,
): string {
  const base = `own:${innerUniqueId}`;
  return negated ? `!${base}` : base;
}

/**
 * Generate a normalized unique ID for a starting condition
 */
export function startingUniqueId(negated: boolean = false): string {
  return negated ? '!starting' : 'starting';
}

/**
 * Generate a normalized unique ID for a supports condition
 */
export function supportsUniqueId(
  subtype: 'feature' | 'selector',
  condition: string,
  negated: boolean = false,
): string {
  const base = `supports:${subtype}:${condition}`;
  return negated ? `!${base}` : base;
}

// ============================================================================
// Condition Creation Helpers
// ============================================================================

/**
 * Create a modifier condition
 */
export function createModifierCondition(
  attribute: string,
  value?: string,
  operator: '=' | '^=' | '$=' | '*=' = '=',
  negated: boolean = false,
  raw?: string,
): ModifierCondition {
  return {
    kind: 'state',
    type: 'modifier',
    negated,
    raw: raw || (value ? `${attribute}${operator}${value}` : attribute),
    uniqueId: modifierUniqueId(attribute, value, operator, negated),
    attribute,
    value,
    operator: value ? operator : undefined,
  };
}

/**
 * Create a pseudo condition
 */
export function createPseudoCondition(
  pseudo: string,
  negated: boolean = false,
  raw?: string,
): PseudoCondition {
  return {
    kind: 'state',
    type: 'pseudo',
    negated,
    raw: raw || pseudo,
    uniqueId: pseudoUniqueId(pseudo, negated),
    pseudo,
  };
}

/**
 * Create a media dimension condition
 */
export function createMediaDimensionCondition(
  dimension: 'width' | 'height' | 'inline-size' | 'block-size',
  lowerBound?: NumericBound,
  upperBound?: NumericBound,
  negated: boolean = false,
  raw?: string,
): MediaCondition {
  return {
    kind: 'state',
    type: 'media',
    subtype: 'dimension',
    negated,
    raw: raw || `@media(${dimension})`,
    uniqueId: mediaUniqueId(
      'dimension',
      { dimension, lowerBound, upperBound },
      negated,
    ),
    dimension,
    lowerBound,
    upperBound,
  };
}

/**
 * Create a media feature condition
 */
export function createMediaFeatureCondition(
  feature: string,
  featureValue?: string,
  negated: boolean = false,
  raw?: string,
): MediaCondition {
  return {
    kind: 'state',
    type: 'media',
    subtype: 'feature',
    negated,
    raw: raw || `@media(${feature}${featureValue ? `: ${featureValue}` : ''})`,
    uniqueId: mediaUniqueId('feature', { feature, featureValue }, negated),
    feature,
    featureValue,
  };
}

/**
 * Create a media type condition
 */
export function createMediaTypeCondition(
  mediaType: 'print' | 'screen' | 'all' | 'speech',
  negated: boolean = false,
  raw?: string,
): MediaCondition {
  return {
    kind: 'state',
    type: 'media',
    subtype: 'type',
    negated,
    raw: raw || `@media:${mediaType}`,
    uniqueId: mediaUniqueId('type', { mediaType }, negated),
    mediaType,
  };
}

/**
 * Create a container dimension condition
 */
export function createContainerDimensionCondition(
  dimension: 'width' | 'height' | 'inline-size' | 'block-size',
  lowerBound?: NumericBound,
  upperBound?: NumericBound,
  containerName?: string,
  negated: boolean = false,
  raw?: string,
): ContainerCondition {
  return {
    kind: 'state',
    type: 'container',
    subtype: 'dimension',
    negated,
    raw: raw || `@(${containerName ? containerName + ', ' : ''}${dimension})`,
    uniqueId: containerUniqueId(
      'dimension',
      { containerName, dimension, lowerBound, upperBound },
      negated,
    ),
    containerName,
    dimension,
    lowerBound,
    upperBound,
  };
}

/**
 * Create a container style condition
 */
export function createContainerStyleCondition(
  property: string,
  propertyValue?: string,
  containerName?: string,
  negated: boolean = false,
  raw?: string,
): ContainerCondition {
  return {
    kind: 'state',
    type: 'container',
    subtype: 'style',
    negated,
    raw:
      raw ||
      `@(${containerName ? containerName + ', ' : ''}$${property}${propertyValue ? '=' + propertyValue : ''})`,
    uniqueId: containerUniqueId(
      'style',
      { containerName, property, propertyValue },
      negated,
    ),
    containerName,
    property,
    propertyValue,
  };
}

/**
 * Create a root condition
 */
export function createRootCondition(
  selector: string,
  negated: boolean = false,
  raw?: string,
): RootCondition {
  return {
    kind: 'state',
    type: 'root',
    negated,
    raw: raw || `@root(${selector})`,
    uniqueId: rootUniqueId(selector, negated),
    selector,
  };
}

/**
 * Create an own condition
 */
export function createOwnCondition(
  innerCondition: ConditionNode,
  negated: boolean = false,
  raw?: string,
): OwnCondition {
  const innerUniqueId = getConditionUniqueId(innerCondition);
  return {
    kind: 'state',
    type: 'own',
    negated,
    raw: raw || `@own(...)`,
    uniqueId: ownUniqueId(innerUniqueId, negated),
    innerCondition,
  };
}

/**
 * Create a starting condition
 */
export function createStartingCondition(
  negated: boolean = false,
  raw?: string,
): StartingCondition {
  return {
    kind: 'state',
    type: 'starting',
    negated,
    raw: raw || '@starting',
    uniqueId: startingUniqueId(negated),
  };
}

/**
 * Create a supports condition
 *
 * @param subtype 'feature' for @supports(display: grid), 'selector' for @supports($, :has(*))
 * @param condition The condition string (e.g., "display: grid" or ":has(*)")
 */
export function createSupportsCondition(
  subtype: 'feature' | 'selector',
  condition: string,
  negated: boolean = false,
  raw?: string,
): SupportsCondition {
  return {
    kind: 'state',
    type: 'supports',
    subtype,
    negated,
    raw: raw || `@supports(${condition})`,
    uniqueId: supportsUniqueId(subtype, condition, negated),
    condition,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the unique ID for any condition node
 */
export function getConditionUniqueId(node: ConditionNode): string {
  if (node.kind === 'true') {
    return 'TRUE';
  }
  if (node.kind === 'false') {
    return 'FALSE';
  }
  if (node.kind === 'state') {
    return node.uniqueId;
  }
  if (node.kind === 'compound') {
    const childIds = node.children.map(getConditionUniqueId).sort();
    return `${node.operator}(${childIds.join(',')})`;
  }
  return 'UNKNOWN';
}

/**
 * Check if two conditions are equal based on their unique IDs
 */
export function conditionsEqual(a: ConditionNode, b: ConditionNode): boolean {
  return getConditionUniqueId(a) === getConditionUniqueId(b);
}

/**
 * Get all state conditions from a condition tree (flattened)
 */
export function getAllStateConditions(node: ConditionNode): StateCondition[] {
  if (node.kind === 'true' || node.kind === 'false') {
    return [];
  }
  if (node.kind === 'state') {
    return [node];
  }
  if (node.kind === 'compound') {
    const result: StateCondition[] = [];
    for (const child of node.children) {
      result.push(...getAllStateConditions(child));
    }
    return result;
  }
  return [];
}

/**
 * Clone a condition node (deep copy)
 */
export function cloneCondition(node: ConditionNode): ConditionNode {
  if (node.kind === 'true' || node.kind === 'false') {
    return { ...node };
  }
  if (node.kind === 'state') {
    if (node.type === 'own') {
      return {
        ...node,
        innerCondition: cloneCondition(node.innerCondition),
      };
    }
    return { ...node };
  }
  if (node.kind === 'compound') {
    return {
      ...node,
      children: node.children.map(cloneCondition),
    };
  }
  return node;
}
