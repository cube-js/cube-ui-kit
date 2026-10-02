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
