import { page } from 'vitest/browser';

import { renderWithRoot, screen, waitFor } from '../../../test';
import { Content } from '../../content/Content';
import { Footer } from '../../content/Footer';
import { TextInput } from '../../fields/TextInput/TextInput';
import { Form } from '../../form/Form/Form';
import { createFormController } from '../../form/Form/modern/controller';

import { Dialog } from './Dialog';
import { DialogContainer } from './DialogContainer';
import { DialogForm } from './DialogForm';

/**
 * A dialog pins its footer and scrolls its body, and both halves of that are
 * layout — so this needs a real browser. jsdom lays nothing out: every
 * `getBoundingClientRect()` is `0 × 0` at the origin and `scrollHeight` equals
 * `clientHeight`, so a build where the footer is pushed off the bottom looks
 * identical to a correct one.
 *
 * Three things are under test (CUB-4920):
 *
 * 1. `DialogForm` renders its actions in a `Footer` beside `Content` rather
 *    than inside it, so they stay put while the body scrolls.
 * 2. `Dialog` hands a DIRECT-CHILD `<form>` its flex context, so the same shape
 *    composed by hand works without the consumer restating
 *    `display:flex / flexGrow:1 / height:'min 0' / gap:0`.
 * 3. The footer draws its top line only while the body scrolls. Whether it
 *    scrolls is layout too, and a line that never tracks it is only visible
 *    here.
 *
 * The fixture is a short dialog with a long body, so `Content` must overflow.
 */

const FIELDS = Array.from({ length: 30 }, (_, i) => i);

function longBody() {
  return FIELDS.map((i) => (
    <TextInput key={i} name={`f${i}`} label={`Field ${i}`} />
  ));
}

/** A box is inside its dialog when its bottom does not fall past the dialog's. */
function isWithin(child: Element, dialog: Element) {
  const c = child.getBoundingClientRect();
  const d = dialog.getBoundingClientRect();

  // 1px of tolerance for sub-pixel rounding on the border.
  return c.bottom <= d.bottom + 1 && c.top >= d.top - 1;
}

/** Whether the footer draws its top line. */
function hasLine(footer: Element) {
  return getComputedStyle(footer).borderTopStyle !== 'none';
}

/**
 * Waits for the dialog to finish opening, then for two more frames so the
 * resize observer has delivered what the transition resized.
 *
 * Every resize re-measures the body. A change made while the dialog is still
 * opening is therefore picked up by the transition's own resizes — including
 * in a build that watches nothing but the body's box — so a "no line yet" or a
 * rerender before this point proves nothing.
 */
async function opened() {
  const modal = await screen.findByTestId('Modal');

  await waitFor(() => {
    expect(modal).toHaveAttribute('data-entered');
  });
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );
}

beforeEach(async () => {
  // Short enough that 30 fields cannot fit, so the body has to scroll.
  await page.viewport(600, 420);
});

afterEach(async () => {
  // Other specs in this project assume the default 414x896.
  await page.viewport(414, 896);
});

describe('DialogForm pins its footer', () => {
  it('keeps the submit button visible while the body scrolls', async () => {
    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <DialogForm title="Long" onSubmit={() => {}}>
          {longBody()}
        </DialogForm>
      </DialogContainer>,
    );

    const dialog = await screen.findByTestId('Dialog');
    const submit = await screen.findByRole('button', { name: 'Submit' });

    await waitFor(() => {
      // The whole point: with the actions inside `Content` they rode the scroll
      // and ended up below the dialog's bottom edge.
      expect(isWithin(submit, dialog)).toBe(true);
    });
  });

  it('gives the body its own scroll rather than growing the dialog', async () => {
    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <DialogForm title="Long" onSubmit={() => {}}>
          {longBody()}
        </DialogForm>
      </DialogContainer>,
    );

    await screen.findByTestId('Dialog');

    const content = screen.getByTestId('Content');

    await waitFor(() => {
      // Overflowing content that cannot shrink reports no scroll at all — the
      // `min-height: 0` half of the fix is what makes this true.
      expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    });
  });

  /**
   * `DialogForm` forks on the controller: a modern one renders
   * `ModernDialogForm`, which is its own JSX tree. The cases above all take the
   * legacy branch (no `form` prop), so the modern one needs saying separately —
   * it is the branch a build could restructure and leave behind.
   */
  it('pins the footer on the modern branch too', async () => {
    const form = createFormController<{ f0: string }>({ defaultValues: {} });

    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <DialogForm form={form} title="Long" onSubmit={() => {}}>
          {longBody()}
        </DialogForm>
      </DialogContainer>,
    );

    const dialog = await screen.findByTestId('Dialog');
    const submit = await screen.findByRole('button', { name: 'Submit' });
    const content = screen.getByTestId('Content');

    await waitFor(() => {
      expect(isWithin(submit, dialog)).toBe(true);
      expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    });
  });

  // The second half of CUB-4920: the same shape composed by hand, with no
  // styles passed on the form at all.
  it('pins a hand-composed Dialog > Form > Content + Footer with no plumbing', async () => {
    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <Dialog>
          <Form>
            <Content>{longBody()}</Content>
            <Footer>
              <button type="button">Pinned</button>
            </Footer>
          </Form>
        </Dialog>
      </DialogContainer>,
    );

    const dialog = await screen.findByTestId('Dialog');
    const pinned = await screen.findByRole('button', { name: 'Pinned' });
    const content = screen.getByTestId('Content');

    await waitFor(() => {
      expect(isWithin(pinned, dialog)).toBe(true);
      expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    });
  });
});

