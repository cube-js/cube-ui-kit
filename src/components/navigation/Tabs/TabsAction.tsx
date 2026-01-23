import { FocusableRef } from '@react-types/shared';
import { forwardRef, useMemo } from 'react';

import { tasty } from '../../../tasty';
import {
  CubeItemButtonProps,
  ItemButton,
} from '../../actions/ItemButton/ItemButton';

import { useOptionalTabsContext } from './TabsContext';

import type { TabSize } from './types';

// =============================================================================
// Types
// =============================================================================

export interface CubeTabsActionProps
  extends Omit<CubeItemButtonProps, 'size' | 'shape'> {
  /**
   * Size of the action button.
   * When used inside Tabs prefix/suffix, inherits from Tabs size by default.
   */
  size?: TabSize;
}

// =============================================================================
// Styled Component
// =============================================================================

const TabsActionElement = tasty(ItemButton, {
  shape: 'sharp',
  type: 'neutral',
  styles: {
    border: {
      '': 0,
      '(tabs-type-panel | tabs-type-file) & !:first-child': 'left',
    },
  },
});

// =============================================================================
// Component
// =============================================================================

/**
 * Action button designed for the Tabs prefix/suffix slots.
 *
 * Styled with sharp edges and no border to match the TabPicker trigger.
 * When multiple TabsAction components are placed together, they automatically
 * display dividers between them using CSS :not(:first-child) border styling
 * (only for panel and file tab types).
 *
 * Inherits size from the parent Tabs component when used inside prefix/suffix slots.
 *
 * @example
 * <Tabs suffix={<Tabs.Action icon={<PlusIcon />} onPress={handleAdd} />}>
 *   <Tab key="tab1" title="Tab 1">Content</Tab>
 * </Tabs>
 *
 * @example
 * // Multiple actions with automatic dividers
 * <Tabs
 *   suffix={
 *     <>
 *       <Tabs.Action icon={<PlusIcon />} onPress={handleAdd} />
 *       <Tabs.Action icon={<SettingsIcon />} onPress={handleSettings} />
 *     </>
 *   }
 * >
 *   <Tab key="tab1" title="Tab 1">Content</Tab>
 * </Tabs>
 */
export const TabsAction = forwardRef(function TabsAction(
  props: CubeTabsActionProps,
  ref: FocusableRef<HTMLElement>,
) {
  const { size, mods, ...rest } = props;

  // Get size and type from context if available (when used inside Tabs)
  const tabsContext = useOptionalTabsContext();
  const effectiveSize = size ?? tabsContext?.size ?? 'medium';
  const tabsType = tabsContext?.type ?? 'default';

  const combinedMods = useMemo(
    () => ({
      'tabs-type-panel': tabsType === 'panel',
      'tabs-type-file': tabsType === 'file',
      ...mods,
    }),
    [tabsType, mods],
  );

  return (
    <TabsActionElement
      ref={ref}
      size={effectiveSize}
      mods={combinedMods}
      {...rest}
    />
  );
});
