import { createRef, useState } from 'react';

import { act, renderWithRoot, screen, userEvent, waitFor } from '../../../test';
import { Button } from '../../actions/Button/Button';
import { Switch } from '../../fields/Switch';
import { TextInput } from '../../fields/TextInput/TextInput';
import { Dialog } from '../../overlays/Dialog/Dialog';
import { DialogTrigger } from '../../overlays/Dialog/DialogTrigger';

import { InfoBadge } from './InfoBadge';

describe('<InfoBadge />', () => {
  it('renders a non-interactive badge by default', () => {
    renderWithRoot(<InfoBadge tooltip="Some details" />);

    const badge = screen.getByTestId('InfoBadge');

    expect(badge).toBeInTheDocument();
    expect(badge.tagName).toBe('DIV');
    expect(badge).toHaveAttribute('aria-label', 'Some details');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  /**
   * The name sat on a `div` with no role, which screen readers ignore, and the
   * tooltip opened on hover only, so an `aria-label` that differed from the
   * tooltip hid the tooltip text from keyboard and screen reader users.
   */
  it('exposes a non-interactive badge as a named image', () => {
    renderWithRoot(<InfoBadge tooltip="Some details" />);

    const badge = screen.getByRole('img', { name: 'Some details' });

    expect(badge).toBe(screen.getByTestId('InfoBadge'));
    expect(badge).not.toHaveAttribute('tabindex');
  });

  it('describes a non-interactive badge by its tooltip when named otherwise', () => {
    renderWithRoot(
      <InfoBadge aria-label="3 warnings" tooltip="Two checks failed" />,
    );

    expect(
      screen.getByRole('img', { name: '3 warnings' }),
    ).toHaveAccessibleDescription('Two checks failed');
  });

  it('renders a link when `to` is provided', () => {
    renderWithRoot(<InfoBadge to="!https://docs.cube.dev" tooltip="Docs" />);

    const link = screen.getByRole('link');

    expect(link).toHaveAttribute('href', 'https://docs.cube.dev');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders a button and calls `onPress` when `onPress` is provided', async () => {
    const onPress = vi.fn();

    renderWithRoot(<InfoBadge tooltip="Details" onPress={onPress} />);

    const button = screen.getByRole('button');

    await userEvent.click(button);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('keeps a disabled interactive badge focusable, with its focus ring', async () => {
    const onPress = vi.fn();

    renderWithRoot(
      <InfoBadge isDisabled tooltip="Details" onPress={onPress} />,
    );

    await userEvent.tab();

    const button = screen.getByRole('button');

    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('data-focused');

    await userEvent.keyboard('{Enter}');

    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not propagate presses to a clickable container', async () => {
    const onContainerClick = vi.fn();
    const onPress = vi.fn();

    renderWithRoot(
      <div onClick={onContainerClick}>
        <InfoBadge tooltip="Details" onPress={onPress} />
      </div>,
    );

    await userEvent.click(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onContainerClick).not.toHaveBeenCalled();
  });

  it('does not propagate clicks of a non-interactive badge', async () => {
    const onContainerClick = vi.fn();

    renderWithRoot(
      <div onClick={onContainerClick}>
        <InfoBadge tooltip="Details" />
      </div>,
    );

    await userEvent.click(screen.getByTestId('InfoBadge'));

    expect(onContainerClick).not.toHaveBeenCalled();
  });

  it('does not toggle the field it labels', async () => {
    renderWithRoot(
      <Switch label="Enabled" labelSuffix={<InfoBadge tooltip="Details" />} />,
    );

    const switchInput = screen.getByRole('switch');

    expect(switchInput).not.toBeChecked();

    await userEvent.click(screen.getByTestId('InfoBadge'));

    expect(switchInput).not.toBeChecked();
  });

  it('shows the tooltip on hover', async () => {
    renderWithRoot(<InfoBadge tooltip="Some details" />);

    await userEvent.hover(screen.getByTestId('InfoBadge'));

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('Some details');
    });
  });

  it('appends the learn-more hint to the tooltip when interactive', async () => {
    renderWithRoot(<InfoBadge to="!https://docs.cube.dev" tooltip="Docs" />);

    await userEvent.hover(screen.getByRole('link'));

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent(
        'Docs Click to learn more.',
      );
    });
  });

  it('supports a custom tooltip suffix and opting out', async () => {
    const { unmount } = renderWithRoot(
      <InfoBadge
        to="!https://docs.cube.dev"
        tooltip="Docs"
        tooltipSuffix="Open the guide."
      />,
    );

    await userEvent.hover(screen.getByRole('link'));

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent(
        'Docs Open the guide.',
      );
    });

    unmount();

    renderWithRoot(
      <InfoBadge
        to="!https://docs.cube.dev"
        tooltip="Docs"
        tooltipSuffix={null}
      />,
    );

    await userEvent.hover(screen.getByRole('link'));

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('Docs');
    });
  });

  it('names the badge explicitly when the tooltip is not plain text', () => {
    renderWithRoot(
      <InfoBadge
        tooltip={
          <>
            Rich <b>content</b>
          </>
        }
      />,
    );

    expect(screen.getByTestId('InfoBadge')).toHaveAttribute(
      'aria-label',
      'More information',
    );
  });

  // The name is derived from a plain-string tooltip, so the cases that matter
  // are the ones where the title stays a string: a static badge, or an
  // interactive one whose "learn more" suffix is switched off.
  it.each([
    ['static', {}],
    ['interactive', { to: '!https://docs.cube.dev', tooltipSuffix: null }],
    ['interactive with a suffix', { onPress: () => {} }],
  ])(
    'still lets the deprecated `label` override the name when %s',
    (_, props) => {
      renderWithRoot(
        <InfoBadge {...props} label="Region docs" tooltip="Where it runs." />,
      );

      expect(screen.getByTestId('InfoBadge')).toHaveAttribute(
        'aria-label',
        'Region docs',
      );
    },
  );

  it.each([
    ['static', {}],
    ['interactive', { onPress: () => {}, tooltipSuffix: null }],
    ['interactive with a suffix', { to: '!https://docs.cube.dev' }],
  ])('lets `aria-label` override the name when %s', (_, props) => {
    renderWithRoot(
      <InfoBadge
        {...props}
        aria-label="Region docs"
        tooltip="Where it runs."
      />,
    );

    expect(screen.getByTestId('InfoBadge')).toHaveAttribute(
      'aria-label',
      'Region docs',
    );
  });

  it('accepts a tooltip configuration object', async () => {
    renderWithRoot(
      <InfoBadge tooltip={{ title: 'Configured', placement: 'right' }} />,
    );

    await userEvent.hover(screen.getByTestId('InfoBadge'));

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('Configured');
    });
  });

  it('forwards the ref to the badge element', () => {
    const ref = createRef<HTMLElement>();

    renderWithRoot(<InfoBadge ref={ref} tooltip="Details" />);

    expect(ref.current).toBe(screen.getByTestId('InfoBadge'));
  });

  it('forwards the ref to the badge element when interactive', () => {
    const ref = createRef<HTMLElement>();

    renderWithRoot(
      <InfoBadge ref={ref} to="!https://docs.cube.dev" tooltip="Docs" />,
    );

    expect(ref.current).toBe(screen.getByRole('link'));
  });

  /**
   * React Aria opens a tooltip on mouse hover or on visible focus. Touch has
   * no hover, the badge takes no focus, and a press closes the tooltip, so a
   * tap on a phone opened nothing.
   */
  describe('on touch', () => {
    const tap = (target: Element) =>
      userEvent.pointer({ keys: '[TouchA]', target });

    it('opens the tooltip on a tap', async () => {
      renderWithRoot(<InfoBadge tooltip="Some details" />);

      const badge = screen.getByTestId('InfoBadge');

      await tap(badge);

      const tooltip = await screen.findByRole('tooltip');

      expect(tooltip).toHaveTextContent('Some details');
      expect(badge).toHaveAttribute('aria-describedby', tooltip.id);
    });

    it('closes the tooltip on a second tap', async () => {
      renderWithRoot(<InfoBadge tooltip="Some details" />);

      const badge = screen.getByTestId('InfoBadge');

      await tap(badge);
      await screen.findByRole('tooltip');
      await tap(badge);

      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
      expect(badge).not.toHaveAttribute('aria-describedby');
    });

    it('closes the tooltip on a tap elsewhere', async () => {
      renderWithRoot(
        <>
          <InfoBadge tooltip="Some details" />
          <p>Elsewhere</p>
        </>,
      );

      await tap(screen.getByTestId('InfoBadge'));
      await screen.findByRole('tooltip');
      await tap(screen.getByText('Elsewhere'));

      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('closes the tooltip on Escape', async () => {
      renderWithRoot(<InfoBadge tooltip="Some details" />);

      await tap(screen.getByTestId('InfoBadge'));
      await screen.findByRole('tooltip');
      await userEvent.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('opens the tooltip without toggling the field it labels', async () => {
      renderWithRoot(
        <Switch
          label="Enabled"
          labelSuffix={<InfoBadge tooltip="Details" />}
        />,
      );

      await tap(screen.getByTestId('InfoBadge'));

      expect(await screen.findByRole('tooltip')).toHaveTextContent('Details');
      expect(screen.getByRole('switch')).not.toBeChecked();
    });

    it("reports the tap to the tooltip's `onOpenChange`", async () => {
      const onOpenChange = vi.fn();

      renderWithRoot(
        <InfoBadge tooltip={{ title: 'Configured', onOpenChange }} />,
      );

      await tap(screen.getByTestId('InfoBadge'));

      expect(await screen.findByRole('tooltip')).toHaveTextContent(
        'Configured',
      );
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
    });

    // Hover opens the tooltip for a mouse, and its press closes it.
    it('leaves a mouse click to hover', async () => {
      renderWithRoot(<InfoBadge tooltip="Some details" />);

      await userEvent.click(screen.getByTestId('InfoBadge'), {
        skipHover: true,
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('does not open a disabled tooltip', async () => {
      const onOpenChange = vi.fn();

      renderWithRoot(
        <InfoBadge
          tooltip={{ title: 'Configured', isDisabled: true, onOpenChange }}
        />,
      );

      await tap(screen.getByTestId('InfoBadge'));

      expect(onOpenChange).not.toHaveBeenCalled();
    });

    /**
     * The tooltip a tap opened takes the tap that dismisses it, and it is
     * portaled out of the dialog, so the dialog counted that tap as outside
     * and closed with the form in it.
     */
    it('closes on a tap on the tooltip and keeps the dialog it sits in', async () => {
      const onDialogOpenChange = vi.fn();

      renderWithRoot(
        <DialogTrigger defaultOpen onOpenChange={onDialogOpenChange}>
          <Button>Open</Button>
          <Dialog>
            <TextInput label="Scopes" labelTooltip="Space-separated scopes." />
          </Dialog>
        </DialogTrigger>,
      );

      await tap(await screen.findByTestId('InfoBadge'));
      await tap(await screen.findByRole('tooltip'));

      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
      expect(onDialogOpenChange).not.toHaveBeenCalled();
    });

    it('treats a tooltip the consumer closes and reopens as its own', async () => {
      const onOpenChange = vi.fn();
      let setOpenFromOutside: (isOpen: boolean) => void = () => {};

      function Controlled() {
        const [isOpen, setOpen] = useState(false);

        setOpenFromOutside = setOpen;

        return (
          <>
            <InfoBadge
              tooltip={{
                title: 'Configured',
                isOpen,
                onOpenChange: (open: boolean) => {
                  onOpenChange(open);
                  setOpen(open);
                },
              }}
            />
            <p>Elsewhere</p>
          </>
        );
      }

      renderWithRoot(<Controlled />);

      await tap(screen.getByTestId('InfoBadge'));
      await screen.findByRole('tooltip');

      act(() => setOpenFromOutside(false));
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });

      act(() => setOpenFromOutside(true));
      await screen.findByRole('tooltip');
      onOpenChange.mockClear();
      await userEvent.click(screen.getByText('Elsewhere'));

      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('leaves a tooltip a tap did not open to a click elsewhere', async () => {
      const onOpenChange = vi.fn();

      renderWithRoot(
        <>
          <InfoBadge
            tooltip={{ title: 'Configured', defaultOpen: true, onOpenChange }}
          />
          <p>Elsewhere</p>
        </>,
      );

      await screen.findByRole('tooltip');
      await userEvent.click(screen.getByText('Elsewhere'));

      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });
});
