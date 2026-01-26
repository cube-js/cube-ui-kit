import {
  Children,
  ForwardedRef,
  forwardRef,
  isValidElement,
  ReactElement,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { AriaTabListProps, useTabList } from 'react-aria';
import {
  Item as CollectionItem,
  DraggableCollectionState,
  DroppableCollectionState,
  useTabListState,
} from 'react-stately';

import { useEvent, useWarn } from '../../../_internal/hooks';
import { DirectionIcon } from '../../../icons';
import { extractStyles, OUTER_STYLES } from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { useTinyScrollbar } from '../../content/Layout/hooks/useTinyScrollbar';

import { DraggableTabList } from './DraggableTabList';
import { TabIndicatorElement, TabsElement } from './styled';
import { TabButton } from './TabButton';
import { CachedPanelRenderer, TabPanelRenderer } from './TabPanel';
import { TabPicker } from './TabPicker';
import { TabsAction } from './TabsAction';
import { TabsContextValue, TabsProvider } from './TabsContext';
import { useTabEditing } from './use-tab-editing';
import { useTabIndicator } from './use-tab-indicator';

import type { Key } from '@react-types/shared';
import type {
  CubeTabListProps,
  CubeTabPanelProps,
  CubeTabProps,
  CubeTabsProps,
  ParsedPanel,
  ParsedTab,
} from './types';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generic helper to check if a child is a specific component by displayName.
 */
function isComponentElement<T>(
  child: ReactNode,
  displayName: string,
): child is ReactElement<T> {
  return (
    isValidElement(child) &&
    typeof child.type === 'function' &&
    (child.type as any).displayName === displayName
  );
}

/** Checks if a child is a Tab component. */
const isTabElement = (child: ReactNode): child is ReactElement<CubeTabProps> =>
  isComponentElement<CubeTabProps>(child, 'CubeTab');

/** Checks if a child is a TabPanel component. */
const isTabPanelElement = (
  child: ReactNode,
): child is ReactElement<CubeTabPanelProps> =>
  isComponentElement<CubeTabPanelProps>(child, 'CubeTabPanel');

/** Checks if a child is a TabList component. */
const isTabListElement = (
  child: ReactNode,
): child is ReactElement<CubeTabListProps> =>
  isComponentElement<CubeTabListProps>(child, 'CubeTabList');

/**
 * Extracts the raw key from a React element, stripping the ".$" prefix
 * that React adds via Children.map/toArray.
 */
function getRawKey(element: ReactElement): string | null {
  if (element.key == null) return null;
  const keyStr = String(element.key);
  return keyStr.startsWith('.$') ? keyStr.slice(2) : keyStr;
}

// =============================================================================
// Tab Component (configuration only - not rendered directly)
// =============================================================================

function Tab(_props: CubeTabProps): ReactElement | null {
  return null;
}

Tab.displayName = 'CubeTab';

// =============================================================================
// TabPanel Component (configuration only - not rendered directly)
// =============================================================================

function TabPanel(_props: CubeTabPanelProps): ReactElement | null {
  return null;
}

TabPanel.displayName = 'CubeTabPanel';

// =============================================================================
// TabList Component (configuration only - not rendered directly)
// =============================================================================

function TabList(_props: CubeTabListProps): ReactElement | null {
  return null;
}

TabList.displayName = 'CubeTabList';

// =============================================================================
// Main Tabs Component
// =============================================================================

function TabsComponent(
  props: CubeTabsProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    label = 'Tabs',
    defaultActiveKey,
    activeKey,
    size,
    type = 'default',
    onChange,
    onDelete,
    onTitleChange,
    showActionsOnHover,
    isEditable: parentIsEditable,
    menu: parentMenu,
    menuTriggerProps: parentMenuTriggerProps,
    menuProps: parentMenuProps,
    contextMenu: parentContextMenu,
    onAction: parentOnAction,
    children,
    prefix,
    suffix,
    prerender = false,
    keepMounted = false,
    qa = 'Tabs',
    renderPanel,
    panelCacheKeys,
    isReorderable = false,
    keyOrder,
    onReorder,
    showTabPicker = false,
    showScrollArrows = false,
    tabPickerPosition = 'suffix',
    scrollArrowsPosition = 'suffix',
    ...otherProps
  } = props;

  // Extract outer styles
  const combinedStyles = extractStyles(otherProps, OUTER_STYLES);

  // DOM element refs
  const listRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track visited tabs for keepMounted functionality
  const visitedKeysRef = useRef<Set<string>>(new Set());

  // =========================================================================
  // Tab Title Editing Hook
  // =========================================================================
  const {
    editingKey,
    editValue,
    setEditValue,
    startEditing,
    cancelEditing,
    submitEditing,
  } = useTabEditing({ onChange, onTitleChange });

  // =========================================================================
  // Parse children to extract tabs and explicit panels
  // =========================================================================
  const { parsedTabs, explicitPanels, hasAnyContent } = useMemo(() => {
    const childArray = Children.toArray(children);
    const tabs: ParsedTab[] = [];
    const panels = new Map<string, ParsedPanel>();
    let hasExplicitList = false;
    let tabChildren: ReactNode[] = [];

    // Check for explicit Tabs.List / Tabs.Panel structure
    for (const child of childArray) {
      if (isTabListElement(child)) {
        hasExplicitList = true;
        tabChildren = Children.toArray(child.props.children);
      } else if (isTabPanelElement(child)) {
        const key = getRawKey(child as ReactElement);

        if (key != null) {
          panels.set(key, {
            key,
            content: child.props.children,
            prerender: child.props.prerender,
            keepMounted: child.props.keepMounted,
            styles: child.props.styles,
            qa: child.props.qa,
            qaVal: child.props.qaVal,
          });
        }
      }
    }

    // If no explicit list, use direct Tab children
    if (!hasExplicitList) {
      tabChildren = childArray;
    }

    // Parse Tab elements
    let hasContent = panels.size > 0;

    for (const child of tabChildren) {
      if (isTabElement(child)) {
        const key = getRawKey(child) ?? child.props.id;

        if (key != null) {
          const { id: _id, children: tabContent, ...tabProps } = child.props;

          tabs.push({
            ...tabProps,
            key,
            content: tabContent,
          });

          if (tabContent != null) {
            hasContent = true;
          }
        }
      }
    }

    return {
      parsedTabs: tabs,
      explicitPanels: panels,
      hasAnyContent: hasContent,
    };
  }, [children]);

  // Clean up visitedKeys when tabs are removed
  const currentTabKeysSet = useMemo(
    () => new Set(parsedTabs.map((t) => t.key)),
    [parsedTabs],
  );

  useEffect(() => {
    for (const key of visitedKeysRef.current) {
      if (!currentTabKeysSet.has(key)) {
        visitedKeysRef.current.delete(key);
      }
    }
  }, [currentTabKeysSet]);

  // =========================================================================
  // Order tabs according to keyOrder
  // =========================================================================
  const orderedParsedTabs = useMemo(() => {
    if (!keyOrder || keyOrder.length === 0) {
      return parsedTabs;
    }

    const tabMap = new Map<string, ParsedTab>();
    for (const tab of parsedTabs) {
      tabMap.set(tab.key, tab);
    }

    const ordered: ParsedTab[] = [];
    for (const key of keyOrder) {
      const tab = tabMap.get(String(key));
      if (tab) {
        ordered.push(tab);
        tabMap.delete(String(key));
      }
    }

    // Append any tabs not in keyOrder
    for (const tab of parsedTabs) {
      if (tabMap.has(tab.key)) {
        ordered.push(tab);
      }
    }

    return ordered;
  }, [parsedTabs, keyOrder]);

  // Create collection items for React Stately
  const collectionItems = useMemo(() => {
    return orderedParsedTabs.map((tab) => (
      <CollectionItem
        key={tab.key}
        textValue={typeof tab.title === 'string' ? tab.title : String(tab.key)}
      >
        {tab.title}
      </CollectionItem>
    ));
  }, [orderedParsedTabs]);

  // Determine disabled keys
  const disabledKeys = useMemo(() => {
    return new Set(
      parsedTabs.filter((tab) => tab.isDisabled).map((tab) => tab.key),
    );
  }, [parsedTabs]);

  // Handle selection change
  const handleSelectionChange = useEvent((key: Key) => {
    visitedKeysRef.current.add(String(key));
    onChange?.(key);
  });

  // Convert keys to strings for React Aria compatibility
  const selectedKey = activeKey != null ? String(activeKey) : undefined;
  const defaultSelectedKey =
    defaultActiveKey != null ? String(defaultActiveKey) : undefined;

  // Create aria props for useTabListState
  const ariaProps: AriaTabListProps<object> = useMemo(
    () => ({
      selectedKey,
      defaultSelectedKey,
      onSelectionChange: handleSelectionChange,
      disabledKeys,
      children: collectionItems,
      'aria-label': label,
    }),
    [
      selectedKey,
      defaultSelectedKey,
      handleSelectionChange,
      disabledKeys,
      collectionItems,
      label,
    ],
  );

  // Create state using useTabListState
  const state = useTabListState(ariaProps);

  // Track initial selected key for visited tabs
  useEffect(() => {
    if (state.selectedKey != null) {
      visitedKeysRef.current.add(String(state.selectedKey));
    }
  }, [state.selectedKey]);

  // Get tablist props from react-aria
  const { tabListProps } = useTabList(ariaProps, state, listRef);

  // Handle selection from TabPicker (needs to update internal state in uncontrolled mode)
  const handleTabPickerSelect = useEvent((key: Key) => {
    // Update internal state (for uncontrolled mode)
    state.setSelectedKey(key);
    // Also call the external onChange handler
    handleSelectionChange(key);
  });

  // =========================================================================
  // Tab Indicator (for default type)
  // =========================================================================
  // Create order token that changes when tab order changes (for indicator recalculation)
  const orderToken = useMemo(
    () => orderedParsedTabs.map((t) => t.key).join(','),
    [orderedParsedTabs],
  );

  const indicatorStyle = useTabIndicator(
    listRef,
    state.selectedKey,
    type === 'default' || type === 'narrow',
    orderToken,
  );

  // =========================================================================
  // Tiny Scrollbar (not for radio type)
  // =========================================================================
  const isTinyScrollbar = type !== 'radio';
  const { handleHStyle, hasOverflowX, isScrolling, isAtStartX, isAtEndX } =
    useTinyScrollbar(scrollRef, isTinyScrollbar);

  const hasPanels = hasAnyContent || !!renderPanel;

  // =========================================================================
  // Tab Picker visibility
  // =========================================================================
  useWarn(showTabPicker && type === 'radio', {
    key: ['tabs-tabpicker-radio-unsupported'],
    args: [
      'Tabs:',
      '`showTabPicker` is not supported when `type="radio"`. The TabPicker will not be rendered.',
    ],
  });

  const shouldShowTabPicker =
    type !== 'radio' &&
    (showTabPicker === true || (showTabPicker === 'auto' && hasOverflowX));

  // =========================================================================
  // Scroll Arrows visibility and handlers
  // =========================================================================
  useWarn(showScrollArrows && type === 'radio', {
    key: ['tabs-scrollarrows-radio-unsupported'],
    args: [
      'Tabs:',
      '`showScrollArrows` is not supported when `type="radio"`. The scroll arrows will not be rendered.',
    ],
  });

  const shouldShowScrollArrows =
    type !== 'radio' &&
    (showScrollArrows === true ||
      (showScrollArrows === 'auto' && hasOverflowX));

  const handleScrollLeft = useEvent(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({
        left: el.scrollLeft - el.clientWidth,
        behavior: 'smooth',
      });
    }
  });

  const handleScrollRight = useEvent(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({
        left: el.scrollLeft + el.clientWidth,
        behavior: 'smooth',
      });
    }
  });

  // =========================================================================
  // Base Context Value (without drag/drop states)
  // =========================================================================
  const baseContextValue = useMemo(
    () => ({
      state,
      type,
      size,
      showActionsOnHover,
      isEditable: parentIsEditable,
      menu: parentMenu,
      menuTriggerProps: parentMenuTriggerProps,
      menuProps: parentMenuProps,
      contextMenu: parentContextMenu,
      onDelete,
      onAction: parentOnAction,
      editingKey,
      editValue,
      setEditValue,
      startEditing,
      submitEditing,
      cancelEditing,
    }),
    [
      state,
      type,
      size,
      showActionsOnHover,
      parentIsEditable,
      parentMenu,
      parentMenuTriggerProps,
      parentMenuProps,
      parentContextMenu,
      onDelete,
      parentOnAction,
      editingKey,
      editValue,
      setEditValue,
      startEditing,
      submitEditing,
      cancelEditing,
    ],
  );

  // Helper to create full context value with optional drag/drop states
  const createContextValue = (
    dragState?: DraggableCollectionState,
    dropState?: DroppableCollectionState,
  ): TabsContextValue => ({
    ...baseContextValue,
    dragState,
    dropState,
  });

  // =========================================================================
  // Tab List Content Renderer
  // =========================================================================
  const renderTabListContent = (
    contextValue: TabsContextValue,
    collectionProps: Record<string, unknown> = {},
  ) => (
    <div
      {...mergeProps(tabListProps, collectionProps)}
      ref={listRef}
      data-element="Container"
    >
      <TabsProvider value={contextValue}>
        {orderedParsedTabs.map((tab, index) => {
          const item = state.collection.getItem(tab.key);
          if (!item) return null;

          return (
            <TabButton
              key={item.key}
              item={item}
              tabData={tab}
              isLastTab={index === orderedParsedTabs.length - 1}
            />
          );
        })}
      </TabsProvider>
      {indicatorStyle && (
        <TabIndicatorElement
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
      )}
    </div>
  );

  // =========================================================================
  // Mods for styling
  // =========================================================================
  const mods = useMemo(
    () => ({
      type,
      size,
      deletable: !!onDelete,
      scrolling: isScrolling,
      'fade-left': !isAtStartX,
      'fade-right': !isAtEndX,
      'has-panels': hasPanels,
    }),
    [type, size, onDelete, isScrolling, isAtStartX, isAtEndX, hasPanels],
  );

  // =========================================================================
  // Action Elements (TabPicker and Scroll Arrows)
  // =========================================================================
  const scrollArrowsElement = shouldShowScrollArrows ? (
    <>
      <TabsAction
        icon={<DirectionIcon to="left" />}
        aria-label="Scroll tabs left"
        isDisabled={isAtStartX}
        onPress={handleScrollLeft}
      />
      <TabsAction
        icon={<DirectionIcon to="right" />}
        aria-label="Scroll tabs right"
        isDisabled={isAtEndX}
        onPress={handleScrollRight}
      />
    </>
  ) : null;

  const tabPickerElement = shouldShowTabPicker ? (
    <TabPicker
      tabs={orderedParsedTabs}
      selectedKey={state.selectedKey}
      size={size}
      type={type}
      onSelect={handleTabPickerSelect}
      onDelete={onDelete}
    />
  ) : null;

  // Determine which actions go in prefix/suffix
  // In prefix: TabPicker first (left), then scroll arrows (right)
  // In suffix: scroll arrows first (left), then TabPicker (right)
  const prefixHasActions =
    (shouldShowTabPicker && tabPickerPosition === 'prefix') ||
    (shouldShowScrollArrows && scrollArrowsPosition === 'prefix');

  const suffixHasActions =
    (shouldShowTabPicker && tabPickerPosition === 'suffix') ||
    (shouldShowScrollArrows && scrollArrowsPosition === 'suffix');

  // Wrap with TabsProvider so prefix/suffix can access context (size, type)
  // The inner TabsProvider in renderTabListContent will override for tab buttons
  return (
    <TabsProvider value={baseContextValue}>
      <TabsElement
        ref={ref}
        qa={qa}
        mods={mods}
        styles={combinedStyles}
        style={handleHStyle}
        data-size={size}
      >
        {prefix || prefixHasActions ? (
          <div data-element="Prefix">
            {tabPickerPosition === 'prefix' && tabPickerElement}
            {scrollArrowsPosition === 'prefix' && scrollArrowsElement}
            {prefix}
          </div>
        ) : null}
        <div data-element="ScrollWrapper">
          <div ref={scrollRef} data-element="Scroll">
            {isReorderable ? (
              <DraggableTabList
                state={state}
                listRef={listRef}
                orderedKeys={orderedParsedTabs.map((t) => t.key)}
                onReorder={onReorder}
              >
                {(dragState, dropState, collectionProps) =>
                  renderTabListContent(
                    createContextValue(dragState, dropState),
                    collectionProps,
                  )
                }
              </DraggableTabList>
            ) : (
              renderTabListContent(createContextValue())
            )}
          </div>
          {isTinyScrollbar && hasOverflowX && <div data-element="ScrollbarH" />}
        </div>
        {suffix || suffixHasActions ? (
          <div data-element="Suffix">
            {scrollArrowsPosition === 'suffix' && scrollArrowsElement}
            {tabPickerPosition === 'suffix' && tabPickerElement}
            {suffix}
          </div>
        ) : null}
      </TabsElement>

      {/* Functional panel rendering with content caching */}
      {renderPanel && (
        <CachedPanelRenderer
          parsedTabs={parsedTabs}
          explicitPanels={explicitPanels}
          state={state}
          renderPanel={renderPanel}
          panelCacheKeys={panelCacheKeys}
          prerender={prerender}
          keepMounted={keepMounted}
          visitedKeys={visitedKeysRef.current}
        />
      )}

      {/* Static panel rendering (traditional children-based approach) */}
      {!renderPanel &&
        hasAnyContent &&
        parsedTabs.map((tab) => {
          const explicitPanel = explicitPanels.get(tab.key);
          const content = explicitPanel?.content ?? tab.content;

          if (content == null) return null;

          return (
            <TabPanelRenderer
              key={tab.key}
              tabKey={tab.key}
              state={state}
              content={content}
              prerender={prerender}
              keepMounted={keepMounted}
              tabPrerender={explicitPanel?.prerender ?? tab.prerender}
              tabKeepMounted={explicitPanel?.keepMounted ?? tab.keepMounted}
              visitedKeys={visitedKeysRef.current}
              panelStyles={explicitPanel?.styles}
              qa={explicitPanel?.qa}
              qaVal={explicitPanel?.qaVal}
            />
          );
        })}
    </TabsProvider>
  );
}

