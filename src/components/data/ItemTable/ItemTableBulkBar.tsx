import { tasty } from '@tenphi/tasty';
import { useState } from 'react';

import { useEvent } from '../../../_internal/hooks';
import { useI18n } from '../../../i18n';
import { CloseIcon } from '../../../icons/CloseIcon';
import { Button } from '../../actions';
import { Text } from '../../content/Text';

import { useItemTableChrome } from './ItemTableToolbar';

import type { Styles } from '@tenphi/tasty';
import type { CubeTableBulkAction } from './types';

const BarElement = tasty({
  qa: 'ItemTableBulkBar',
  as: 'div',
  styles: {
    display: 'flex',
    flow: 'row',
    gap: '1x',
    placeItems: 'center',
    boxSizing: 'border-box',

    /**
     * `floating` lifts the bar out of the grid and centres it over the body, so
     * it never changes the table's height — a bar that pushed the rows down
     * would move the very row the user is about to click.
     */
    position: { '': 'static', floating: 'absolute' },
    inset: { '': 'auto', floating: 'auto auto 2x 50%' },
    translate: { '': false, floating: '-50% 0' },
    zIndex: { '': 'auto', floating: 10 },
    // A raised surface rather than an inverted "toast": `#dark` flips to a light
    // colour under the dark theme, which would put white text on a light bar.
    fill: { '': '#clear', floating: '#surface' },
    color: '#surface-text',
    border: { '': false, floating: true },
    radius: { '': 0, floating: '1cr' },
    shadow: { '': false, floating: '0 1x 3x #shadow' },
    padding: { '': 0, floating: '1x 1.5x' },
    width: { '': 'auto', floating: 'max (100% - 4x)' },
  },
});

export interface ItemTableBulkBarProps<T = any> {
  actions: CubeTableBulkAction<T>[];
  /** @default 'floating' */
  placement?: 'floating' | 'toolbar';
  styles?: Styles;
}

/**
 * The action bar shown while rows are selected.
 *
 * Reads the selection from context rather than props, so a consumer rebuilding
 * the toolbar can drop `<ItemTable.BulkBar>` wherever it likes and still have
 * one owner of the selection.
 */
export function ItemTableBulkBar<T = any>(props: ItemTableBulkBarProps<T>) {
  const { actions, placement = 'floating', styles } = props;
  const { t } = useI18n();
  const chrome = useItemTableChrome('ItemTable.BulkBar');
  const { selectedRows, selectedCount, clearSelection } = chrome;

  // Per-action, so one slow request cannot disable the others.
  const [loadingKeys, setLoadingKeys] = useState<Record<string, boolean>>({});

  const run = useEvent(async (action: CubeTableBulkAction<T>) => {
    const setLoading = (value: boolean) =>
      setLoadingKeys((current) => ({ ...current, [action.key]: value }));

    try {
      await action.onAction(selectedRows as T[], { setLoading });

      // Deselecting is the default because the rows an action just deleted or
      // moved are usually gone; an action that only reads keeps the selection
      // by opting out.
      if (action.deselectAfter !== false) clearSelection();
    } finally {
      setLoading(false);
    }
  });

  if (selectedCount === 0) return null;

  return (
    <BarElement
      role="toolbar"
      aria-label={t('itemTable.bulkActions', 'Bulk actions')}
      styles={styles}
      mods={{ floating: placement === 'floating' }}
    >
      <Text nowrap>
        {t('itemTable.selectedCount', '{{count}} selected', {
          count: selectedCount,
        })}
      </Text>

      {actions.map((action) => {
        const isDisabled = action.isDisabled?.(selectedRows as T[]) ?? false;

        return (
          <Button
            key={action.key}
            size="small"
            type={action.type ?? 'outline'}
            theme={action.theme}
            icon={action.icon}
            isDisabled={isDisabled}
            isLoading={loadingKeys[action.key]}
            // The button's own prop rather than a wrapping `TooltipProvider`:
            // that is what lets it stay hoverable while disabled, which is the
            // only state this tooltip is shown in.
            tooltip={
              isDisabled && action.disabledTooltip
                ? action.disabledTooltip
                : undefined
            }
            onPress={() => run(action)}
          >
            {action.label}
          </Button>
        );
      })}

      <Button
        size="small"
        type="clear"
        icon={<CloseIcon />}
        aria-label={t('itemTable.clearSelection', 'Clear selection')}
        onPress={clearSelection}
      />
    </BarElement>
  );
}
