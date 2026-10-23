import { IconCoin } from '@tabler/icons-react';

import { renderWithRoot, screen } from '../../../test';
import { Badge } from '../Badge/Badge';

import { Tag } from './Tag';

const LONG_LABEL = 'quarterly-revenue-report-final-v2.csv';

const CASES = [
  ['Tag', 'inline', Tag],
  ['Tag', 'small', Tag],
  ['Tag', 'medium', Tag],
  ['Badge', 'inline', Badge],
  ['Badge', 'small', Badge],
] as const;

function parts(qa: string) {
  const tag = screen.getByTestId(qa);
  const icon = tag.querySelector('[data-element="Icon"]')!;
  const label = tag.querySelector('[data-element="Label"]') as HTMLElement;

  return {
    tag,
    label,
    tagRect: tag.getBoundingClientRect(),
    iconRect: icon.getBoundingClientRect(),
    labelRect: label.getBoundingClientRect(),
  };
}

/** Whether the element clips what overflows it, so nothing past its edge paints. */
function clips(element: HTMLElement) {
  return getComputedStyle(element).overflowX !== 'visible';
}

/**
 * Item's label column can shrink to 0, but a border-box label can't shrink below its end padding,
 * so at full squeeze a sliver of the first letter paints in that padding. Tag and Badge used to
 * centre that box on the 0-wide column: half over the icon, half past the edge (CUB-6412). Only a
 * real engine lays this out.
 */
describe('Tag and Badge squeezed below their label', () => {
  it.each(CASES)(
    '%s at size %s keeps the label off the icon and inside',
    async (_, size, Component) => {
      renderWithRoot(
        <div style={{ display: 'flex', width: 0 }}>
          <Component qa="Squeezed" size={size} icon={<IconCoin />}>
            {LONG_LABEL}
          </Component>
        </div>,
      );

      await screen.findByTestId('Squeezed');

      const { tag, tagRect, iconRect, labelRect } = parts('Squeezed');

      expect(labelRect.left).toBeGreaterThanOrEqual(iconRect.right - 0.5);
      expect(labelRect.right <= tagRect.right + 0.5 || clips(tag)).toBe(true);
    },
  );

  it.each(CASES)(
    '%s at size %s starts a cut label right after the icon',
    async (_, size, Component) => {
      renderWithRoot(
        <div style={{ display: 'flex', width: 90 }}>
          <Component qa="Cut" size={size} icon={<IconCoin />}>
            {LONG_LABEL}
          </Component>
        </div>,
      );

      await screen.findByTestId('Cut');

      const { label, tagRect, iconRect, labelRect } = parts('Cut');

      expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
      expect(getComputedStyle(label).textOverflow).toBe('ellipsis');
      expect(labelRect.left).toBeCloseTo(iconRect.right, 0);
      expect(labelRect.right).toBeLessThanOrEqual(tagRect.right + 0.5);
    },
  );

  it.each(CASES)(
    '%s at size %s keeps a label that fits where it was',
    async (_, size, Component) => {
      renderWithRoot(
        <Component
          qa="Wide"
          size={size}
          icon={<IconCoin />}
          styles={{ width: '200px' }}
        >
          Fits
        </Component>,
      );

      await screen.findByTestId('Wide');

      const { tag, label, iconRect, tagRect } = parts('Wide');
      const range = document.createRange();

      range.selectNodeContents(label);

      const text = range.getBoundingClientRect();
      const paddingRight = parseFloat(getComputedStyle(label).paddingRight);
      const contentRight = tagRect.right - tag.clientLeft - paddingRight;

      // Centred in the label column's content box, as the kit has always placed it.
      expect((text.left + text.right) / 2).toBeCloseTo(
        (iconRect.right + contentRight) / 2,
        0,
      );
    },
  );

  it('keeps a squeezed closable Tag’s close button visible', async () => {
    renderWithRoot(
      <div style={{ display: 'flex', width: 0 }}>
        <Tag isClosable qa="Closable" size="small" icon={<IconCoin />}>
          {LONG_LABEL}
        </Tag>
      </div>,
    );

    await screen.findByTestId('Closable');

    const { tag, iconRect, labelRect } = parts('Closable');

    expect(labelRect.left).toBeGreaterThanOrEqual(iconRect.right - 0.5);
    expect(clips(tag)).toBe(false);
  });
});
