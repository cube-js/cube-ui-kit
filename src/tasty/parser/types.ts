export enum Bucket {
  Color,
  Value,
  Mod,
}

/**
 * A part within a group, representing a slash-separated segment.
 * For example, in `'2px solid #red / 4px'`, there are two parts:
 * - Part 0: `2px solid #red`
 * - Part 1: `4px`
 */
export interface StyleDetailsPart {
  mods: string[];
  values: string[];
  colors: string[];
  all: string[];
  output: string;
}

/**
 * A group of style details, representing a comma-separated segment.
 * Contains aggregated values from all parts for backward compatibility,
 * plus the structured `parts` array for handlers that need slash separation.
 */
export interface StyleDetails {
  input: string;
  output: string;
  /** Aggregated mods from all parts (backward compatible) */
  mods: string[];
  /** Aggregated values from all parts (backward compatible) */
  values: string[];
  /** Aggregated colors from all parts (backward compatible) */
  colors: string[];
  /** Aggregated all tokens from all parts (backward compatible) */
  all: string[];
  /** Slash-separated parts within this group */
  parts: StyleDetailsPart[];
}

export interface ProcessedStyle {
  output: string;
  groups: StyleDetails[];
}

export type UnitHandler = (scalar: number) => string;

export interface ParserOptions {
  funcs?: Record<string, (parsed: StyleDetails[]) => string>;
  units?: Record<string, string | UnitHandler>;
  cacheSize?: number;
}

export const makeEmptyPart = (): StyleDetailsPart => ({
  mods: [],
  values: [],
  colors: [],
  all: [],
  output: '',
});

export const makeEmptyDetails = (): StyleDetails => ({
  input: '',
  output: '',
  mods: [],
  values: [],
  colors: [],
  all: [],
  parts: [],
});

export const finalizePart = (p: StyleDetailsPart): StyleDetailsPart => {
  p.output = p.all.join(' ');
  return p;
};

/**
 * Aggregate parts into a StyleDetails group.
 * Combines all parts' arrays into group-level arrays for backward compatibility.
 */
export const finalizeGroup = (
  d: StyleDetails,
  parts: StyleDetailsPart[],
): StyleDetails => {
  // Store parts
  d.parts = parts;

  // Aggregate all parts into group-level arrays
  for (const part of parts) {
    d.mods.push(...part.mods);
    d.values.push(...part.values);
    d.colors.push(...part.colors);
    d.all.push(...part.all);
  }

  // Join parts' outputs with ' / ' for the group output
  d.output = parts.map((p) => p.output).join(' / ');

  return d;
};
