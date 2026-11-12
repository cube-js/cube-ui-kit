import {
  renderWithForm,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test';
import { Form } from '../../form/Form';
import { createFormController } from '../../form/Form/modern/controller';

import { ToggleGroup } from './ToggleGroup';

import type { Key } from '@react-types/shared';
import type { ReactNode } from 'react';

vi.mock('../../../_internal/hooks/use-warn');

// Plain functions, not components: the items stay direct children of the
// group, so it reads their React keys.
function options(tooltip?: string) {
  return [
    <ToggleGroup.Item key="bar" tooltip={tooltip}>
      Bar
    </ToggleGroup.Item>,
    <ToggleGroup.Item key="sparkline" tooltip={tooltip}>
      Sparkline
    </ToggleGroup.Item>,
    <ToggleGroup.Item key="none" tooltip={tooltip}>
      None
    </ToggleGroup.Item>,
  ];
}

function format(tooltip?: string) {
  return [
    <ToggleGroup.Item key="bold">Bold</ToggleGroup.Item>,
    <ToggleGroup.Item key="italic">Italic</ToggleGroup.Item>,
    <ToggleGroup.Item key="underline" isDisabled tooltip={tooltip}>
      Underline
    </ToggleGroup.Item>,
  ];
}

describe('<ToggleGroup />', () => {
  describe('single selection', () => {
    it('is a radiogroup of radios named by its label', () => {
      renderWithRoot(
        <ToggleGroup label="Display" defaultSelectedKey="bar">
          {options()}
        </ToggleGroup>,
      );

      const group = screen.getByRole('radiogroup', { name: 'Display' });
      const [bar, sparkline] = screen.getAllByRole('radio');

      expect(group).toBeInTheDocument();
      expect(bar).toBeChecked();
      expect(sparkline).not.toBeChecked();
      // A radio states its selection with `aria-checked` alone.
      expect(bar).not.toHaveAttribute('aria-selected');
      expect(bar).not.toHaveAttribute('aria-pressed');
    });

    it('selects another item and clears the selected one when pressed again', async () => {
      const onSelectionChange = vi.fn();

      renderWithRoot(
        <ToggleGroup
          aria-label="Display"
          defaultSelectedKey="bar"
          onSelectionChange={onSelectionChange}
        >
          {options()}
        </ToggleGroup>,
      );

      const [bar, sparkline] = screen.getAllByRole('radio');

      await userEvent.click(sparkline);
      expect(sparkline).toBeChecked();
      expect(bar).not.toBeChecked();
      expect(onSelectionChange).toHaveBeenLastCalledWith('sparkline');

      await userEvent.click(sparkline);
      expect(sparkline).not.toBeChecked();
      expect(onSelectionChange).toHaveBeenLastCalledWith(null);
    });

    it('follows a controlled selectedKey, null included', async () => {
      const onSelectionChange = vi.fn();
      const { rerender } = renderWithRoot(
        <ToggleGroup
          aria-label="Display"
          selectedKey="bar"
          onSelectionChange={onSelectionChange}
        >
          {options()}
        </ToggleGroup>,
      );

      const [bar, sparkline] = screen.getAllByRole('radio');

      await userEvent.click(sparkline);
      expect(onSelectionChange).toHaveBeenLastCalledWith('sparkline');
      expect(bar).toBeChecked();

      rerender(
        <ToggleGroup
          aria-label="Display"
          selectedKey={null}
          onSelectionChange={onSelectionChange}
        >
          {options()}
        </ToggleGroup>,
      );

      for (const radio of screen.getAllByRole('radio')) {
        expect(radio).not.toBeChecked();
      }
    });
  });

  describe('multiple selection', () => {
    it('is a toolbar of toggle buttons', () => {
      renderWithRoot(
        <ToggleGroup
          label="Format"
          selectionMode="multiple"
          defaultSelectedKeys={['italic']}
        >
          {format()}
        </ToggleGroup>,
      );

      expect(
        screen.getByRole('toolbar', { name: 'Format' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
      expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    it('toggles each item on its own', async () => {
      const onSelectionChange = vi.fn();

      renderWithRoot(
        <ToggleGroup
          aria-label="Format"
          selectionMode="multiple"
          defaultSelectedKeys={['italic']}
          onSelectionChange={onSelectionChange}
        >
          {format()}
        </ToggleGroup>,
      );

      const bold = screen.getByRole('button', { name: 'Bold' });
      const italic = screen.getByRole('button', { name: 'Italic' });

      await userEvent.click(bold);
      expect(onSelectionChange).toHaveBeenLastCalledWith(['italic', 'bold']);
      expect(bold).toHaveAttribute('aria-pressed', 'true');

      await userEvent.click(italic);
      expect(onSelectionChange).toHaveBeenLastCalledWith(['bold']);
      expect(italic).toHaveAttribute('aria-pressed', 'false');
    });

    it('follows controlled selectedKeys', async () => {
      const onSelectionChange = vi.fn();

      renderWithRoot(
        <ToggleGroup
          aria-label="Format"
          selectionMode="multiple"
          selectedKeys={['bold']}
          onSelectionChange={onSelectionChange}
        >
          {format()}
        </ToggleGroup>,
      );

      await userEvent.click(screen.getByRole('button', { name: 'Italic' }));

      expect(onSelectionChange).toHaveBeenLastCalledWith(['bold', 'italic']);
      expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });
  });

  describe('keyboard', () => {
    it.each([
      ['single', 'radio'],
      ['multiple', 'button'],
    ] as const)(
      'moves focus with the arrow keys and toggles with Space and Enter (%s)',
      async (selectionMode, role) => {
        renderWithRoot(
          <ToggleGroup aria-label="Group" selectionMode={selectionMode}>
            {options()}
          </ToggleGroup>,
        );

        const [bar, sparkline] = screen.getAllByRole(role);
        const isOn = (element: HTMLElement) =>
          element.getAttribute(
            role === 'radio' ? 'aria-checked' : 'aria-pressed',
          ) === 'true';

        await userEvent.tab();
        expect(bar).toHaveFocus();

        await userEvent.keyboard('{ArrowRight}');
        expect(sparkline).toHaveFocus();
        expect(isOn(sparkline)).toBe(false);

        await userEvent.keyboard(' ');
        expect(isOn(sparkline)).toBe(true);

        await userEvent.keyboard('{Enter}');
        expect(isOn(sparkline)).toBe(false);

        await userEvent.keyboard('{ArrowLeft}');
        expect(bar).toHaveFocus();
      },
    );

    // Tab leaving the group is in `joined.browser.test.tsx`: React Aria moves
    // focus to the last item on keydown and lets the browser go on from there,
    // which user-event's simulated Tab doesn't follow.
  });

  describe('disabled', () => {
    it('disables every item with the group', async () => {
      const onSelectionChange = vi.fn();

      renderWithRoot(
        <ToggleGroup
          isDisabled
          aria-label="Display"
          onSelectionChange={onSelectionChange}
        >
          {options()}
        </ToggleGroup>,
      );

      for (const radio of screen.getAllByRole('radio')) {
        expect(radio).toBeDisabled();
        await userEvent.click(radio);
      }

      expect(onSelectionChange).not.toHaveBeenCalled();
    });

    it('skips a disabled item without a tooltip with the arrow keys', async () => {
      renderWithRoot(
        <ToggleGroup aria-label="Format" selectionMode="multiple">
          <ToggleGroup.Item key="bold">Bold</ToggleGroup.Item>
          <ToggleGroup.Item key="italic" isDisabled>
            Italic
          </ToggleGroup.Item>
          <ToggleGroup.Item key="underline">Underline</ToggleGroup.Item>
        </ToggleGroup>,
      );

      await userEvent.tab();
      await userEvent.keyboard('{ArrowRight}');

      expect(screen.getByRole('button', { name: 'Underline' })).toHaveFocus();
    });

    // As a disabled `Radio.Button` does (CUB-5387): the tooltip is usually
    // the reason it is disabled, and focus is how the keyboard opens it.
    it('keeps a disabled item with a tooltip focusable and opens its tooltip on focus', async () => {
      const onSelectionChange = vi.fn();

      renderWithRoot(
        <ToggleGroup
          aria-label="Format"
          selectionMode="multiple"
          onSelectionChange={onSelectionChange}
        >
          {format('Not for this column')}
        </ToggleGroup>,
      );

      const underline = screen.getByRole('button', { name: 'Underline' });

      await userEvent.tab();
      await userEvent.keyboard('{ArrowRight}{ArrowRight}');

      expect(underline).toHaveFocus();
      expect(underline).not.toHaveAttribute('disabled');
      expect(underline).toHaveAttribute('aria-disabled', 'true');
      expect(await screen.findByRole('tooltip')).toHaveTextContent(
        'Not for this column',
      );

      await userEvent.keyboard(' ');
      await userEvent.keyboard('{Enter}');
      await userEvent.click(underline);

      expect(underline).toHaveAttribute('aria-pressed', 'false');
      expect(onSelectionChange).not.toHaveBeenCalled();
    });
  });

  it('keeps its selection when read-only', async () => {
    const onSelectionChange = vi.fn();

    renderWithRoot(
      <ToggleGroup
        isReadOnly
        aria-label="Display"
        defaultSelectedKey="bar"
        onSelectionChange={onSelectionChange}
      >
        {options()}
      </ToggleGroup>,
    );

    const [bar, sparkline] = screen.getAllByRole('radio');

    await userEvent.click(sparkline);
    await userEvent.click(bar);

    expect(bar).toBeChecked();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  describe('item keys', () => {
    function Wrapped({ id, children }: { id: Key; children: ReactNode }) {
      return <ToggleGroup.Item id={id}>{children}</ToggleGroup.Item>;
    }

    it('takes an explicit id, for an item inside a wrapper or a number key', async () => {
      const onSelectionChange = vi.fn();

      renderWithRoot(
        <ToggleGroup
          aria-label="Width"
          selectionMode="multiple"
          defaultSelectedKeys={[1]}
          onSelectionChange={onSelectionChange}
        >
          <Wrapped id={1}>One</Wrapped>
          <Wrapped id={2}>Two</Wrapped>
        </ToggleGroup>,
      );

      expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );

      await userEvent.click(screen.getByRole('button', { name: 'Two' }));

      expect(onSelectionChange).toHaveBeenLastCalledWith([1, 2]);
    });

    it('takes the keys of a mapped list, and never puts them on the DOM', () => {
      renderWithRoot(
        <ToggleGroup aria-label="Display" defaultSelectedKey="sparkline">
          {['bar', 'sparkline'].map((value) => (
            <ToggleGroup.Item key={value}>{value}</ToggleGroup.Item>
          ))}
        </ToggleGroup>,
      );

      const [bar, sparkline] = screen.getAllByRole('radio');

      expect(sparkline).toBeChecked();
      expect(bar).not.toHaveAttribute('id');
    });
  });

  describe('validation', () => {
    it('marks the radiogroup and themes the items when invalid', () => {
      renderWithRoot(
        <ToggleGroup isInvalid aria-label="Display">
          {options()}
        </ToggleGroup>,
      );

      expect(screen.getByRole('radiogroup')).toHaveAttribute(
        'aria-invalid',
        'true',
      );

      for (const radio of screen.getAllByRole('radio')) {
        expect(radio).toHaveAttribute('data-theme', 'danger');
      }
    });

    it('describes the group with its description and error', () => {
      renderWithRoot(
        <ToggleGroup
          label="Display"
          description="How the column draws its value"
          errorMessage="Pick a display"
          isInvalid
        >
          {options()}
        </ToggleGroup>,
      );

      expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription(
        'How the column draws its value Pick a display',
      );
    });
  });

  describe('form', () => {
    it('binds a single selection to a key or null (legacy form)', async () => {
      const { formInstance } = renderWithForm(
        <ToggleGroup name="display" label="Display">
          {options()}
        </ToggleGroup>,
      );

      const [, sparkline] = screen.getAllByRole('radio');

      await userEvent.click(sparkline);
      expect(formInstance.getFieldValue('display')).toBe('sparkline');

      await userEvent.click(sparkline);
      expect(formInstance.getFieldValue('display')).toBeNull();
    });

    it('binds a multiple selection to an array (modern form)', async () => {
      const form = createFormController({
        defaultValues: { format: ['bold'] as Key[] | null },
      });

      renderWithRoot(
        <Form form={form}>
          <ToggleGroup name="format" label="Format" selectionMode="multiple">
            {format()}
          </ToggleGroup>
        </Form>,
      );

      expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );

      await userEvent.click(screen.getByRole('button', { name: 'Italic' }));

      await waitFor(() =>
        expect(form.getValues().format).toEqual(['bold', 'italic']),
      );
    });

    it('shows a null multiple value as nothing selected, and keeps the null', () => {
      const form = createFormController({
        defaultValues: { format: null as Key[] | null },
      });

      renderWithRoot(
        <Form form={form}>
          <ToggleGroup name="format" label="Format" selectionMode="multiple">
            {format()}
          </ToggleGroup>
        </Form>,
      );

      expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
      expect(form.getValues().format).toBeNull();
    });
  });

  it('throws when an item is rendered outside a group', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() =>
      renderWithRoot(<ToggleGroup.Item key="bar">Bar</ToggleGroup.Item>),
    ).toThrow('ToggleGroup.Item is used outside a ToggleGroup');
  });
});
