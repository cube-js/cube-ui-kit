import { createRef } from 'react';

import { CheckIcon } from '../../../icons/CheckIcon';
import {
  act,
  hoverWithPointer,
  renderWithForm,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test';

import { Radio } from './Radio';

vi.mock('../../../_internal/hooks/use-warn');

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

  it("Radio shouldn't work without <RadioGroup />", () => {
    const inst = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderWithRoot(<Radio value="test">test</Radio>);
    }).toThrowError();

    inst.mockRestore();
  });
});
