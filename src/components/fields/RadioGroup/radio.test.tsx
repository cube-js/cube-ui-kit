import { createRef } from 'react';

import { CheckIcon } from '../../../icons/CheckIcon';
import {
  act,
  fireEvent,
  hoverWithPointer,
  renderWithForm,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
  within,
} from '../../../test';

import { Radio } from './Radio';

vi.mock('../../../_internal/hooks/use-warn');

function Options({ tooltip }: { tooltip?: string }) {
  return (
    <>
      <Radio value="a" tooltip={tooltip}>
        Alpha
      </Radio>
      <Radio value="b" tooltip={tooltip}>
        Beta
      </Radio>
      <Radio value="c" tooltip={tooltip}>
        Gamma
      </Radio>
    </>
  );
}

describe('<Radio /> and <RadioGroup />', () => {
  it('should work without form', async () => {
    const { getAllByRole } = renderWithRoot(
      <Radio.Group aria-label="Group">
        <Radio value="test">test</Radio>
        <Radio value="test2">test2</Radio>
      </Radio.Group>,
    );
    const radio = getAllByRole('radio');
    await act(async () => await userEvent.click(radio[0]));

    expect(radio[0]).toBeChecked();
  });

  it('should interop with <Form />', async () => {
    const { formInstance } = renderWithForm(
      <Radio.Group name="test" aria-label="Group">
        <Radio value="test">test</Radio>
        <Radio value="test2">test2</Radio>
      </Radio.Group>,
    );
    const radio = screen.getAllByRole('radio');

    await act(async () => await userEvent.click(radio[0]));

    expect(radio[0]).toBeChecked();

    expect(formInstance.getFieldValue('test')).toBe('test');
  });

  it('should not select a loading button radio', async () => {
    const { getAllByRole } = renderWithRoot(
      <Radio.ButtonGroup aria-label="Group">
        <Radio value="test">test</Radio>
        <Radio value="test2" isLoading>
          test2
        </Radio>
      </Radio.ButtonGroup>,
    );
    const radio = getAllByRole('radio');

    expect(radio[1]).toBeDisabled();

    await act(async () => await userEvent.click(radio[1]));

    expect(radio[1]).not.toBeChecked();
  });

  it('should keep a loading button radio selectable with an explicit isDisabled={false}', async () => {
    const { getAllByRole } = renderWithRoot(
      <Radio.ButtonGroup aria-label="Group">
        <Radio value="test">test</Radio>
        <Radio value="test2" isLoading isDisabled={false}>
          test2
        </Radio>
      </Radio.ButtonGroup>,
    );
    const radio = getAllByRole('radio');

    expect(radio[1]).not.toBeDisabled();

    await act(async () => await userEvent.click(radio[1]));

    expect(radio[1]).toBeChecked();
  });

  it('should leave a classic radio selectable while loading', async () => {
    const { getAllByRole } = renderWithRoot(
      <Radio.Group aria-label="Group">
        <Radio value="test">test</Radio>
        <Radio value="test2" isLoading>
          test2
        </Radio>
      </Radio.Group>,
    );
    const radio = getAllByRole('radio');

    await act(async () => await userEvent.click(radio[1]));

    expect(radio[1]).toBeChecked();
  });

  describe('tooltip (CUB-5017)', () => {
    // The reported case. A string tooltip never depended on the label's shape,
    // so this guards the ticket's scenario rather than failing without the fix.
    it('shows the tooltip of a button radio on hover', async () => {
      renderWithRoot(
        <Radio.ButtonGroup aria-label="Group">
          <Radio.Button value="a" tooltip="Tip A">
            Alpha
          </Radio.Button>
          <Radio.Button value="b">Beta</Radio.Button>
        </Radio.ButtonGroup>,
      );

      await hoverWithPointer(screen.getAllByTestId('RadioButton')[0]);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Tip A');
      });
    });

    it('shows the tooltip of a classic radio on hover', async () => {
      renderWithRoot(
        <Radio.Group aria-label="Group">
          <Radio value="a" tooltip="Tip A">
            Alpha
          </Radio>
          <Radio value="b">Beta</Radio>
        </Radio.Group>,
      );

      await hoverWithPointer(screen.getAllByTestId('RadioWrapper')[0]);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Tip A');
      });
    });

    // A disabled option is where the reason it is unavailable gets written.
    it('shows the tooltip of a disabled classic radio on hover', async () => {
      renderWithRoot(
        <Radio.Group aria-label="Group">
          <Radio value="a">Alpha</Radio>
          <Radio isDisabled value="b" tooltip="Not on this plan">
            Beta
          </Radio>
        </Radio.Group>,
      );

      await hoverWithPointer(screen.getAllByTestId('RadioWrapper')[1]);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent(
          'Not on this plan',
        );
      });
    });

    it('keeps a classic radio without a tooltip free of one', async () => {
      renderWithRoot(
        <Radio.Group aria-label="Group">
          <Radio value="a">Alpha</Radio>
        </Radio.Group>,
      );

      await hoverWithPointer(screen.getByTestId('RadioWrapper'));
      // Past the default open delay.
      await act(() => new Promise((resolve) => setTimeout(resolve, 400)));

      expect(screen.queryByRole('tooltip')).toBeNull();
    });

    // Keyboard focus lands on the native input, which used to get none of the
    // tooltip's trigger props: the tooltip opened on hover only, and a screen
    // reader never heard it.
    it.each([
      ['classic', Radio.Group],
      ['button', Radio.ButtonGroup],
    ])(
      'opens a %s radio tooltip on keyboard focus and describes the input',
      async (_, Group) => {
        renderWithRoot(
          <Group aria-label="Group">
            <Radio value="a" tooltip="Tip A" aria-describedby="hint">
              Alpha
            </Radio>
          </Group>,
        );

        await userEvent.tab();

        const input = screen.getByRole('radio');

        expect(input).toHaveFocus();

        const tooltip = await screen.findByRole('tooltip');

        expect(tooltip).toHaveTextContent('Tip A');
        // Joined with the input's own description, not replacing it.
        expect(input.getAttribute('aria-describedby')?.split(' ')).toEqual([
          'hint',
          tooltip.id,
        ]);
      },
    );

    // A button radio keeps a disabled auto tooltip mounted while its label
    // fits. That tooltip used to open anyway, unseen, and React Aria swallows
    // every `Escape` while a tooltip is open — so a Dialog would not close
    // while the pointer rested on a radio.
    it('lets Escape through while hovering a radio whose label fits', async () => {
      const onKeyDown = vi.fn();

      renderWithRoot(
        <div onKeyDown={(event) => onKeyDown(event.key)}>
          <button type="button">Elsewhere</button>
          <Radio.Tabs aria-label="Group">
            <Radio.Button value="a">Alpha</Radio.Button>
          </Radio.Tabs>
        </div>,
      );

      screen.getByRole('button', { name: 'Elsewhere' }).focus();
      await hoverWithPointer(screen.getByTestId('RadioButton'));
      // Past the default open delay.
      await act(() => new Promise((resolve) => setTimeout(resolve, 400)));
      await userEvent.keyboard('{Escape}');

      expect(onKeyDown).toHaveBeenCalledWith('Escape');
    });
  });

  // A disabled radio's tooltip is usually the reason it is disabled. A natively
  // disabled input never takes focus, so only a mouse could read it.
  describe('disabled radio with a tooltip (CUB-5387)', () => {
    const GROUPS = [
      ['button', Radio.ButtonGroup],
      ['classic', Radio.Group],
      ['tabs', Radio.Tabs],
    ] as const;

    it.each(GROUPS)(
      'keeps a disabled %s radio focusable and opens its tooltip on focus',
      async (_, Group) => {
        renderWithRoot(
          <Group isDisabled aria-label="Group">
            <Radio value="a" tooltip="Not on this plan">
              Alpha
            </Radio>
          </Group>,
        );

        await userEvent.tab();

        const input = screen.getByRole('radio');

        expect(input).toHaveFocus();
        expect(input).not.toHaveAttribute('disabled');
        expect(input).toHaveAttribute('aria-disabled', 'true');
        // Its disabled styles, the cursor among them, key off this.
        expect(input).toHaveAttribute('data-disabled');
        expect(await screen.findByRole('tooltip')).toHaveTextContent(
          'Not on this plan',
        );
      },
    );

    it.each(GROUPS)(
      'gives a fully disabled %s group one tab stop',
      async (_, Group) => {
        renderWithRoot(
          <>
            <Group isDisabled aria-label="Group">
              <Options tooltip="Not on this plan" />
            </Group>
            <button type="button">After</button>
          </>,
        );

        const [alpha, , gamma] = screen.getAllByRole('radio');

        await userEvent.tab();
        expect(alpha).toHaveFocus();

        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();

        // With nothing selected, Shift+Tab comes back in at the other end.
        await userEvent.tab({ shift: true });
        expect(gamma).toHaveFocus();
      },
    );

    it.each(GROUPS)(
      'puts the tab stop of a disabled %s group on its selected radio',
      async (_, Group) => {
        renderWithRoot(
          <Group isDisabled aria-label="Group" defaultValue="b">
            <Options tooltip="Not on this plan" />
          </Group>,
        );

        await userEvent.tab();

        expect(screen.getAllByRole('radio')[1]).toHaveFocus();
      },
    );

    // Tab from a disabled radio drops the selected radio's tab stop until the
    // key is done; a second Tab before then must not keep it dropped.
    it('gives the tab stop back after two quick Tabs from a disabled radio', async () => {
      renderWithRoot(
        <Radio.ButtonGroup isDisabled aria-label="Group" defaultValue="a">
          <Options tooltip="Not on this plan" />
        </Radio.ButtonGroup>,
      );

      const [alpha, beta] = screen.getAllByRole('radio');

      act(() => beta.focus());
      fireEvent.keyDown(beta, { key: 'Tab' });
      fireEvent.keyDown(beta, { key: 'Tab' });
      // Queued after both restores, so it runs after them.
      await act(() => new Promise((resolve) => setTimeout(resolve)));

      expect(alpha).toHaveAttribute('tabindex', '0');
    });

    // With a visible label the group renders inside a field, with only an
    // aria-label it renders bare. React Aria's arrow handler, which focuses the
    // next radio and selects it, has to stay on the group either way.
    describe.each([
      ['a visible label', { label: 'Group' }],
      ['only an aria-label', { 'aria-label': 'Group' }],
    ] as const)('in a group with %s', (_, labelling) => {
      it.each(GROUPS)(
        'lets nothing change the selection of a disabled %s group',
        async (_, Group) => {
          const onChange = vi.fn();

          renderWithRoot(
            <Group
              isDisabled
              {...labelling}
              defaultValue="a"
              onChange={onChange}
            >
              <Options tooltip="Not on this plan" />
            </Group>,
          );

          const [alpha, beta] = screen.getAllByRole('radio');

          await userEvent.tab();
          await userEvent.keyboard('{ArrowRight}');
          expect(beta).toHaveFocus();
          await userEvent.keyboard(' ');
          await userEvent.click(beta);

          expect(onChange).not.toHaveBeenCalled();
          expect(alpha).toBeChecked();
          expect(beta).not.toBeChecked();
        },
      );

      it.each(GROUPS)(
        'lets the arrow keys reach a disabled %s radio without selecting it',
        async (_, Group) => {
          const onChange = vi.fn();

          renderWithRoot(
            <Group {...labelling} defaultValue="a" onChange={onChange}>
              <Radio value="a">Alpha</Radio>
              <Radio isDisabled value="b" tooltip="Not on this plan">
                Beta
              </Radio>
              <Radio value="c">Gamma</Radio>
            </Group>,
          );

          const [alpha, beta, gamma] = screen.getAllByRole('radio');

          await userEvent.tab();
          await userEvent.keyboard('{ArrowDown}');

          expect(beta).toHaveFocus();
          expect(alpha).toBeChecked();
          expect(await screen.findByRole('tooltip')).toHaveTextContent(
            'Not on this plan',
          );

          await userEvent.keyboard(' ');
          await userEvent.click(beta);
          expect(onChange).not.toHaveBeenCalled();
          expect(alpha).toBeChecked();

          // On past it, the arrows select again.
          await userEvent.keyboard('{ArrowDown}');
          expect(gamma).toHaveFocus();
          expect(onChange).toHaveBeenCalledWith('c');
        },
      );
    });

    // Only the arrow keys are held back: a form reset restores the default
    // even while focus rests on the disabled radio that holds it.
    it('lets a form reset select a disabled default that has focus', async () => {
      const onChange = vi.fn();

      renderWithRoot(
        <form>
          <Radio.Group label="Group" defaultValue="b" onChange={onChange}>
            <Radio value="a">Alpha</Radio>
            <Radio isDisabled value="b" tooltip="Not on this plan">
              Beta
            </Radio>
          </Radio.Group>
        </form>,
      );

      const [alpha, beta] = screen.getAllByRole('radio');

      await userEvent.click(alpha);
      await userEvent.keyboard('{ArrowDown}');
      expect(beta).toHaveFocus();
      expect(alpha).toBeChecked();

      act(() => beta.closest('form')!.reset());

      expect(beta).toBeChecked();
      expect(onChange).toHaveBeenLastCalledWith('b');
    });

    // A click does not move focus in every browser (Safari): focus can stay on
    // another group's disabled radio that has the clicked radio's value.
    it.each(GROUPS)(
      "lets a click select in one %s group while focus rests on another group's disabled radio",
      async (_, Group) => {
        const onChange = vi.fn();

        renderWithRoot(
          <>
            <Group isDisabled aria-label="First">
              <Options tooltip="Not on this plan" />
            </Group>
            <Group aria-label="Second" onChange={onChange}>
              <Options />
            </Group>
          </>,
        );

        const radios = screen.getAllByRole('radio');

        act(() => radios[0].focus());
        fireEvent.click(radios[3]);

        expect(radios[0]).toHaveFocus();
        expect(onChange).toHaveBeenCalledWith('a');
        expect(radios[3]).toBeChecked();
      },
    );

    it.each(GROUPS)(
      'leaves a disabled %s radio without a tooltip natively disabled',
      async (_, Group) => {
        renderWithRoot(
          <>
            <Group isDisabled aria-label="Group">
              <Options />
            </Group>
            <button type="button">After</button>
          </>,
        );

        for (const radio of screen.getAllByRole('radio')) {
          expect(radio).toHaveAttribute('disabled');
        }

        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      },
    );
  });

  // Without a visible label `wrapWithField` renders no field wrapper, which is
  // where the group's role, name, arrow keys and focus handling used to go.
  describe('group without a visible label', () => {
    const GROUPS = [
      ['button', Radio.ButtonGroup, 'horizontal'],
      ['classic', Radio.Group, 'vertical'],
      ['tabs', Radio.Tabs, 'horizontal'],
    ] as const;

    it.each(GROUPS)(
      'is a %s radiogroup named by its aria-label',
      (_, Group, orientation) => {
        renderWithRoot(
          <Group aria-label="Plan">
            <Options />
          </Group>,
        );

        const group = screen.getByRole('radiogroup', { name: 'Plan' });

        expect(group).toHaveAttribute('aria-orientation', orientation);
        expect(group).toHaveAttribute('data-input-type', 'radiogroup');
        expect(within(group).getAllByRole('radio')).toHaveLength(3);
      },
    );

    it('keeps the role on the group when a label adds a field', () => {
      renderWithRoot(
        <Radio.Group label="Plan" description="Billed monthly">
          <Radio value="a">Alpha</Radio>
        </Radio.Group>,
      );

      expect(screen.getByRole('radiogroup', { name: 'Plan' })).toHaveAttribute(
        'data-input-type',
        'radiogroup',
      );
    });

    it.each(GROUPS)(
      'tells a %s group when focus enters and leaves it',
      async (_, Group) => {
        const onFocus = vi.fn();
        const onBlur = vi.fn();

        renderWithRoot(
          <>
            <Group aria-label="Plan" onFocus={onFocus} onBlur={onBlur}>
              <Options />
            </Group>
            <button type="button">After</button>
          </>,
        );

        await userEvent.tab();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();

        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
      },
    );

    // With nothing selected, Tab enters the group at either end, as React Aria
    // resets the group's tab stop when focus leaves it.
    it.each(GROUPS)(
      'lets Shift+Tab enter an unselected %s group at its last radio',
      async (_, Group) => {
        renderWithRoot(
          <>
            <Group aria-label="Plan">
              <Options />
            </Group>
            <button type="button">After</button>
          </>,
        );

        const [alpha, , gamma] = screen.getAllByRole('radio');

        await userEvent.tab();
        expect(alpha).toHaveFocus();

        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();

        await userEvent.tab({ shift: true });
        expect(gamma).toHaveFocus();
      },
    );
  });

  // The native input is not label content. Handed to `Item` as a child, it made
  // every button radio's label a non-string, which silently disabled the
  // string-only `Item` features and gave an icon-only radio an empty `Label`.
  // `labelRef` used to reach only a button radio's `Item`: a classic radio
  // dropped it.
  it.each([
    ['button', Radio.ButtonGroup],
    ['classic', Radio.Group],
  ])('points labelRef at the label of a %s radio', (_, Group) => {
    const labelRef = createRef<HTMLElement>();

    renderWithRoot(
      <Group aria-label="Group">
        <Radio value="a" labelRef={labelRef}>
          Alpha
        </Radio>
      </Group>,
    );

    expect(labelRef.current).toHaveTextContent('Alpha');
    expect(labelRef.current?.querySelector('input')).toBeNull();
  });

  describe('button radio label', () => {
    it('keeps the native input out of the label', () => {
      renderWithRoot(
        <Radio.ButtonGroup aria-label="Group">
          <Radio.Button value="a">Alpha</Radio.Button>
        </Radio.ButtonGroup>,
      );

      const button = screen.getByTestId('RadioButton');
      const label = button.querySelector('[data-element="Label"]');

      expect(label).toHaveTextContent('Alpha');
      expect(label?.querySelector('input')).toBeNull();
      expect(button).toContainElement(screen.getByRole('radio'));
    });

    it('renders no label for an icon-only radio', () => {
      renderWithRoot(
        <Radio.ButtonGroup aria-label="Group">
          <Radio.Button value="a" icon={<CheckIcon />} aria-label="Yes" />
        </Radio.ButtonGroup>,
      );

      const button = screen.getByTestId('RadioButton');

      expect(button).not.toHaveAttribute('data-has-label');
      expect(button.querySelector('[data-element="Label"]')).toBeNull();
      expect(screen.getByRole('radio', { name: 'Yes' })).toBeInTheDocument();
    });

    it('highlights a match in a string label', () => {
      renderWithRoot(
        <Radio.ButtonGroup aria-label="Group">
          <Radio.Button value="a" highlight="lph">
            Alpha
          </Radio.Button>
        </Radio.ButtonGroup>,
      );

      expect(
        screen.getByTestId('RadioButton').querySelector('mark'),
      ).toHaveTextContent('lph');
    });

    it('still selects on click and keeps its accessible name', async () => {
      renderWithRoot(
        <Radio.ButtonGroup aria-label="Group">
          <Radio.Button value="a">Alpha</Radio.Button>
          <Radio.Button value="b">Beta</Radio.Button>
        </Radio.ButtonGroup>,
      );

      await act(
        async () =>
          await userEvent.click(screen.getAllByTestId('RadioButton')[1]),
      );

      expect(screen.getByRole('radio', { name: 'Beta' })).toBeChecked();
    });
  });

  it('clears a controlled value set to null and stays controlled', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = renderWithRoot(
      <Radio.Group aria-label="Group" value="b" onChange={() => {}}>
        <Options />
      </Radio.Group>,
    );

    expect(screen.getByRole('radio', { name: 'Beta' })).toBeChecked();

    rerender(
      <Radio.Group aria-label="Group" value={null} onChange={() => {}}>
        <Options />
      </Radio.Group>,
    );

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).not.toBeChecked();
    }

    // Still controlled: a click reports the choice but the value stays empty.
    await userEvent.click(screen.getByRole('radio', { name: 'Alpha' }));

    expect(screen.getByRole('radio', { name: 'Alpha' })).not.toBeChecked();
    expect(warn).not.toHaveBeenCalledWith(
      expect.stringMatching(/controlled to uncontrolled/),
    );

    warn.mockRestore();
  });

  it("Radio shouldn't work without <RadioGroup />", () => {
    const inst = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderWithRoot(<Radio value="test">test</Radio>);
    }).toThrowError();

    inst.mockRestore();
  });

  it('lets a null in labelStyles remove the label default', () => {
    const { getByTestId } = renderWithRoot(
      <div style={{ color: 'rgb(1, 2, 3)' }}>
        <Radio.Group aria-label="Options" defaultValue="a">
          <Radio value="a" labelStyles={{ color: null }}>
            A
          </Radio>
        </Radio.Group>
      </div>,
    );

    expect(getComputedStyle(getByTestId('RadioLabel')).color).toBe(
      'rgb(1, 2, 3)',
    );
  });
});
