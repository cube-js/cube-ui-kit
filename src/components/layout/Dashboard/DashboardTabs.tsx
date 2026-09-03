import { Children, forwardRef, isValidElement, useContext } from 'react';

import { Tab, Tabs } from '../../navigation/Tabs/Tabs';

import { DashboardTreeContext } from './context';
import {
  DashboardContainerShell,
  DashboardGrid,
  DashboardHorizontalStack,
  DashboardVerticalStack,
} from './DashboardContainer';
import { DashboardContainerContent } from './DashboardContainerContent';

import type { ForwardedRef, ReactElement, ReactNode } from 'react';
import type {
  CubeDashboardTabProps,
  CubeDashboardTabsProps,
  DashboardTreeContextValue,
} from './types';

export function DashboardTab(
  _props: CubeDashboardTabProps,
): ReactElement | null {
  return null;
}

DashboardTab.displayName = 'DashboardTab';

export function isDashboardTab(
  child: ReactNode,
): child is ReactElement<CubeDashboardTabProps> {
  return (
    isValidElement(child) &&
    (child.type === DashboardTab ||
      (child.type as { displayName?: string }).displayName ===
        DashboardTab.displayName)
  );
}

export function isDashboardTabLayoutContainer(child: ReactNode): boolean {
  if (!isValidElement(child)) return false;

  const displayName = (child.type as { displayName?: string }).displayName;

  return (
    child.type === DashboardGrid ||
    child.type === DashboardHorizontalStack ||
    child.type === DashboardVerticalStack ||
    displayName === DashboardGrid.displayName ||
    displayName === DashboardHorizontalStack.displayName ||
    displayName === DashboardVerticalStack.displayName
  );
}

export const DashboardTabs = forwardRef(function DashboardTabs(
  props: CubeDashboardTabsProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    id,
    children,
    rows = 1,
    activeKey,
    defaultActiveKey,
    onActiveChange,
    ...containerProps
  } = props;
  const tree = useContext(DashboardTreeContext);

  if (tree.parentKind !== 'root') {
    throw new Error(
      `Dashboard.Tabs "${id}" is only allowed directly inside Dashboard.`,
    );
  }

  const tabs = Children.toArray(children).filter(isDashboardTab);
  const content = (
    <Tabs
      activeKey={activeKey}
      defaultActiveKey={defaultActiveKey ?? tabs[0]?.props.id}
      onChange={onActiveChange}
      keepMounted
      label={
        props['aria-label'] ??
        (typeof props.title === 'string' ? props.title : id)
      }
      height="100%"
      barStyles={{ borderBottom: '1bw #border', marginBottom: '1x' }}
    >
      {tabs.map((tab) => {
        const tabLayoutId = `${id}:${tab.props.id}`;
        const tabLayoutChildren = Children.toArray(tab.props.children);

        if (
          tabLayoutChildren.length > 1 ||
          tabLayoutChildren.some(
            (child) => !isDashboardTabLayoutContainer(child),
          )
        ) {
          throw new Error(
            `Dashboard.Tab "${tab.props.id}" inside "${id}" accepts one Grid, HorizontalStack, or VerticalStack layout container only.`,
          );
        }

        const tabTree: DashboardTreeContextValue = {
          containerDepth: 1,
          parentKind: 'tabs',
          parentId: tabLayoutId,
          layoutParentId: tabLayoutId,
          parentColumns: 12,
          parentRows: Math.max(1, Math.floor(rows)),
          ancestorIds: [...tree.ancestorIds, id],
        };

        return (
          <Tab
            key={tab.props.id}
            title={tab.props.title}
            keepMounted={tab.props.keepMounted ?? true}
          >
            <DashboardTreeContext.Provider value={tabTree}>
              <DashboardContainerContent
                id={tabLayoutId}
                kind="tabs"
                columns={12}
                rows={Math.max(1, Math.floor(rows))}
                depth={1}
                ancestorIds={[...tree.ancestorIds, id]}
                tabsId={id}
                tabId={tab.props.id}
              >
                {tab.props.children}
              </DashboardContainerContent>
            </DashboardTreeContext.Provider>
          </Tab>
        );
      })}
    </Tabs>
  );

  return (
    <DashboardContainerShell
      {...containerProps}
      ref={ref}
      id={id}
      rows={rows}
      kind="tabs"
      content={content}
      children={children}
    />
  );
});

DashboardTabs.displayName = 'DashboardTabs';
