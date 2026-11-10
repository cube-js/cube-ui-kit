import { Profiler, useState } from 'react';
import { userEvent } from 'vitest/browser';

import { PlusIcon } from '../../../icons/PlusIcon';
import { act, renderWithRoot, screen, waitFor } from '../../../test';
import { ButtonSplit } from '../ButtonSplit/ButtonSplit';

import { Button } from './Button';

const LONG_LABEL = 'A label far too long to ever fit inside this narrow box';

/** Lets the auto tooltip's queued overflow check and its commit run. */
function settle() {
  return act(async () => {
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
}

describe('<Button /> shape', () => {
  const radius = (qa: string) =>
    getComputedStyle(screen.getByTestId(qa)).borderTopLeftRadius;

  it('sets the corner radius each shape names', () => {
    renderWithRoot(
      <>
        <Button qa="Default">Default</Button>
        <Button qa="ButtonShape" shape="button">
          Button
        </Button>
        <Button qa="Card" shape="card">
          Card
        </Button>
        <Button qa="Sharp" shape="sharp">
          Sharp
        </Button>
        <Button qa="Pill" shape="pill">
          Pill
        </Button>
      </>,
    );

    const base = parseFloat(radius('Default'));

    expect(base).toBeGreaterThan(0);
    expect(radius('ButtonShape')).toBe(radius('Default'));
    expect(parseFloat(radius('Card'))).toBeGreaterThan(base);
    expect(radius('Sharp')).toBe('0px');
    // `round` is a radius no button height reaches, so the ends are half-circles.
    expect(parseFloat(radius('Pill'))).toBeGreaterThanOrEqual(
      screen.getByTestId('Pill').offsetHeight / 2,
    );
  });

  it('leaves a link and the joined edges of a split their own radius', () => {
    renderWithRoot(
      <>
        <Button qa="Link" type="link" shape="pill">
          Link
        </Button>
        <ButtonSplit>
          <Button qa="First" shape="pill">
            First
          </Button>
          <Button qa="Last" shape="pill">
            Last
          </Button>
        </ButtonSplit>
      </>,
    );

    expect(radius('Link')).toBe('0px');
    expect(
      getComputedStyle(screen.getByTestId('First')).borderTopRightRadius,
    ).toBe('0px');
    expect(radius('Last')).toBe('0px');
  });
});

describe('<Button /> disabled focusability', () => {
  /**
   * A truncated label turns the automatic tooltip on, and an active tooltip
   * used to keep a disabled button focusable. The same button was then a Tab
   * stop in a narrow window and skipped in a wide one.
   */
  it('stays natively disabled whether or not its label is truncated', async () => {
    const content = (width: number) => (
      <div style={{ width }}>
        <Button isDisabled>{LONG_LABEL}</Button>
      </div>
    );
    const { rerender } = renderWithRoot(content(80));

    await settle();

    const label = screen
      .getByRole('button')
      .querySelector('[data-element="Label"]') as HTMLElement;

    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    expect(screen.getByRole('button')).toBeDisabled();

    rerender(content(1000));
    await settle();

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('keeps an explicit tooltip reachable while disabled', async () => {
    renderWithRoot(
      <Button isDisabled tooltip="Not enough permissions">
        Save
      </Button>,
    );

    await userEvent.keyboard('{Tab}');

    expect(screen.getByRole('button')).toHaveFocus();
    await waitFor(() =>
      expect(screen.getByRole('tooltip')).toHaveTextContent(
        'Not enough permissions',
      ),
    );
  });

  /**
   * `isLoading` used to set the native `disabled` attribute, which drops
   * focus to the page the moment a keyboard press starts the work.
   */
  it('keeps focus when a keyboard press starts loading', async () => {
    function Save() {
      const [isLoading, setIsLoading] = useState(false);

      return (
        <Button isLoading={isLoading} onPress={() => setIsLoading(true)}>
          Save
        </Button>
      );
    }

    renderWithRoot(<Save />);

    await userEvent.keyboard('{Tab}');
    await userEvent.keyboard('{Enter}');
    await settle();

    const button = screen.getByRole('button', { name: 'Save' });

    expect(button).toHaveAttribute('data-loading');
    expect(document.activeElement).toBe(button);
  });
});

describe('<Button /> label truncation', () => {
  const resize = async (width: number) => {
    screen.getByTestId('Box').style.width = `${width}px`;
    await settle();
  };

  /**
   * Turning the automatic tooltip on used to wrap the button in
   * `TooltipProvider`, and turning it off unwrapped it. Either change replaced
   * the `<button>` node, so a focused button whose label started or stopped
   * truncating dropped its focus to the page.
   */
  it('keeps its node and focus when its label starts and stops truncating', async () => {
    renderWithRoot(
      <div data-qa="Box" style={{ width: 1000 }}>
        <Button>{LONG_LABEL}</Button>
      </div>,
    );

    await settle();

    const button = screen.getByRole('button');
    const label = button.querySelector('[data-element="Label"]') as HTMLElement;

    await userEvent.keyboard('{Tab}');
    expect(button).toHaveFocus();

    await resize(80);

    expect(screen.getByRole('button')).toBe(button);
    expect(button).toHaveFocus();
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);

    await resize(1000);

    expect(screen.getByRole('button')).toBe(button);
    expect(button).toHaveFocus();
    expect(label.scrollWidth).toBe(label.clientWidth);
  });

  it('renders once per crossing, and never for a label that fits', async () => {
    const renders = { long: 0, short: 0 };

    renderWithRoot(
      <div data-qa="Box" style={{ width: 1000 }}>
        <Profiler id="long" onRender={() => (renders.long += 1)}>
          <Button icon={<PlusIcon />}>{LONG_LABEL}</Button>
        </Profiler>
        <Profiler id="short" onRender={() => (renders.short += 1)}>
          <Button icon={<PlusIcon />}>Save</Button>
        </Profiler>
      </div>,
    );

    await settle();

    const before = { ...renders };
    const crossings = [120, 1000, 120, 1000];

    for (const width of crossings) await resize(width);

    expect(renders.short - before.short).toBe(0);
    expect(renders.long - before.long).toBeLessThanOrEqual(crossings.length);
  });
});
