// @vitest-environment node
import { KNOWN_FLAGS, parseArgs, print } from './probe-cli.mjs';

describe('parseArgs', () => {
  it('keeps each --computed group with its own selector and properties', () => {
    const options = parseArgs([
      'render',
      '--computed',
      '[data-qa="A"]',
      'padding',
      '--computed',
      '[data-qa="B"]',
      'fontSize',
      'color',
      '--scheme',
      'dark',
    ]);

    expect(options.errors).toEqual([]);
    expect(options.computed).toEqual([
      { selector: '[data-qa="A"]', props: ['padding'] },
      { selector: '[data-qa="B"]', props: ['fontSize', 'color'] },
    ]);
    expect(options.scheme).toBe('dark');
  });

  it('leaves a group without properties empty, for the harness defaults', () => {
    expect(parseArgs(['render', '--computed', '.a']).computed).toEqual([
      { selector: '.a', props: [] },
    ]);
  });

  it('reads a custom property as a property name, not as a flag', () => {
    const options = parseArgs([
      'render',
      '--computed',
      '.a',
      '--gap',
      'padding',
      '--json',
    ]);

    expect(options.errors).toEqual([]);
    expect(options.computed).toEqual([
      { selector: '.a', props: ['--gap', 'padding'] },
    ]);
    expect(options.json).toBe(true);
  });

  it.each([...KNOWN_FLAGS])('ends a --computed group at %s', (flag) => {
    const options = parseArgs([
      'render',
      '--computed',
      '.a',
      'padding',
      flag,
      'value',
    ]);

    expect(options.computed[0]).toEqual({ selector: '.a', props: ['padding'] });
    expect(options.positional).not.toContain(flag);
  });

  it('refuses a flag as the selector', () => {
    expect(
      parseArgs(['render', '--computed', '--scheme', 'dark']).errors,
    ).toEqual([
      '--computed needs a value, but the next argument is the flag "--scheme".',
    ]);
  });

  it.each(['--computed', '--rect'])('refuses an empty %s selector', (flag) => {
    expect(parseArgs(['render', flag, '']).errors).toEqual([
      `${flag} needs a value, but it was given an empty one.`,
    ]);
  });

  it('refuses the same --computed selector twice', () => {
    const options = parseArgs([
      'render',
      '--computed',
      '.a',
      'padding',
      '--computed',
      '.a',
      'color',
    ]);

    expect(options.errors).toEqual([
      '--computed ".a" was given twice. List all its properties after one --computed.',
    ]);
  });

  it('refuses a second --rect instead of keeping the last one', () => {
    expect(
      parseArgs(['render', '--rect', '.a', '--rect', '.b']).errors,
    ).toEqual([
      '--rect reads one selector per run, and it was given twice. Run the probe once per selector.',
    ]);
  });
});

describe('print', () => {
  const capture = () => {
    const out = [];
    const err = [];

    vi.spyOn(console, 'log').mockImplementation((line) => out.push(line));
    vi.spyOn(console, 'error').mockImplementation((line) => err.push(line));

    return { out, err };
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints one block per --computed selector, headed by that selector', () => {
    const { out } = capture();

    print(
      {
        ok: true,
        computed: {
          '[data-qa="A"]': { padding: '16px', '--gap': '(not set)' },
          '[data-qa="B"]': { fontSize: '14px' },
        },
      },
      {},
    );

    expect(out).toEqual([
      '=== COMPUTED [data-qa="A"] (real browser) ===',
      'padding: 16px',
      '--gap: (not set)',
      '',
      '=== COMPUTED [data-qa="B"] (real browser) ===',
      'fontSize: 14px',
      '',
    ]);
  });

  it('prints a selector miss as its one line', () => {
    const { out, err } = capture();
    const message = 'probe:browser --computed: no element matched ".nope".';

    print({ ok: false, kind: 'selector', message }, {});

    expect(out).toEqual([]);
    expect(err).toEqual([message]);
  });
});
