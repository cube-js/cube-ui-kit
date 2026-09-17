import type { FormPath } from './values';

/** Resolve only the supplied path; never enumerate a model's possible paths. */
type SegmentValue<Value, Key extends string | number> = Value extends
  | null
  | undefined
  ? undefined
  : Key extends keyof Value
    ? Value[Key]
    : Value extends readonly (infer Item)[]
      ? Key extends `${number}`
        ? Item
        : unknown
      : unknown;

type TupleValue<
  Value,
  Path extends readonly (string | number)[],
> = Path extends readonly [
  infer Key extends string | number,
  ...infer Rest extends readonly (string | number)[],
]
  ? Rest extends readonly []
    ? SegmentValue<Value, Key>
    : TupleValue<SegmentValue<Value, Key>, Rest>
  : unknown;

/** Strings are literal keys; unknown/dynamic names and paths return unknown. */
export type FormValueAtPath<
  Values extends object,
  Path extends FormPath,
> = Path extends string
  ? Path extends keyof Values
    ? Values[Path]
    : unknown
  : Path extends readonly (string | number)[]
    ? TupleValue<Values, Path>
    : unknown;
