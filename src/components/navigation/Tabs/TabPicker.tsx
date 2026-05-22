import { CloseIcon, MoreIcon } from '../../../icons';
import { ItemAction } from '../../actions/ItemAction';
import { FilterPicker } from '../../fields/FilterPicker/FilterPicker';

import type { Placement } from 'react-aria';
import type { ParsedTab, TabPlacement, TabSize, TabType } from './types';

// =============================================================================
// Types
// =============================================================================

export interface TabPickerProps {
  /** Ordered list of parsed tabs to display in the picker */
  tabs: ParsedTab[];
  /** Currently selected tab key */
  selectedKey: string | null;
  /** Callback when a tab is selected from the picker */
  onSelect: (key: string) => void;
  /** Callback when a tab should be deleted. When provided, shows delete action on items. */
  onDelete?: (key: string) => void;
  /** Size of the picker trigger button */
  size?: TabSize;
  /** Type of the parent Tabs component (for border styling) */
  type?: TabType;
  /** Placement of the parent Tabs component (controls divider + popover placement) */
  placement?: TabPlacement;
  /** Enable drag-and-drop reordering of items in the picker dropdown */
  isReorderable?: boolean;
  /** Callback when items are reordered via drag-and-drop */
  onReorder?: (newOrder: string[]) => void;
}

// Maps the parent Tabs placement to the popover placement of the FilterPicker.
// The popover opens *toward the panel area* (away from the bar's outer edge),
// so it never covers the strip itself. Tooltips are the only thing that opens
// on the outer-edge side; the picker dropdown is a menu and must flow into
// the content side instead.
const POPOVER_PLACEMENT_BY_TABS_PLACEMENT: Record<TabPlacement, Placement> = {
  top: 'bottom start',
  bottom: 'top start',
  left: 'right top',
  right: 'left top',
};

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
  size,
  type = 'default',
  placement = 'top',
  isReorderable,
  onReorder,
}: TabPickerProps) {
  const isDeletable = !!onDelete;

  // Map TabSize to FilterPicker size (xsmall -> small)
  const pickerSize = size === 'xsmall' ? 'small' : size;

  // Only show border divider for file type
  const showBorderDivider = type === 'file';
  const isVertical = placement === 'left' || placement === 'right';

  return (
    <FilterPicker
      selectionMode="single"
      selectedKey={selectedKey}
      renderSummary={false}
      icon={<MoreIcon />}
      rightIcon={null}
      shape="sharp"
      type="clear"
      size={pickerSize}
      placement={POPOVER_PLACEMENT_BY_TABS_PLACEMENT[placement]}
      // Apply border to wrapper (FilterPickerWrapper) so :first-child evaluates
      // relative to Suffix container, not the internal DialogTrigger. The
      // divider side flips with the bar's orientation.
      styles={{
        border: showBorderDivider
          ? {
              '': 0,
              '!:first-child': isVertical ? 'top' : 'left',
            }
          : 0,
      }}
      triggerStyles={{ border: 0 }}
      aria-label="Select tab"
      isReorderable={isReorderable}
      onReorder={onReorder}
      onSelectionChange={(key) => {
        if (key != null) {
          onSelect(String(key));
        }
      }}
    >
      {tabs.map((tab) => (
        <FilterPicker.Item
          key={tab.key}
          icon={tab.icon}
          textValue={
            typeof tab.title === 'string' ? tab.title : String(tab.key)
          }
          autoHideActions={isDeletable}
          actions={
            isDeletable ? (
              <ItemAction
                icon={<CloseIcon />}
                aria-label="Close"
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
