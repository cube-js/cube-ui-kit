/**
 * Which stories Chromatic actually photographs.
 *
 * `parameters.chromatic` is evaluated in the browser, so the built `index.json`
 * cannot answer this — the opt-outs have to be read out of the story source.
 * Shared by `scripts/chromatic-report.mjs` (to count the bill) and
 * `scripts/chromatic-duplicates.mjs` (so a duplicate group that has already
 * been dealt with stops being reported).
 */
import { readFileSync } from 'node:fs';

/**
 * Recognised spellings of an opt-out, all of which resolve to
 * `parameters.chromatic.disableSnapshot`:
 *
 *   Story.parameters = NO_SNAPSHOT;
 *   Story.parameters = { ...NO_SNAPSHOT, docs: … };
 *   export const Story = { …, parameters: NO_SNAPSHOT };
 *   export const Story = { …, parameters: { ...NO_SNAPSHOT, … } };
 *
 * Assigning through an alias (`Story.parameters = SHARED;`) is deliberately not
 * recognised — `chromatic-report.mjs` cross-checks the count against how often
 * each file mentions `NO_SNAPSHOT` and reports the difference, so an unreadable
 * spelling surfaces as a warning rather than as a silently wrong total.
 */
export function isOptedOut(source, exportName) {
  const OPT_OUT = /NO_SNAPSHOT|disableSnapshot:\s*true/;

  if (
    new RegExp(`^${exportName}\\.parameters = NO_SNAPSHOT;$`, 'm').test(source)
  ) {
    return true;
  }

  const assigned = source.match(
    new RegExp(`^${exportName}\\.parameters = \\{[\\s\\S]*?^\\};$`, 'm'),
  );
  if (assigned && OPT_OUT.test(assigned[0])) return true;

  const block = storyBlock(source, exportName);
  if (!block) return false;

  const params = block.match(
    /^\s{2}parameters: (NO_SNAPSHOT,|\{[\s\S]*?^\s{2}\},)$/m,
  );

  return Boolean(params && OPT_OUT.test(params[0]));
}

/**
 * Whether the story file drives `exportName` with a `play` function.
 *
 * Both authoring styles are in use: `play` inside a CSF3 object literal, and
 * `Story.play = …` assigned after a `StoryFn`.
 */
export function hasPlay(source, exportName) {
  if (new RegExp(`^${exportName}\\.play\\s*=`, 'm').test(source)) return true;

  const block = storyBlock(source, exportName);

  return Boolean(block && /^\s*play\s*:/m.test(block));
}

/** Source from `export const <name>` up to the next top-level export. */
function storyBlock(source, exportName) {
  const start = source.search(
    new RegExp(`^export const ${exportName}\\b`, 'm'),
  );
  if (start === -1) return null;

  const rest = source.slice(start + 1);
  const nextExport = rest.search(/^export (const|default)\b/m);

  return rest.slice(0, nextExport === -1 ? undefined : nextExport);
}

/** Reads story files once each, keyed by the index's `importPath`. */
export function sourceReader(root) {
  const cache = new Map();

  return (importPath) => {
    const path = `${root}/${importPath.replace(/^\.\//, '')}`;
    if (!cache.has(path)) {
      let text = '';
      try {
        text = readFileSync(path, 'utf-8');
      } catch {
        // Story file outside the repo tree; treat it as fully snapshotted.
      }
      cache.set(path, text);
    }
    return cache.get(path);
  };
}

/**
 * The marker that records "an overlay word in the name, but the overlay is not
 * what this story shows".
 *
 * The unopened-overlay check is a heuristic over story names, so it has honest
 * false positives: a `FieldWrapper / WithTooltip` whose subject is where the
 * info badge sits in the label row, an `OverlayPanel` that renders open from
 * the start, a `Skeleton / Menu` that is a skeleton. Without a way to record
 * that someone looked and decided, those entries sit in the report forever and
 * the whole list stops being read.
 *
 * Write it as a comment directly above the story:
 *
 *   // chromatic-overlay-reviewed: the badge, not the tooltip, is the subject
 *   export const WithTooltip: Story = { … };
 */
export function isOverlayReviewed(source, exportName) {
  const decl = new RegExp(
    `^\\s*// chromatic-overlay-reviewed\\b.*\\n(?:^\\s*//.*\\n)*^export const ${exportName}\\b`,
    'm',
  );

  return decl.test(source);
}
