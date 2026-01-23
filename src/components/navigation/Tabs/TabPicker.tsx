import { Key } from 'react-aria';

import { MoreIcon, TrashIcon } from '../../../icons';
import { ItemAction } from '../../actions/ItemAction';
import { FilterPicker } from '../../fields/FilterPicker/FilterPicker';

import type { MouseEvent } from 'react';
import type { ParsedTab } from './types';

// =============================================================================
// Types
// =============================================================================

export interface TabPickerProps {
  /** Ordered list of parsed tabs to display in the picker */
  tabs: ParsedTab[];
  /** Currently selected tab key */
  selectedKey: Key | null;
  /** Callback when a tab is selected from the picker */
  onSelect: (key: Key) => void;
  /** Callback when a tab should be deleted. When provided, shows delete action on items. */
  onDelete?: (key: Key) => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Tab picker component that displays a dropdown menu of all tabs.
 *
 * Used in the Tabs suffix area when tabs overflow to provide quick navigation
 * to any tab without scrolling.
 */
export function TabPicker({
  tabs,
  selectedKey,
  onSelect,
  onDelete,
}: TabPickerProps) {
  const isDeletable = !!onDelete;

  return (
    <FilterPicker
      selectionMode="single"
      selectedKey={selectedKey}
      renderSummary={false}
      icon={<MoreIcon />}
      rightIcon={null}
      shape="sharp"
      type="neutral"
      triggerStyles={{ border: 0 }}
      aria-label="Select tab"
      onSelectionChange={(key) => {
        if (key != null) {
          onSelect(key as Key);
        }
      }}
    >
      {tabs.map((tab) => (
        <FilterPicker.Item
          key={tab.key}
          textValue={
            typeof tab.title === 'string' ? tab.title : String(tab.key)
          }
          showActionsOnHover={isDeletable}
          actions={
            isDeletable ? (
              <ItemAction
                icon={<TrashIcon />}
                theme="danger"
                aria-label="Delete tab"
                onPress={() => {
                  onDelete(tab.key);
                }}
              />
            ) : undefined
          }
        >
          {tab.title}
        </FilterPicker.Item>
      ))}
    </FilterPicker>
  );
}
