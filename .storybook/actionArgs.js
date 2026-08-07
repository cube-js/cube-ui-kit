/**
 * Keeps Storybook's auto-wired action spies from serializing DOM events.
 *
 * Storybook attaches an `action()` spy to every `on*` prop it finds in a
 * component's argTypes (`addActionsFromArgTypes`). React Aria calls those spies
 * with the raw React synthetic event, and the preview channel then serializes
 * the whole payload with telejson at `maxDepth: 15` — once for the postMessage
 * transport, and again for the dev-server websocket, which hardcodes that depth
 * and ignores per-event options.
 *
 * A synthetic event reaches `nativeEvent`, `target` and `_targetInst` (the React
 * fiber), so that walk drags in the entire component tree: ~174k
 * `JSON.stringify` calls and ~435k regex tests, i.e. ~600ms of synchronous work
 * on *every* focus change, in *every* story. Replacing event-like arguments
 * with a compact plain summary before the spy sees them keeps the Actions panel
 * readable and drops the cost to ~1ms.
 *
 * This is dev-server-only: a production build of the kit has no channel and no
 * action spies, and pays none of this.
 */

const isEventLike = (value) =>
  !!value &&
  typeof value === 'object' &&
  typeof value.preventDefault === 'function' &&
  typeof value.stopPropagation === 'function';

const isDomNode = (value) =>
  !!value && typeof value === 'object' && typeof value.tagName === 'string';

/** `input#«r0»[data-qa="Input"]` — enough to identify the node in the panel. */
const describeNode = (node) => {
  if (!isDomNode(node)) return undefined;

  const qa = node.getAttribute?.('data-qa');

  return [
    node.tagName.toLowerCase(),
    node.id ? `#${node.id}` : '',
    qa ? `[data-qa="${qa}"]` : '',
  ].join('');
};

const summarizeEvent = (event) => {
  const summary = { __event: event.type ?? 'event' };
  const target = describeNode(event.target);
  const currentTarget = describeNode(event.currentTarget);

  if (target) summary.target = target;
  if (currentTarget && currentTarget !== target) {
    summary.currentTarget = currentTarget;
  }
  if (typeof event.key === 'string') summary.key = event.key;
  if (typeof event.target?.value === 'string') {
    summary.value = event.target.value;
  }

  return summary;
};

const summarizeArg = (arg) => {
  if (isEventLike(arg)) return summarizeEvent(arg);
  if (isDomNode(arg)) return { __node: describeNode(arg) };

  return arg;
};

/**
 * Wraps every action arg so its arguments are summarized before the spy runs.
 *
 * Project annotations are composed last, so by the time this runs the actions
 * addon has already attached its `action()` handlers and `storybook/test` has
 * wrapped each one in an `fn()` spy. Wrapping from the outside is what makes
 * this independent of both: neither the postMessage nor the websocket transport
 * gets a live event to walk, whatever `maxDepth` each one happens to use.
 *
 * The spy's own properties are carried over, so it still reads as a mock and
 * the Actions panel still recognises it. Its recorded calls hold the summarized
 * arguments — no story in this repo asserts on them, and an assertion against a
 * live `FocusEvent` is not something to preserve anyway.
 */
export const argsEnhancers = [
  ({ initialArgs }) => {
    const patched = {};

    for (const [name, value] of Object.entries(initialArgs)) {
      if (typeof value !== 'function' || !value.isAction) continue;

      const spy = value;
      const wrapped = (...args) => spy(...args.map(summarizeArg));

      Object.assign(wrapped, spy);
      wrapped.isAction = true;
      patched[name] = wrapped;
    }

    return patched;
  },
];
