import { applyRule } from '../validation';

import type { FormValues } from './read-types';
import type { FormPath } from './values';

export interface ModernValidationContext<
  T extends object = Record<string, unknown>,
> {
  readonly name: string;
  readonly signal: AbortSignal;
  getValue(path: FormPath): unknown;
  getValues(): FormValues<T>;
}

/** Library-neutral: return an error, or throw/reject; undefined/null means success. */
export interface ModernValidationRule<ErrorValue = unknown> {
  required?: boolean;
  min?: number;
  max?: number;
  len?: number;
  pattern?: RegExp;
  type?: string;
  enum?: readonly unknown[];
  whitespace?: boolean;
  transform?: (value: any) => unknown;
  message?: ErrorValue;
  validator?: (
    rule: ModernValidationRule<ErrorValue>,
    value: any,
    context: ModernValidationContext<any>,
  ) => ErrorValue | void | Promise<ErrorValue | void>;
}

/** Compare constraints and function source; captures still need deps/rulesKey. */
export function rulesSignature<ErrorValue>(
  rules: readonly ModernValidationRule<ErrorValue>[] = [],
  { hashFunctions = true }: { hashFunctions?: boolean } = {},
): string {
  const seen = new Set<object>();
  const signature = (value: unknown): string => {
    if (typeof value === 'function')
      return hashFunctions ? `function:${value.toString()}` : 'function';
    if (value instanceof RegExp) return `regexp:${value.source}/${value.flags}`;
    if (!value || typeof value !== 'object')
      return `${typeof value}:${String(value)}`;
    if (seen.has(value)) return 'cycle';
    seen.add(value);
    const result = JSON.stringify(
      Object.keys(value)
        .filter((key) => key !== 'message')
        .sort()
        .map((key) => [key, signature(Reflect.get(value, key))]),
    );
    seen.delete(value);
    return result;
  };
  return signature(rules);
}

export async function runRules<ErrorValue>(
  value: unknown,
  rules: readonly ModernValidationRule<ErrorValue>[],
  context: ModernValidationContext<any>,
  policy: 'first' | 'all',
): Promise<ErrorValue[]> {
  const errors: ErrorValue[] = [];
  for (const rule of rules) {
    if (context.signal.aborted) break;
    const { validator, transform, ...checks } = rule;
    try {
      const transformed = transform ? transform(value) : value;
      await applyRule(transformed, checks, undefined);
      if (context.signal.aborted) break;
      const result = await validator?.(rule, transformed, context);
      if (result !== undefined && result !== null && result !== '')
        errors.push(result as ErrorValue);
    } catch (error) {
      errors.push(
        ((error instanceof Error ? error.message || rule.message : error) ??
          rule.message ??
          (rule.required ? 'Required' : 'Invalid value')) as ErrorValue,
      );
    }
    if (errors.length && policy === 'first') break;
  }
  return errors;
}
