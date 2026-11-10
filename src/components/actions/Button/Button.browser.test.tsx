import { Profiler, ReactNode, useState } from 'react';
import { page, userEvent } from 'vitest/browser';

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

describe('<Button /> collapsing', () => {
  const NARROW = '@(bar, w < 400px)';

  /** A named query container, so a `collapseState` condition can read it. */
  function Bar({ width, children }: { width: number; children: ReactNode }) {
    return (
      <div
        data-qa="Bar"
        style={{
          width,
          display: 'flex',
          containerType: 'inline-size',
          containerName: 'bar',
        }}
      >
        {children}
      </div>
    );
  }

  const resizeBar = async (width: number) => {
    screen.getByTestId('Bar').style.width = `${width}px`;
    await settle();
  };

  const isSquare = (element: HTMLElement) => {
    const { width, height } = element.getBoundingClientRect();

    return Math.round(width) === Math.round(height);
  };

  afterEach(async () => {
    // Other specs in this project assume the default 414x896.
    await page.viewport(414, 896);
  });

  it('collapses to its icon in a narrow container, keeping its name', async () => {
    renderWithRoot(
      <Bar width={600}>
        <Button icon={<PlusIcon />} collapseState={NARROW}>
          Add item
        </Button>
      </Bar>,
    );

    await settle();

    const button = screen.getByRole('button', { name: 'Add item' });

    expect(isSquare(button)).toBe(false);

    await resizeBar(300);

    expect(isSquare(button)).toBe(true);
    expect(screen.getByRole('button', { name: 'Add item' })).toBe(button);

    await resizeBar(600);

    expect(isSquare(button)).toBe(false);
  });

  it('shows its label as a tooltip while collapsed to its icon', async () => {
    renderWithRoot(
      <Button icon={<PlusIcon />} isCollapsed>
        Add item
      </Button>,
    );

    await settle();

    const button = screen.getByRole('button', { name: 'Add item' });

    expect(isSquare(button)).toBe(true);

    // React Aria ignores a hover until a pointer move sets the modality.
    await userEvent.hover(document.body);
    await userEvent.hover(button);

    await waitFor(() =>
      expect(screen.getByRole('tooltip')).toHaveTextContent('Add item'),
    );
  });

  it('swaps to its short label while collapsed', async () => {
    const { rerender } = renderWithRoot(
      <Button icon={<PlusIcon />} isCollapsed={false} shortLabel="Add">
        Add new item
      </Button>,
    );

    await settle();

    expect(screen.getByRole('button')).toHaveAccessibleName('Add new item');

    rerender(
      <Button icon={<PlusIcon />} isCollapsed shortLabel="Add">
        Add new item
      </Button>,
    );
    await settle();

    expect(screen.getByRole('button')).toHaveAccessibleName('Add');
  });

  it('collapses on `@mobile` for `collapseState={true}`', async () => {
    renderWithRoot(
      <Button icon={<PlusIcon />} collapseState>
        Add item
      </Button>,
    );

    await page.viewport(1280, 800);
    await settle();

    const button = screen.getByRole('button', { name: 'Add item' });

    expect(isSquare(button)).toBe(false);

    await page.viewport(414, 896);
    await settle();

    expect(isSquare(button)).toBe(true);
  });

  /**
   * A container condition is unknown where no such container is around the
   * button, a dialog portaled out of the page say, and its negation is unknown
   * too. Without fallback floors the button lost its width and label padding.
   */
  it('keeps its own look outside the container its condition names', async () => {
    renderWithRoot(
      <>
        <Button qa="Collapsing" icon={<PlusIcon />} collapseState={NARROW}>
          Add item
        </Button>
        <Button qa="Plain" icon={<PlusIcon />}>
          Add item
        </Button>
      </>,
    );

    await settle();

    const width = (qa: string) =>
      screen.getByTestId(qa).getBoundingClientRect().width;
    const padding = (qa: string) =>
      getComputedStyle(
        screen.getByTestId(qa).querySelector('[data-element="Label"]')!,
      ).paddingRight;

    expect(width('Collapsing')).toBe(width('Plain'));
    expect(padding('Collapsing')).toBe(padding('Plain'));
  });

  it('keeps its node and focus, and renders once per crossing', async () => {
    let renders = 0;

    renderWithRoot(
      <Bar width={600}>
        <Profiler id="collapsing" onRender={() => (renders += 1)}>
          <Button icon={<PlusIcon />} collapseState={NARROW}>
            Add item
          </Button>
        </Profiler>
      </Bar>,
    );

    await settle();

    const button = screen.getByRole('button', { name: 'Add item' });

    await userEvent.keyboard('{Tab}');
    expect(button).toHaveFocus();

    const before = renders;
    const crossings = [300, 600, 300, 600];

    for (const width of crossings) await resizeBar(width);

    expect(screen.getByRole('button', { name: 'Add item' })).toBe(button);
    expect(button).toHaveFocus();
    expect(renders - before).toBeLessThanOrEqual(crossings.length);
  });
});
