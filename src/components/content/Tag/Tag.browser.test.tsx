import { IconCoin } from '@tabler/icons-react';

import { renderWithRoot, screen } from '../../../test';

import { Tag } from './Tag';

const LONG_LABEL = 'quarterly-revenue-report-final-v2.csv';

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

/**
 * Item's label column can shrink to 0, but a border-box label can't shrink below its end padding,
 * so at full squeeze a sliver of the first letter paints in that padding. Tag used to centre that
 * box on the 0-wide column: half over the icon, half past the edge (CUB-6412). Only a real engine
 * lays this out.
 */
describe('Tag squeezed below its label', () => {
  it.each(['inline', 'small', 'medium'] as const)(
    'keeps the label off the icon at size %s and clips what passes the edge',
    async (size) => {
      renderWithRoot(
        <div style={{ display: 'flex', width: 0 }}>
          <Tag qa="Squeezed" size={size} icon={<IconCoin />}>
            {LONG_LABEL}
          </Tag>
        </div>,
      );

      await screen.findByTestId('Squeezed');

      const { tag, iconRect, labelRect } = parts('Squeezed');

      expect(labelRect.left).toBeGreaterThanOrEqual(iconRect.right - 0.5);
      // The end-padding box still overflows the Tag; only the Tag's clip keeps it from painting.
      expect(getComputedStyle(tag).overflowX).toBe('clip');
    },
  );

  it.each(['inline', 'small', 'medium'] as const)(
    'starts a cut label right after the icon at size %s',
    async (size) => {
      renderWithRoot(
        <div style={{ display: 'flex', width: 90 }}>
          <Tag qa="Cut" size={size} icon={<IconCoin />}>
            {LONG_LABEL}
          </Tag>
        </div>,
      );

      await screen.findByTestId('Cut');

      const { tag, label, tagRect, iconRect, labelRect } = parts('Cut');

      expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
      expect(labelRect.left).toBeCloseTo(iconRect.right, 0);
      // Inside the clip edge, so the clip never cuts the ellipsis.
      expect(labelRect.right).toBeLessThanOrEqual(
        tagRect.right - tag.clientLeft + 0.5,
      );
    },
  );

  it.each(['inline', 'small', 'medium'] as const)(
    'keeps a label that fits where it was at size %s',
    async (size) => {
      renderWithRoot(
        <Tag
          qa="Wide"
          size={size}
          icon={<IconCoin />}
          styles={{ width: '25x' }}
        >
          Fits
        </Tag>,
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

  it('does not clip the close button of a squeezed closable Tag', async () => {
    renderWithRoot(
      <div style={{ display: 'flex', width: 0 }}>
        <Tag isClosable qa="Closable" size="small" icon={<IconCoin />}>
          {LONG_LABEL}
        </Tag>
      </div>,
    );

    await screen.findByTestId('Closable');

    const { tag, tagRect, iconRect, labelRect } = parts('Closable');
    const close = screen.getByRole('button').getBoundingClientRect();

    expect(labelRect.left).toBeGreaterThanOrEqual(iconRect.right - 0.5);
    // At its minimum the close button sits past the Tag's edge, so a clip would hide it.
    expect(close.left).toBeGreaterThanOrEqual(tagRect.right - 0.5);
    expect(getComputedStyle(tag).overflowX).toBe('visible');
  });
});
