import { act, renderWithRoot, screen, waitFor } from '../../../test';
import { SlotProvider } from '../../../utils/react/Slots';

import { TextItem } from './TextItem';

describe('TextItem appearance and overflow', () => {
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
});
