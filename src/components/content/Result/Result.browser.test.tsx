import { ReactElement } from 'react';

import { renderWithRoot, screen } from '../../../test';
import { Dialog } from '../../overlays/Dialog/Dialog';
import { DialogContainer } from '../../overlays/Dialog/DialogContainer';
import { Content } from '../Content';

import { Result } from './Result';

/**
 * A stacked Result inside a `Dialog` drops its own padding, since the dialog's
 * `Content` already pads it. The padding is `calc(… var(--gap))`, which jsdom
 * does not resolve, so this needs a real browser.
 */

function renderInDialog(result: ReactElement) {
  return renderWithRoot(
    <DialogContainer isOpen onDismiss={() => {}}>
      <Dialog size="S">
        <Content>{result}</Content>
      </Dialog>
    </DialogContainer>,
  );
}

// `@in-dialog` is the Result's own local state; tasty's lint knows only global aliases
const IN_DIALOG_OVERRIDE = { padding: { 'layout=stacked & @in-dialog': '1x' } };

const paddingOf = (qa: string) =>
  getComputedStyle(screen.getByTestId(qa)).paddingTop;

describe('Result in a dialog', () => {
  it('drops the stacked padding inside a dialog', async () => {
    renderInDialog(<Result qa="InDialog" layout="stacked" title="Done" />);

    expect(await screen.findByTestId('InDialog')).toBeInTheDocument();
    expect(paddingOf('InDialog')).toBe('0px');
  });

  it('keeps the stacked padding outside a dialog', () => {
    renderWithRoot(<Result qa="Outside" layout="stacked" title="Done" />);

    expect(paddingOf('Outside')).toBe('12px');
  });

  it('keeps the tight layout padding-free inside a dialog', async () => {
    renderInDialog(<Result qa="TightInDialog" layout="tight" title="Done" />);

    expect(await screen.findByTestId('TightInDialog')).toBeInTheDocument();
    expect(paddingOf('TightInDialog')).toBe('0px');
  });

  it("lets a consumer's styles set the padding inside a dialog", async () => {
    renderInDialog(
      <Result
        qa="Overridden"
        layout="stacked"
        title="Done"
        styles={IN_DIALOG_OVERRIDE}
      />,
    );

    expect(await screen.findByTestId('Overridden')).toBeInTheDocument();
    expect(paddingOf('Overridden')).toBe('8px');
  });
});

/**
 * The tight layout leaves the spacing to `gap`: no padding, no room around the
 * icon and no margin above the content and actions, so a result in a box that
 * clips keeps its actions inside it.
 */
describe('Result tight layout', () => {
  const box = (qa: string, element: string) => {
    const root = screen.getByTestId(qa);
    const node = root.querySelector<HTMLElement>(
      `:scope > [data-element="${element}"]`,
    );

    if (!node) throw new Error(`${qa} has no ${element}`);

    return getComputedStyle(node);
  };

  const renderTight = (props: { gap?: string } = {}) =>
    renderWithRoot(
      <Result
        qa="Tight"
        layout="tight"
        status="error"
        title="Query failed"
        actions={<Result.Action>Retry</Result.Action>}
        {...props}
      >
        Details
      </Result>,
    );

  it('spaces the blocks by a 1x gap alone', () => {
    renderTight();

    const root = getComputedStyle(screen.getByTestId('Tight'));

    expect(root.paddingTop).toBe('0px');
    expect(root.rowGap).toBe('8px');
    expect(box('Tight', 'Icon').paddingTop).toBe('0px');
    expect(box('Tight', 'Content').marginTop).toBe('0px');
    expect(box('Tight', 'Actions').marginTop).toBe('0px');
  });

  it('takes the gap from the gap prop', () => {
    renderTight({ gap: '3x' });

    expect(getComputedStyle(screen.getByTestId('Tight')).rowGap).toBe('24px');
  });

  it('keeps the default room in the default layout', () => {
    renderWithRoot(
      <Result qa="Default" status="error" title="Query failed">
        Details
      </Result>,
    );

    expect(box('Default', 'Icon').paddingTop).toBe('24px');
    expect(box('Default', 'Content').marginTop).toBe('24px');
  });
});

describe('Result width', () => {
  // A flex parent, as `Layout.Center` is, sizes its child by the content
  it('stays inside a container narrower than 80ch', () => {
    renderWithRoot(
      <div
        style={{ display: 'flex', justifyContent: 'center', width: '200px' }}
      >
        <Result qa="Narrow" title="Not found">
          <span style={{ whiteSpace: 'nowrap' }}>
            a/very/long/path/that/cannot/wrap/anywhere/at/all/in/this/box
          </span>
        </Result>
      </div>,
    );

    const result = screen.getByTestId('Narrow');

    expect(result.getBoundingClientRect().width).toBeLessThanOrEqual(200);
  });
});
