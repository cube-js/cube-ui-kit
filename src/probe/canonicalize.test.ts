import { canonicalizeIds } from './canonicalize';

it.each([
  ['«r0»', '«r9»'],
  [':r0:', ':ra:'],
  [':R1H2:', ':R3H4:'],
  ['_r_0_', '_r_a_'],
  ['_R_1H2_', '_R_3H4_'],
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

it.each([
  [':r0:', ':r1:'],
  ['_r_0_', '_r_1_'],
])(
  'keeps different IDs distinct so broken label references remain visible (%s)',
  (first, second) => {
    const correct = `<label for="${first}">Name</label><input id="${first}">`;
    const broken = `<label for="${first}">Name</label><input id="${second}">`;
    expect(canonicalizeIds(broken)).not.toBe(canonicalizeIds(correct));
  },
);
