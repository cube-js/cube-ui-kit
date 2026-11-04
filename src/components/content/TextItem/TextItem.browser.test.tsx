import { createRef } from 'react';

import { act, renderWithRoot, screen, waitFor } from '../../../test';
import { SlotProvider } from '../../../utils/react/Slots';
import { Text } from '../Text';

import { TextItem, TextItemWithNativeLink } from './TextItem';

import type { Styles } from '@tenphi/tasty';

describe('TextItem appearance and overflow', () => {
  it.each([undefined, 't3'] as const)(
    'retains native text and tooltip through %s preset positioning overrides and resets',
    async (preset) => {
      const label = 'A full record label that exceeds the available width';
      const ref = createRef<HTMLElement>();
      const content = (styles?: Styles) => (
        <div style={{ width: 120, position: 'relative' }}>
          <TextItemWithNativeLink
            ref={ref}
            qa="NativeText"
            preset={preset}
            mods={{ hovered: true }}
            nativeLinkProps={{ href: '/records/label' }}
            tooltip={{ auto: true, isOpen: true }}
            styles={styles}
          >
            {label}
          </TextItemWithNativeLink>
        </div>
      );
      const { rerender } = renderWithRoot(content());
      await waitFor(() =>
        expect(screen.getByRole('tooltip').textContent).toBe(label),
      );
      const owner = screen.getByTestId('NativeText');
      const nativeTarget = owner.querySelector('a')!;
      expect(owner.scrollWidth).toBeGreaterThan(owner.clientWidth);

      const appearances: Array<{
        styles?: Styles;
        position: string;
        zIndex: string;
      }> = [
        { position: 'relative', zIndex: '1' },
        {
          styles: { position: 'sticky', zIndex: 3 },
          position: 'sticky',
          zIndex: '3',
        },
        {
          styles: { position: null, zIndex: null },
          position: 'static',
          zIndex: 'auto',
        },
        {
          styles: {
            position: { hovered: 'sticky' },
            zIndex: { hovered: 3 },
          },
          position: 'sticky',
          zIndex: '3',
        },
        { position: 'relative', zIndex: '1' },
      ];
      for (const appearance of appearances) {
        rerender(content(appearance.styles));
        await waitFor(() => {
          const computed = getComputedStyle(owner);
          expect(computed.position).toBe(appearance.position);
          expect(computed.zIndex).toBe(appearance.zIndex);
        });
        expect(ref.current).toBe(owner);
        expect(owner.querySelector('a')).toBe(nativeTarget);
        expect(nativeTarget).toHaveAttribute('href', '/records/label');
        expect(nativeTarget).toHaveAttribute('aria-hidden', 'true');
        expect(nativeTarget).toHaveAttribute('tabindex', '-1');
        expect(screen.getByRole('tooltip').textContent).toBe(label);
      }
    },
  );

  it.each(['direct', 'slot'] as const)(
    'rechecks %s font changes even when the observed box does not resize',
    async (mode) => {
      const content = (large: boolean) => {
        const style = { fontSize: large ? 30 : 6, lineHeight: '20px' };
        return (
          <SlotProvider slots={mode === 'slot' ? { text: { style } } : {}}>
            <TextItem
              as="button"
              style={mode === 'direct' ? style : undefined}
              styles={{ width: '80px', height: '20px' }}
              tooltip={{ auto: true, title: 'Full label', isOpen: true }}
            >
              WWWWWWWW
            </TextItem>
          </SlotProvider>
        );
      };
      const { rerender } = renderWithRoot(content(false));
      const settle = async () => {
        await document.fonts.ready;
        await act(
          () =>
            new Promise((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(resolve)),
            ),
        );
      };
      await settle();
      const before = screen.getByRole('button').getBoundingClientRect();
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      expect(screen.getByRole('button').scrollWidth).toBeLessThanOrEqual(
        screen.getByRole('button').clientWidth,
      );

      rerender(content(true));
      const after = screen.getByRole('button').getBoundingClientRect();
      expect(after.width).toBe(before.width);
      expect(after.height).toBe(before.height);
      expect(screen.getByRole('button').scrollWidth).toBeGreaterThan(
        screen.getByRole('button').clientWidth,
      );
      await waitFor(() =>
        expect(screen.getByRole('tooltip')).toHaveTextContent('Full label'),
      );
      await settle();

      rerender(content(false));
      await waitFor(() =>
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument(),
      );
    },
  );

  /**
   * Cloud's build list colours the commit hash apart from its message, so the
   * label is elements rather than text (CUB-7286). A tooltip with a title of
   * its own shows it only while the line is cut off, and follows the width.
   */
  it('shows its own title for an element label only while it is cut off', async () => {
    const title = 'abc12345: Fix the flaky deployment status check';
    const content = (width: string) => (
      <TextItem
        as="button"
        styles={{ width }}
        tooltip={{ title, auto: true, isOpen: true }}
      >
        <Text color="#dark">abc12345:</Text> Fix the flaky deployment status
        check
      </TextItem>
    );
    const settle = () =>
      act(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
    const { rerender } = renderWithRoot(content('600px'));
    await settle();
    const button = screen.getByRole('button');
    expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    rerender(content('80px'));
    await waitFor(() =>
      expect(screen.getByRole('tooltip').textContent).toBe(title),
    );
    expect(screen.getByRole('button').scrollWidth).toBeGreaterThan(
      screen.getByRole('button').clientWidth,
    );

    rerender(content('600px'));
    await waitFor(() =>
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument(),
    );
  });
});
