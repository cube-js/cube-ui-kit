import { createRef } from 'react';

import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';
import { Switch } from '../../fields/Switch';

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
  ])('lets `label` override the name when %s', (_, props) => {
    renderWithRoot(
      <InfoBadge {...props} label="Region docs" tooltip="Where it runs." />,
    );

    expect(screen.getByTestId('InfoBadge')).toHaveAttribute(
      'aria-label',
      'Region docs',
    );
  });

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
});