describe('the footer line follows the body', () => {
  function LongOrShort({ long }: { long: boolean }) {
    return (
      <DialogContainer isOpen onDismiss={() => {}}>
        <DialogForm title="Form" onSubmit={() => {}}>
          {long ? longBody() : <TextInput name="only" label="Only field" />}
        </DialogForm>
      </DialogContainer>
    );
  }

  it('draws no line under a body that fits', async () => {
    renderWithRoot(<LongOrShort long={false} />);

    const footer = await screen.findByTestId('Footer');
    const content = screen.getByTestId('Content');

    await opened();

    expect(content.scrollHeight).toBeLessThanOrEqual(content.clientHeight + 2);
    expect(hasLine(footer)).toBe(false);
  });

  it('draws the line once the body scrolls, and drops it when it fits again', async () => {
    const { rerender } = renderWithRoot(<LongOrShort long />);

    const footer = await screen.findByTestId('Footer');

    await waitFor(() => {
      expect(hasLine(footer)).toBe(true);
    });

    rerender(<LongOrShort long={false} />);

    await waitFor(() => {
      expect(hasLine(footer)).toBe(false);
    });
  });

  /**
   * A fixed-height dialog never resizes its body, so the body's own box says
   * nothing about its content. These two pin the two ways the content can
   * still outgrow it: new children, and an existing child growing in place.
   * The first is only visible as a mutation, the second only as a resize of
   * the child.
   *
   * The gutter is reserved so the body's width cannot change either. Where
   * scrollbars take room, one appearing narrows the body, which fires the
   * body's own resize observer and detects the overflow by accident — hiding a
   * build that watches neither children nor mutations. Overlay scrollbars (the
   * macOS default, every touch device) take no room, so there the children
   * are the only signal; a stable gutter makes every platform behave that way.
   */
  function Fixed({ rows, height }: { rows: number; height: number }) {
    return (
      <DialogContainer isOpen type="fullscreen" onDismiss={() => {}}>
        <Dialog>
          <Content style={{ scrollbarGutter: 'stable' }}>
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} style={{ height }} />
            ))}
          </Content>
          <Footer>
            <button type="button">Done</button>
          </Footer>
        </Dialog>
      </DialogContainer>
    );
  }

  it('notices children added to a fixed-height body', async () => {
    const { rerender } = renderWithRoot(<Fixed rows={1} height={40} />);

    const footer = await screen.findByTestId('Footer');

    await opened();

    expect(hasLine(footer)).toBe(false);

    rerender(<Fixed rows={30} height={40} />);

    await waitFor(() => {
      expect(hasLine(footer)).toBe(true);
    });
  });

  it('notices a child growing in place inside a fixed-height body', async () => {
    const { rerender } = renderWithRoot(<Fixed rows={1} height={40} />);

    const footer = await screen.findByTestId('Footer');

    await opened();

    expect(hasLine(footer)).toBe(false);

    rerender(<Fixed rows={1} height={2000} />);

    await waitFor(() => {
      expect(hasLine(footer)).toBe(true);
    });
  });
});
