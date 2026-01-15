import { classify } from './classify';
import { Lru } from './lru';
import { scan } from './tokenizer';
import {
  Bucket,
  finalizeGroup,
  makeEmptyDetails,
  ParserOptions,
  ProcessedStyle,
  StyleDetails,
} from './types';

export class StyleParser {
  private cache: Lru<string, ProcessedStyle>;
  constructor(private opts: ParserOptions = {}) {
    this.cache = new Lru<string, ProcessedStyle>(this.opts.cacheSize ?? 1000);
  }

  /* ---------------- Public API ---------------- */
  process(src: string): ProcessedStyle {
    const key = String(src);
    const hit = this.cache.get(key);
    if (hit) return hit;

    // strip comments & lower-case once
    const stripped = src
      .replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '')
      .toLowerCase();

    const groups: StyleDetails[] = [];
    let current = makeEmptyDetails();

    const pushToken = (bucket: Bucket, processed: string) => {
      if (!processed) return;

      // If the previous token was a url(...) value, merge this token into it so that
      // background layer segments like "url(img) no-repeat center/cover" are kept
      // as a single value entry.
      const mergeIntoPrevUrl = () => {
        const lastIdx = current.values.length - 1;
        current.values[lastIdx] += ` ${processed}`;
        const lastAllIdx = current.all.length - 1;
        current.all[lastAllIdx] += ` ${processed}`;
      };

      const prevIsUrlValue =
        current.values.length > 0 &&
        current.values[current.values.length - 1].startsWith('url(');

      if (prevIsUrlValue) {
        // Extend the existing url(...) value regardless of current bucket.
        mergeIntoPrevUrl();
        // Additionally, for non-value buckets we need to remove their own storage.
        // So early return.
        return;
      }

      switch (bucket) {
        case Bucket.Color:
          current.colors.push(processed);
          break;
        case Bucket.Value:
          current.values.push(processed);
          break;
        case Bucket.Mod:
          current.mods.push(processed);
          break;
      }
      current.all.push(processed);
    };

    const endGroup = () => {
      finalizeGroup(current);
      groups.push(current);
      current = makeEmptyDetails();
    };

    scan(stripped, (tok, isComma, prevChar) => {
      if (tok) {
        // Accumulate raw token into current.input
        if (current.input) {
          current.input += ` ${tok}`;
        } else {
          current.input = tok;
        }

        const { bucket, processed } = classify(tok, this.opts, (sub) =>
          this.process(sub),
        );
        pushToken(bucket, processed);
      }
      if (isComma) endGroup();
    });

    // push final group if not already
    if (current.all.length || !groups.length) endGroup();

    const output = groups.map((g) => g.output).join(', ');
    const result: ProcessedStyle = { output, groups };
    Object.freeze(result);
    this.cache.set(key, result);
    return result;
  }

  setFuncs(funcs: Required<ParserOptions>['funcs']): void {
    this.opts.funcs = funcs;
    this.cache.clear();
  }

  setUnits(units: Required<ParserOptions>['units']): void {
    this.opts.units = units;
    this.cache.clear();
  }

  updateOptions(patch: Partial<ParserOptions>): void {
    Object.assign(this.opts, patch);
    if (patch.cacheSize)
      this.cache = new Lru<string, ProcessedStyle>(patch.cacheSize);
    else this.cache.clear();
  }

  /**
   * Clear the parser cache.
   * Call this when external state that affects parsing results has changed
   * (e.g., predefined tokens).
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get the current units configuration.
   */
  getUnits(): ParserOptions['units'] {
    return this.opts.units;
  }
}

// Re-export
export type { StyleDetails, ProcessedStyle } from './types';
