import type { FormPath } from './values';

type ValidPath<
  Value,
  Path extends readonly (string | number)[],
> = unknown extends Value
  ? true
  : Path extends readonly [
        infer Key extends string | number,
        ...infer Rest extends readonly (string | number)[],
      ]
    ? Key extends keyof NonNullable<Value>
      ? Rest extends readonly []
        ? true
        : ValidPath<NonNullable<Value>[Key], Rest>
      : NonNullable<Value> extends readonly (infer Item)[]
        ? Key extends `${number}`
          ? ValidPath<Item, Rest>
          : false
        : false
    : true;

/** Check only the supplied literal path. Widened strings support dynamic models. */
export type CheckedFormPath<T extends object, Path extends FormPath> = Path &
  (Path extends string
    ? string extends Path
      ? unknown
      : Path extends keyof T
        ? unknown
        : never
    : Path extends readonly (string | number)[]
      ? ValidPath<T, Path> extends false
        ? never
        : unknown
      : never);

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

export type CheckedFormDependencies<
  T extends object,
  Dependencies extends readonly FormPath[],
> = {
  readonly [I in keyof Dependencies]: CheckedFormPath<T, Dependencies[I]>;
};
