import { useEffect, useMemo, useRef } from 'react';
import { useTabPanel } from 'react-aria';

import { TabPanelElement } from './styled';

import type { ReactNode } from 'react';
import type { AriaTabPanelProps } from 'react-aria';
import type { TabListState } from 'react-stately';
import type { Styles } from '../../../tasty';
import type { CacheKeyValue, ParsedPanel, ParsedTab } from './types';

// =============================================================================
// Panel Rendering Utilities
// =============================================================================

/**
 * Determines if a panel should be rendered based on prerender/keepMounted settings.
 */
export function shouldRenderPanel(
  isActive: boolean,
  wasVisited: boolean,
  effectivePrerender: boolean | undefined,
  effectiveKeepMounted: boolean | undefined,
): boolean {
  return (
    !!effectivePrerender || isActive || (!!effectiveKeepMounted && wasVisited)
  );
}

// =============================================================================
// TabPanelRenderer Component
// =============================================================================

export interface TabPanelRendererProps {
  tabKey: string;
  state: TabListState<object>;
  content: ReactNode;
  prerender?: boolean;
  keepMounted?: boolean;
  tabPrerender?: boolean;
  tabKeepMounted?: boolean;
  visitedKeys: Set<string>;
  panelStyles?: Styles;
  qa?: string;
  qaVal?: string;
}

/**
 * Renders a single tab panel with proper ARIA attributes.
 */
export function TabPanelRenderer({
  tabKey,
  state,
  content,
  prerender,
  keepMounted,
  tabPrerender,
  tabKeepMounted,
  visitedKeys,
  panelStyles,
  qa,
  qaVal,
}: TabPanelRendererProps) {
  const ref = useRef<HTMLElement>(null);
  const { tabPanelProps } = useTabPanel(
    { key: tabKey } as AriaTabPanelProps,
    state,
    ref,
  );

  const isActive = state.selectedKey === tabKey;

  // Determine effective prerender/keepMounted (tab-level overrides global)
  const effectivePrerender = tabPrerender ?? prerender;
  const effectiveKeepMounted = tabKeepMounted ?? keepMounted;

  // Determine if panel should render
  if (
    !shouldRenderPanel(
      isActive,
      visitedKeys.has(tabKey),
      effectivePrerender,
      effectiveKeepMounted,
    )
  ) {
    return null;
  }

  return (
    <TabPanelElement
      {...tabPanelProps}
      ref={ref}
      qa={qa ?? 'TabPanel'}
      qaVal={qaVal ?? String(tabKey)}
      styles={panelStyles}
      style={{
        display: isActive ? 'contents' : 'none',
      }}
    >
      {content}
    </TabPanelElement>
  );
}

// =============================================================================
// CachedPanelRenderer Component
// =============================================================================

export interface CachedPanelRendererProps {
  parsedTabs: ParsedTab[];
  explicitPanels: Map<string, ParsedPanel>;
  state: TabListState<object>;
  renderPanel: (key: string) => ReactNode;
  panelCacheKeys?: Record<string | number, CacheKeyValue>;
  prerender: boolean;
  keepMounted: boolean;
  visitedKeys: Set<string>;
}

/**
 * Renders panels with content caching for `renderPanel`.
 *
 * Core principle: `renderPanel` is only called when the tab is active
 * (or once on mount for `prerender`). Inactive panels use cached content.
 *
 * Caching behavior:
 * - `keepMounted=true`: Cache content after first activation, reuse while inactive
 * - `prerender=true`: Call `renderPanel` once on mount, reuse until active again
 * - `panelCacheKeys`: Adds cache-key-based invalidation (lazy - only when active)
 * - No caching props: Only active panel is rendered, unmount when inactive
 */
export function CachedPanelRenderer({
  parsedTabs,
  explicitPanels,
  state,
  renderPanel,
  panelCacheKeys,
  prerender,
  keepMounted,
  visitedKeys,
}: CachedPanelRendererProps) {
  // Cache for rendered content - stores { content, cacheKey } per panel
  const contentCacheRef = useRef<
    Map<string, { content: ReactNode; cacheKey: CacheKeyValue }>
  >(new Map());

  /** Get the cache key for a panel. Returns undefined if not defined. */
  const getCacheKey = (key: string): CacheKeyValue => panelCacheKeys?.[key];

  /** Check if a panel has a defined (non-undefined) cache key. */
  const hasCacheKey = (key: string): boolean =>
    panelCacheKeys != null &&
    key in panelCacheKeys &&
    panelCacheKeys[key] !== undefined;

  /**
   * Determine if we should call renderPanel for this tab.
   */
  const shouldCallRenderPanel = (
    tabKey: string,
    isActive: boolean,
  ): boolean => {
    const cached = contentCacheRef.current.get(tabKey);

    // No cache exists - always need to populate on first render
    if (!cached) {
      return true;
    }

    // Cache exists
    if (isActive) {
      // If panelCacheKeys has an entry for this panel, use cache-key-based invalidation
      if (hasCacheKey(tabKey)) {
        const currentCacheKey = getCacheKey(tabKey);
        return cached.cacheKey !== currentCacheKey;
      }

      // No panelCacheKeys entry = always re-render when active
      return true;
    }

    // Inactive with cache - use cache
    return false;
  };

  // Clean up cache entries for removed tabs
  const currentTabKeys = useMemo(
    () => new Set(parsedTabs.map((t) => t.key)),
    [parsedTabs],
  );

  useEffect(() => {
    for (const key of contentCacheRef.current.keys()) {
      if (!currentTabKeys.has(key)) {
        contentCacheRef.current.delete(key);
      }
    }
  }, [currentTabKeys]);

  return (
    <>
      {parsedTabs.map((tab) => {
        const explicitPanel = explicitPanels.get(tab.key);
        const tabPrerender = explicitPanel?.prerender ?? tab.prerender;
        const tabKeepMounted = explicitPanel?.keepMounted ?? tab.keepMounted;
        const effectivePrerender = tabPrerender ?? prerender;
        const effectiveKeepMounted = tabKeepMounted ?? keepMounted;

        const isActive = state.selectedKey === tab.key;
        const wasVisited = visitedKeys.has(tab.key);

        // Determine if panel should be in DOM (visibility)
        if (
          !shouldRenderPanel(
            isActive,
            wasVisited,
            effectivePrerender,
            effectiveKeepMounted,
          )
        ) {
          // Panel not in DOM - clear cache if no caching strategy
          if (!effectiveKeepMounted && !effectivePrerender) {
            contentCacheRef.current.delete(tab.key);
          }
          return null;
        }

        // Determine if we need to call renderPanel
        let content: ReactNode;
        const needsRender = shouldCallRenderPanel(tab.key, isActive);

        if (needsRender) {
          // Call renderPanel and cache the result
          content = renderPanel(tab.key);
          const currentCacheKey = getCacheKey(tab.key);
          contentCacheRef.current.set(tab.key, {
            content,
            cacheKey: currentCacheKey,
          });
        } else {
          // Use cached content
          const cached = contentCacheRef.current.get(tab.key);
          content = cached?.content ?? null;
        }

        return (
          <TabPanelRenderer
            key={tab.key}
            tabKey={tab.key}
            state={state}
            content={content}
            prerender={prerender}
            keepMounted={keepMounted}
            tabPrerender={tabPrerender}
            tabKeepMounted={tabKeepMounted}
            visitedKeys={visitedKeys}
            panelStyles={explicitPanel?.styles}
            qa={explicitPanel?.qa}
            qaVal={explicitPanel?.qaVal}
          />
        );
      })}
    </>
  );
}
