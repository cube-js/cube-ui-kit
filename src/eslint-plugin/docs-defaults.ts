import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { parseDocDefault } from './probe';
import { DefaultValue } from './types';

/**
 * Read the documented defaults out of `*.docs.mdx`.
 *
 * Every one of the ~378 documented defaults in the corpus already carries a
 * value, so the prover does not need to enumerate a prop's union type — it just
 * needs the documented value to verify. That makes this the only input the
 * generator needs, and keeps it independent of the TypeScript compiler.
 *
 * Section boundaries mirror `extractPropsFromDocs` in `scripts/audit-docs.mjs`
 * so both tools agree on what counts as a documented prop.
 */

const COMPONENTS_DIR = join(process.cwd(), 'src', 'components');

const PROP_SECTION = /^#{2,3}\s+[\w-]*\s*Properties\s*$/;
const STOP_H2 = /^##\s+(?!.*Properties)/;
const STOP_H3 =
  /^###\s+(Modifiers|Variants|Base Properties|Field Properties|HTML Form Properties)\s*$/;
const BULLET = /^\s*-\s+\*\*`([^`]+)`\*\*/;
const DEFAULT_ANNOTATION = /\(default:\s+`([^`]*)`/;

/**
 * `### Style Defaults` lists the tasty styles a component sets on itself. They are
 * defaults just as much as the `## Properties` ones — ui-kit components forward
 * style props, so `<Space gap="1x">` restates what the component already does — but
 * they are written in a different shape, so the Properties parser skipped all 30
 * components that have such a section.
 */
const STYLE_DEFAULTS_SECTION = /^#{2,3}\s+Style Defaults\s*$/;

/** `- \`gap\` — \`1x\`` — single backticks and an em dash, no `(default: …)`. */
const STYLE_BULLET = /^\s*-\s+`([^`]+)`\s+—\s+`([^`]*)`\s*(.*)$/;

function findDocsFiles(dir: string, out: Map<string, string> = new Map()) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);

    if (statSync(path).isDirectory()) {
      findDocsFiles(path, out);
    } else if (entry.endsWith('.docs.mdx')) {
      out.set(entry.replace(/\.docs\.mdx$/, ''), path);
    }
  }

  return out;
}

let docsFilesCache: Map<string, string> | undefined;

function docsFiles() {
  return (docsFilesCache ??= findDocsFiles(COMPONENTS_DIR));
}

/**
 * Every component whose docs declare at least one default — i.e. the full set
 * the registry could eventually cover. Used to report the coverage gap so
 * missing fixtures stay visible instead of looking like "nothing to do".
 */
export function componentsWithDocumentedDefaults(): string[] {
  return [...docsFiles().keys()]
    .filter((component) => readDocumentedDefaults(component).length > 0)
    .sort();
}

export interface DocumentedDefault {
  prop: string;
  /** The value as written in the docs, for error messages. */
  raw: string;
  /** Parsed literal, or `undefined` when the annotation isn't a plain literal. */
  value: DefaultValue | undefined;
}

/**
 * Documented defaults for a component, keyed by the component's docs file name
 * (`Button` -> `Button.docs.mdx`). Compound names like `Button.Split` resolve
 * against their own docs file when one exists.
 */
export function readDocumentedDefaults(component: string): DocumentedDefault[] {
  const path = docsFiles().get(component);

  if (!path) return [];

  const results: DocumentedDefault[] = [];
  let section: 'none' | 'props' | 'styleDefaults' = 'none';

  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (STYLE_DEFAULTS_SECTION.test(line)) {
      section = 'styleDefaults';
      continue;
    }

    if (STOP_H2.test(line) || STOP_H3.test(line)) {
      section = 'none';
      continue;
    }

    if (PROP_SECTION.test(line)) {
      section = 'props';
      continue;
    }

    if (section === 'styleDefaults') {
      const bullet = line.match(STYLE_BULLET);

      if (!bullet) continue;

      // A trailing note means the value is conditional — "switches to `column`
      // when `direction=\"vertical\"`". The probe can only rule that out when the
      // fixture happens to declare the matching condition, and a wrong entry here
      // makes the rule delete a load-bearing prop. The note is an explicit signal,
      // so believe it and skip rather than hope the fixture covers it.
      if (bullet[3].trim()) continue;

      results.push({
        prop: bullet[1],
        raw: bullet[2],
        value: parseDocDefault(bullet[2]),
      });

      continue;
    }

    if (section !== 'props') continue;

    const bullet = line.match(BULLET);

    if (!bullet) continue;

    const annotation = line.slice(bullet[0].length).match(DEFAULT_ANNOTATION);

    if (!annotation) continue;

    results.push({
      prop: bullet[1],
      raw: annotation[1],
      value: parseDocDefault(annotation[1]),
    });
  }

  return results;
}
