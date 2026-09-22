import { page } from 'vitest/browser';

import { renderWithRoot, screen, waitFor } from '../../../test';
import { Content } from '../../content/Content';

import { Dialog } from './Dialog';
import { DialogContainer } from './DialogContainer';

/**
 * `Dialog` sizes itself with a three-value tasty shorthand that compiles to
 * `min-width` / `width` / `max-width`. CSS resolves `min-width` AFTER
 * `max-width`, so a floor larger than the ceiling wins and the dialog overflows
 * the viewport it was supposed to fit inside.
 *
 * That is exactly what `$min-dialog-size` used to do: it was computed from
 * `100vw - 2x` while every consumer's max-width uses `100dvw - 8x`, so below
 * ~352px the two crossed over and no dialog in the library fit. The Excel /
 * Sheets task pane is 300-350px wide, which is the whole of its viewport.
 *
 * jsdom cannot see this — it resolves no custom properties and lays nothing out,
 * so the floor-beats-ceiling behaviour is invisible there. It needs a real
 * browser at a real narrow viewport.
 */
describe('Dialog width at a narrow viewport', () => {
  const NARROW = 300;

  afterEach(async () => {
    // Other specs in this project assume the default 414x896.
    await page.viewport(414, 896);
  });

  it('fits inside a 300px viewport instead of overflowing it', async () => {
    await page.viewport(NARROW, 700);

    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <Dialog>
          <Content>Narrow</Content>
        </Dialog>
      </DialogContainer>,
    );

    const dialog = await screen.findByTestId('Dialog');

    await waitFor(() => {
      expect(dialog.getBoundingClientRect().width).toBeGreaterThan(0);
    });

    const width = dialog.getBoundingClientRect().width;
    const styles = getComputedStyle(dialog);

    // The floor must never exceed the ceiling, whatever the viewport.
    expect(parseFloat(styles.minWidth)).toBeLessThanOrEqual(
      parseFloat(styles.maxWidth),
    );

    // …and the rendered dialog therefore stays inside the viewport.
    expect(width).toBeLessThanOrEqual(NARROW);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(NARROW);
  });

  it('is unaffected at a wide viewport', async () => {
    await page.viewport(1280, 900);

    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <Dialog>
          <Content>Wide</Content>
        </Dialog>
      </DialogContainer>,
    );

    const dialog = await screen.findByTestId('Dialog');

    await waitFor(() => {
      expect(dialog.getBoundingClientRect().width).toBeGreaterThan(0);
    });

    // `min(288px, 100dvw - 8x)` still resolves to the 288px branch here, so the
    // floor is the same one the token has always applied away from the crossover.
    expect(parseFloat(getComputedStyle(dialog).minWidth)).toBe(288);
  });
});

/**
 * `Dialog`'s gutters are declared as custom properties on the dialog root, and
 * consumers are documented to read them so one child can span the full dialog
 * width while its siblings keep the gutter (see Dialog.docs.mdx, "Padding
 * Tokens").
 *
 * The failure mode this guards is silent: rename either property, or move the
 * declaration off the dialog root, and the consumer's inset resolves to nothing
 * at all. No error, no visual break in the dialog itself — just a surface
 * somewhere else quietly losing its padding. These assertions turn that into a
 * failing test.
 *
 * jsdom resolves no custom properties, so this has to run in a real browser.
 */
describe('Dialog padding tokens', () => {
  const TOKENS = [
    '--dialog-padding-h',
    '--dialog-content-padding-v',
    '--dialog-title-padding-v',
    '--dialog-footer-v',
  ];

  it('exposes the documented gutters to descendants', async () => {
    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <Dialog>
          <Content qa="TokenProbe">
            {TOKENS.map((token) => (
              <div
                key={token}
                data-qa={token}
                // Consuming the token is the assertion: a custom property read
                // back with `getPropertyValue` returns its unresolved tasty
                // expression, which says nothing about whether it resolves.
                style={{ marginLeft: `var(${token})` }}
              />
            ))}
          </Content>
        </Dialog>
      </DialogContainer>,
    );

    await screen.findByTestId('TokenProbe');

    for (const token of TOKENS) {
      const probe = await screen.findByTestId(token);
      const inset = parseFloat(getComputedStyle(probe).marginLeft);

      expect(
        inset,
        `${token} must resolve to a length inside the dialog`,
      ).toBeGreaterThan(0);
    }
  });

  it('lets a slot take back its horizontal padding without losing the rest', async () => {
    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <Dialog>
          <Content
            qa="EdgeToEdge"
            styles={{ padding: '$dialog-content-padding-v 0' }}
          >
            Edge to edge
          </Content>
        </Dialog>
      </DialogContainer>,
    );

    const content = await screen.findByTestId('EdgeToEdge');
    const styles = getComputedStyle(content);

    expect(parseFloat(styles.paddingLeft)).toBe(0);
    expect(parseFloat(styles.paddingRight)).toBe(0);
    // The vertical padding still comes from the token…
    expect(parseFloat(styles.paddingTop)).toBeGreaterThan(0);
    // …and the slot's own non-padding styles survive the merge.
    expect(styles.flexGrow).toBe('1');
    expect(styles.overflowY).toBe('auto');
  });
});
