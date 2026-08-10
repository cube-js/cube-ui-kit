import { tasty } from '@tenphi/tasty';

import { useI18n } from '../../../i18n';
import { Text } from '../../content/Text';

import type { ReactNode } from 'react';

const PreviewElement = tasty({
  qa: 'ItemTableDragPreview',
  as: 'div',
  styles: {
    display: 'flex',
    flow: 'row',
    gap: '1x',
    placeItems: 'center',
    padding: '.5x 1x',
    radius: '1cr',
    fill: '#surface',
    color: '#surface-text',
    border: true,
    shadow: '0 1x 3x #shadow',
    preset: 't3',
    // A chip, not a copy of the row: the default browser preview is a snapshot
    // of the source element, which for a full-width table row is a page-wide
    // slab that hides whatever it is being dragged over.
    width: 'max 40x',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});

export interface ItemTableDragPreviewProps<T = any> {
  rows: T[];
  getItemDragInfo: (row: T) => { label: ReactNode; icon?: ReactNode };
}

/**
 * What the cursor drags.
 *
 * One row shows its icon and label. Several show a count — a single chip cannot
 * honestly represent five different rows, and Cloud settled on the same answer.
 */
export function ItemTableDragPreview<T>(props: ItemTableDragPreviewProps<T>) {
  const { rows, getItemDragInfo } = props;
  const { t } = useI18n();

  if (!rows.length) return null;

  if (rows.length > 1) {
    return (
      <PreviewElement>
        <Text>
          {t('itemTable.dragCount', '{{count}} items', { count: rows.length })}
        </Text>
      </PreviewElement>
    );
  }

  const info = getItemDragInfo(rows[0]);

  return (
    <PreviewElement>
      {info.icon}
      <Text>{info.label}</Text>
    </PreviewElement>
  );
}
