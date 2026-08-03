import { FIXTURES } from './fixtures';
import { probe, probesMatch } from './probe';

describe('prover fixtures', () => {
  /** Baseline: what the harness renders when the component contributes nothing. */
  const EMPTY = probe(<></>);

  it.each(FIXTURES.map((f) => [f.name, f] as const))(
    '%s renders and is byte-stable',
    (_name, fixture) => {
      const a = probe(fixture.render({}));

      // A fixture that renders nothing is worse than a missing one: every prop
      // would look like a no-op and get recorded as a verified default, and the
      // rule would then delete real props. Compare against an empty tree so
      // "component contributed no markup" fails loudly here instead.
      expect(a.markup).not.toBe(EMPTY.markup);
      expect(a.markup.length).toBeGreaterThan(EMPTY.markup.length);

      // Determinism is the precondition for the whole approach: if identical
      // input produced different output, every comparison would be noise.
      expect(probesMatch(probe(fixture.render({})), a)).toBe(true);
    },
  );

  it.each(
    FIXTURES.flatMap((f) =>
      (f.conditions ?? []).map(
        (c) => [`${f.name} / ${c.label}`, f, c] as const,
      ),
    ),
  )('%s condition renders and is byte-stable', (_label, fixture, condition) => {
    const wrap = condition.wrap ?? ((ui: React.ReactElement) => ui);
    const render = () => probe(wrap(fixture.render({ ...condition.props })));

    const a = render();

    expect(a.markup.length).toBeGreaterThan(0);
    expect(probesMatch(render(), a)).toBe(true);
  });
});
