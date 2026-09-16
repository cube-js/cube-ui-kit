/**
 * Flattens a nested object into dot paths: `{ a: { b: 1 } }` becomes
 * `{ 'a.b': 1 }`. Numeric keys use bracket notation — `{ a: { 0: 'x' } }`
 * becomes `{ 'a[0]': 'x' }`.
 *
 * `Form` uses it so `setFieldsValue({ user: { name: 'A' } })` also reaches a
 * field registered as `name="user.name"`.
 *
 * Only plain objects are walked into: arrays, class instances and everything
 * else stay as leaf values under their own path.
 *
 * Ported from `@tenphi/tasty`, which exported `dotize` until v3.8 and then
 * dropped it. Only `convert` was ever used here, so the inverse (`backward`)
 * is not carried over.
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;

  return Object.getPrototypeOf(value) === Object.prototype;
}

/** `parseInt` semantics on purpose: an index arrives as a string key. */
function isIndexLike(key: string): boolean {
  return !isNaN(parseInt(key));
}

function dotName(field: string, prefix?: string): string {
  return prefix ? `${prefix}.${field}` : field;
}

function bracketName(field: string, prefix?: string): string {
  return `${prefix ?? ''}[${field}]`;
}

export function dotizeConvert(obj: unknown, prefix = ''): any {
  if (!isPlainObject(obj)) {
    return prefix ? { [prefix]: obj } : obj;
  }

  const result: Record<string, unknown> = {};

  (function recurse(source: Record<string, unknown>, currentPrefix?: string) {
    for (const field in source) {
      const value = source[field];

      if (isPlainObject(value)) {
        // Nested objects keep dot notation even under a numeric key, and an
        // empty one has nothing to flatten into, so it stays a leaf.
        const name = dotName(field, currentPrefix);

        if (Object.keys(value).length > 0) {
          recurse(value, name);
        } else {
          result[name] = value;
        }
      } else {
        result[
          isIndexLike(field)
            ? bracketName(field, currentPrefix)
            : dotName(field, currentPrefix)
        ] = value;
      }
    }
  })(obj, prefix || undefined);

  return result;
}