// =============================================================================
// Exports
// =============================================================================

const _Tabs = forwardRef(TabsComponent);

/**
 * Tabs component for organizing content into multiple panels.
 * Built with React Aria for full accessibility support.
 *
 * **Note:** Tab keys are internally converted to strings for React Aria compatibility.
 *
 * @example
 * // Simple usage
 * <Tabs defaultActiveKey="tab1">
 *   <Tab key="tab1" title="Tab 1">Content 1</Tab>
 *   <Tab key="tab2" title="Tab 2">Content 2</Tab>
 * </Tabs>
 *
 * @example
 * // Tabs-only (no panels)
 * <Tabs activeKey={activeTab} onChange={setActiveTab}>
 *   <Tab key="overview" title="Overview" />
 *   <Tab key="settings" title="Settings" />
 * </Tabs>
 *
 * @example
 * // Explicit panels
 * <Tabs defaultActiveKey="tab1">
 *   <Tabs.List>
 *     <Tab key="tab1" title="Tab 1" />
 *     <Tab key="tab2" title="Tab 2" />
 *   </Tabs.List>
 *   <Tabs.Panel key="tab1">Content 1</Tabs.Panel>
 *   <Tabs.Panel key="tab2">Content 2</Tabs.Panel>
 * </Tabs>
 */
export const Tabs = Object.assign(_Tabs, {
  Tab,
  List: TabList,
  Panel: TabPanel,
  Action: TabsAction,
});

export { Tab, TabList, TabPanel, TabsAction };
