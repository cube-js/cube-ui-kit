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
import { Item as CollectionItem, useTabListState } from 'react-stately';

import { useEvent } from '../../../_internal/hooks';
import { extractStyles, OUTER_STYLES } from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { useTinyScrollbar } from '../../content/Layout/hooks/useTinyScrollbar';

import { TabIndicatorElement, TabsElement } from './styled';
import { TabButton } from './TabButton';
import { CachedPanelRenderer, TabPanelRenderer } from './TabPanel';
import { TabsContextValue, TabsProvider } from './TabsContext';
import { useTabEditing } from './use-tab-editing';
import { useTabIndicator } from './use-tab-indicator';
import { useTabReordering } from './use-tab-reordering';

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

  // =========================================================================
  // Drag-and-Drop Reordering
  // =========================================================================
  const { dragState, dropState, collectionProps } = useTabReordering({
    isReorderable,
    state,
    listRef,
    orderedKeys: orderedParsedTabs.map((t) => t.key),
    onReorder,
  });

  // =========================================================================
  // Tab Indicator (for default type)
  // =========================================================================
  const indicatorStyle = useTabIndicator(
    listRef,
    state.selectedKey,
    type === 'default',
  );

  // =========================================================================
  // Tiny Scrollbar (not for radio type)
  // =========================================================================
  const isTinyScrollbar = type !== 'radio';
  const { handleHStyle, hasOverflowX, isScrolling, isAtStartX, isAtEndX } =
    useTinyScrollbar(scrollRef, isTinyScrollbar);

  const hasPanels = hasAnyContent || !!renderPanel;

  // =========================================================================
  // Context Value
  // =========================================================================
  const contextValue: TabsContextValue = useMemo(
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
      dragState,
      dropState,
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
      dragState,
      dropState,
      editingKey,
      editValue,
      setEditValue,
      startEditing,
      submitEditing,
      cancelEditing,
    ],
  );

  // =========================================================================
  // Mods for styling
  // =========================================================================
  const mods = useMemo(
    () => ({
      type,
      deletable: !!onDelete,
      scrolling: isScrolling,
      'fade-left': !isAtStartX,
      'fade-right': !isAtEndX,
      'has-panels': hasPanels,
    }),
    [type, onDelete, isScrolling, isAtStartX, isAtEndX, hasPanels],
  );

  return (
    <>
      <TabsElement
        ref={ref}
        qa={qa}
        mods={mods}
        styles={combinedStyles}
        style={handleHStyle}
        data-size={size}
      >
        {prefix ? <div data-element="Prefix">{prefix}</div> : null}
        <div data-element="ScrollWrapper">
          <div ref={scrollRef} data-element="Scroll">
            <div
              {...mergeProps(
                tabListProps,
                isReorderable ? collectionProps : {},
              )}
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
          </div>
          {isTinyScrollbar && hasOverflowX && <div data-element="ScrollbarH" />}
        </div>
        {suffix ? <div data-element="Suffix">{suffix}</div> : null}
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
    </>
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
});

export { Tab, TabList, TabPanel };
