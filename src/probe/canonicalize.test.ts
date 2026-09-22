import { canonicalizeIds } from './canonicalize';

it.each([
  ['«r0»', '«r9»'],
  [':r0:', ':ra:'],
  [':R1H2:', ':R3H4:'],
])(
  'normalizes generated IDs and preserves label references (%s)',
  (first, second) => {
    const markup = (id: string) =>
      `<label for="${id}">Name</label><input id="${id}">`;
    expect(canonicalizeIds(markup(first))).toBe(
      canonicalizeIds(markup(second)),
    );
  },
);

it('keeps different IDs distinct so broken label references remain visible', () => {
  const correct = '<label for=":r0:">Name</label><input id=":r0:">';
  const broken = '<label for=":r0:">Name</label><input id=":r1:">';
  expect(canonicalizeIds(broken)).not.toBe(canonicalizeIds(correct));
});
