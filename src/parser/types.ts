export enum Bucket {
  Color,
  Value,
  Mod,
}

export interface StyleDetails {
  output: string;
  mods: string[];
  values: string[];
  colors: string[];
  all: string[];
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

export const makeEmptyDetails = (): StyleDetails => ({
  output: '',
  mods: [],
  values: [],
  colors: [],
  all: [],
});

export const finalizeGroup = (d: StyleDetails): StyleDetails => {
  // Join processed pieces already stored in `all` with single spaces.
  d.output = d.all.join(' ');
  return d;
};
