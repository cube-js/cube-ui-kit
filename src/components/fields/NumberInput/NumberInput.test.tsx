import { fireEvent, render, userEvent } from '../../../test';

import { NumberInput } from './NumberInput';

vi.mock('../../../_internal/hooks/use-warn');

describe('<NumberInput />', () => {
  it('calls onKeyDown and onKeyUp with the key', async () => {
    const onKeyDown = vi.fn((e) => e.key);
    const onKeyUp = vi.fn((e) => e.key);
    const { getByRole } = render(
      <NumberInput label="test" onKeyDown={onKeyDown} onKeyUp={onKeyUp} />,
    );

    await userEvent.type(getByRole('textbox'), '4{ArrowUp}');

    expect(onKeyDown.mock.results.map((r) => r.value)).toEqual([
      '4',
      'ArrowUp',
    ]);
    expect(onKeyUp.mock.results.map((r) => r.value)).toEqual(['4', 'ArrowUp']);
    expect(getByRole('textbox')).toHaveValue('5');
  });

  // React Aria runs the number field's own keys before the user handler, so
  // `preventDefault()` there cannot cancel them — see "Keyboard Events" in the
  // docs. That order is what lets an Enter handler read the committed number.
  it('commits the typed number before onKeyDown sees Enter', async () => {
    const calls: string[] = [];
    const { getByRole } = render(
      <NumberInput
        label="test"
        onChange={(value) => calls.push(`change:${value}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') calls.push('keydown:Enter');
        }}
      />,
    );

    await userEvent.type(getByRole('textbox'), '42{Enter}');

    expect(calls).toEqual(['change:42', 'keydown:Enter']);
  });

  it('steps on ArrowUp even when onKeyDown prevents the key', async () => {
    const onKeyDown = vi.fn((e) => e.preventDefault());
    const { getByRole } = render(
      <NumberInput label="test" defaultValue={1} onKeyDown={onKeyDown} />,
    );

    await userEvent.type(getByRole('textbox'), '{ArrowUp}');

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(getByRole('textbox')).toHaveValue('2');
  });

  it.each([
    ['ArrowUp', true],
    ['4', false],
  ] as const)(
    'exposes native default prevention for %s before the callback',
    (key, prevented) => {
      const onKeyDown = vi.fn((event) => [
        event.defaultPrevented,
        event.isDefaultPrevented(),
        event.nativeEvent.defaultPrevented,
      ]);
      const { getByRole } = render(
        <NumberInput label="test" defaultValue={1} onKeyDown={onKeyDown} />,
      );

      fireEvent.keyDown(getByRole('textbox'), { key });

      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onKeyDown.mock.results[0].value).toEqual([
        prevented,
        prevented,
        prevented,
      ]);
    },
  );

  it.each(['Enter', 'ArrowUp'])(
    'lets onKeyDown continue %s after native number handling',
    (key) => {
      const calls: string[] = [];
      const { getByRole } = render(
        <div onKeyDown={(e) => calls.push(`parent:${e.key}`)}>
          <NumberInput
            label="test"
            defaultValue={1}
            onChange={(value) => calls.push(`change:${value}`)}
            onKeyDown={(e) => {
              calls.push(`input:${e.key}`);
              e.continuePropagation();
            }}
          />
        </div>,
      );

      const input = getByRole('textbox');
      if (key === 'Enter') {
        fireEvent.change(input, { target: { value: '42' } });
      }
      fireEvent.keyDown(input, { key });

      expect(calls).toEqual([
        `change:${key === 'Enter' ? 42 : 2}`,
        `input:${key}`,
        `parent:${key}`,
      ]);
    },
  );

  it.each([false, true])(
    'stops Enter without continuation when a callback is present: %s',
    (hasCallback) => {
      const calls: string[] = [];
      const { getByRole } = render(
        <div onKeyDown={(e) => calls.push(`parent:${e.key}`)}>
          <NumberInput
            label="test"
            onChange={(value) => calls.push(`change:${value}`)}
            onKeyDown={
              hasCallback ? (e) => calls.push(`input:${e.key}`) : undefined
            }
          />
        </div>,
      );

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: '42' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(calls).toEqual(
        hasCallback ? ['change:42', 'input:Enter'] : ['change:42'],
      );
    },
  );

  it('lets an ordinary key reach ancestors after its callback', () => {
    const calls: string[] = [];
    const { getByRole } = render(
      <div onKeyDown={(e) => calls.push(`parent:${e.key}`)}>
        <NumberInput
          label="test"
          onKeyDown={(e) => calls.push(`input:${e.key}`)}
        />
      </div>,
    );

    fireEvent.keyDown(getByRole('textbox'), { key: '4' });

    expect(calls).toEqual(['input:4', 'parent:4']);
  });

  it('steps and propagates ArrowUp when the callback prevents default', () => {
    const calls: string[] = [];
    const { getByRole } = render(
      <div onKeyDown={(e) => calls.push(`parent:${e.key}`)}>
        <NumberInput
          label="test"
          defaultValue={1}
          onChange={(value) => calls.push(`change:${value}`)}
          onKeyDown={(e) => {
            calls.push(`input:${e.key}`);
            e.preventDefault();
          }}
        />
      </div>,
    );

    fireEvent.keyDown(getByRole('textbox'), { key: 'ArrowUp' });

    expect(calls).toEqual(['change:2', 'input:ArrowUp', 'parent:ArrowUp']);
  });

  it.each([false, true])(
    'provides an Aria keyup event with continuation: %s',
    (shouldContinue) => {
      const calls: string[] = [];
      const { getByRole } = render(
        <div onKeyUp={(e) => calls.push(`parent:${e.key}`)}>
          <NumberInput
            label="test"
            onKeyUp={(e) => {
              calls.push(`input:${e.key}`);
              if (shouldContinue) e.continuePropagation();
            }}
          />
        </div>,
      );

      fireEvent.keyUp(getByRole('textbox'), { key: '4' });

      expect(calls).toEqual(
        shouldContinue ? ['input:4', 'parent:4'] : ['input:4'],
      );
    },
  );

  it('keeps readonly keyboard callbacks without stepping its value', () => {
    const calls: string[] = [];
    const onChange = vi.fn();
    const { getByRole } = render(
      <NumberInput
        label="test"
        isReadOnly
        defaultValue={1}
        onChange={onChange}
        onKeyDown={(e) => calls.push(`down:${e.key}`)}
        onKeyUp={(e) => calls.push(`up:${e.key}`)}
      />,
    );

    const input = getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Escape' });
    fireEvent.keyUp(input, { key: 'Escape' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyUp(input, { key: 'ArrowUp' });

    expect(calls).toEqual([
      'down:Escape',
      'up:Escape',
      'down:ArrowUp',
      'up:ArrowUp',
    ]);
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue('1');
  });

  describe('suffix order', () => {
    // Reads the Suffix slot in DOM order: the unit, each stepper button, the
    // validation/loading `State` and a trailing action.
    function readSuffixSlot(container: HTMLElement) {
      const slot = container.querySelector('[data-element="Suffix"]');

      return Array.from(
        slot?.querySelectorAll(
          '[data-qa="unit"], [data-qa="action"], button, [data-element="State"]',
        ) ?? [],
      ).map((el) =>
        el.matches('button')
          ? 'stepper'
          : el.getAttribute('data-qa') ?? el.getAttribute('data-element'),
      );
    }

    it.each(['small', 'medium', 'large'] as const)(
      'puts a unit suffix before the steppers by default (%s)',
      (size) => {
        const { container } = render(
          <NumberInput
            aria-label="Width"
            size={size}
            value={40}
            suffix={<span data-qa="unit">px</span>}
          />,
        );

        expect(readSuffixSlot(container)).toEqual([
          'unit',
          'stepper',
          'stepper',
        ]);
      },
    );

    it('puts the suffix before the steppers with suffixPosition="before"', () => {
      const { container } = render(
        <NumberInput
          aria-label="Width"
          value={40}
          suffix={<span data-qa="unit">px</span>}
          suffixPosition="before"
        />,
      );

      expect(readSuffixSlot(container)).toEqual(['unit', 'stepper', 'stepper']);
    });

    it('puts the suffix after the steppers with suffixPosition="after"', () => {
      const { container } = render(
        <NumberInput
          aria-label="Width"
          value={40}
          suffix={<span data-qa="unit">px</span>}
          suffixPosition="after"
        />,
      );

      expect(readSuffixSlot(container)).toEqual(['stepper', 'stepper', 'unit']);
    });

    it.each([undefined, 'before', 'after'] as const)(
      'renders only the suffix when the stepper is hidden (suffixPosition=%s)',
      (suffixPosition) => {
        const { container } = render(
          <NumberInput
            hideStepper
            aria-label="Width"
            value={40}
            suffix={<span data-qa="unit">px</span>}
            suffixPosition={suffixPosition}
          />,
        );

        expect(readSuffixSlot(container)).toEqual(['unit']);
      },
    );

    it.each([undefined, 'after'] as const)(
      'keeps the loading state first and actions last (suffixPosition=%s)',
      (suffixPosition) => {
        const { container } = render(
          <NumberInput
            isLoading
            aria-label="Width"
            value={40}
            suffix={<span data-qa="unit">px</span>}
            suffixPosition={suffixPosition}
            actions={<span data-qa="action">+</span>}
          />,
        );

        const steppers = ['stepper', 'stepper'];

        expect(readSuffixSlot(container)).toEqual([
          'State',
          ...(suffixPosition === 'after'
            ? [...steppers, 'unit']
            : ['unit', ...steppers]),
          'action',
        ]);
      },
    );

    it('renders no Suffix slot without a suffix when the stepper is hidden', () => {
      const { container } = render(
        <NumberInput hideStepper aria-label="Width" value={40} />,
      );

      expect(
        container.querySelector('[data-element="Suffix"]'),
      ).not.toBeInTheDocument();
    });
  });
});
