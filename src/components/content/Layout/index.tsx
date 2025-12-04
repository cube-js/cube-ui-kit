import { ForwardRefExoticComponent, RefAttributes } from 'react';

import { CubeLayoutProps, Layout as LayoutBase } from './Layout';
import { LayoutBlock } from './LayoutBlock';
import { LayoutContent } from './LayoutContent';
import { LayoutFlex } from './LayoutFlex';
import { LayoutFooter } from './LayoutFooter';
import { LayoutGrid } from './LayoutGrid';
import { LayoutHeader } from './LayoutHeader';
import { LayoutPanel } from './LayoutPanel';
import { LayoutPanelHeader } from './LayoutPanelHeader';
import { LayoutToolbar } from './LayoutToolbar';

export { GridLayout } from './GridLayout';
export type { CubeGridLayoutProps } from './GridLayout';
export type { CubeLayoutProps } from './Layout';
export type { CubeLayoutBlockProps } from './LayoutBlock';
export type { CubeLayoutContentProps, ScrollbarType } from './LayoutContent';
export type { CubeLayoutFlexProps } from './LayoutFlex';
export type { CubeLayoutGridProps } from './LayoutGrid';
export type { CubeLayoutFooterProps } from './LayoutFooter';
export type { CubeLayoutHeaderProps } from './LayoutHeader';
export type { CubeLayoutPanelProps } from './LayoutPanel';
export type { CubeLayoutPanelHeaderProps } from './LayoutPanelHeader';
export type { CubeLayoutToolbarProps } from './LayoutToolbar';
export {
  LayoutContext,
  LayoutPanelContext,
  useLayoutContext,
  useLayoutPanelContext,
} from './LayoutContext';
export type {
  LayoutContextValue,
  LayoutPanelContextValue,
  Side,
} from './LayoutContext';

// Create Layout compound component
interface LayoutComponent
  extends ForwardRefExoticComponent<
    CubeLayoutProps & RefAttributes<HTMLDivElement>
  > {
  Toolbar: typeof LayoutToolbar;
  Header: typeof LayoutHeader;
  Footer: typeof LayoutFooter;
  Content: typeof LayoutContent;
  Block: typeof LayoutBlock;
  Flex: typeof LayoutFlex;
  Grid: typeof LayoutGrid;
  Panel: typeof LayoutPanel;
  PanelHeader: typeof LayoutPanelHeader;
}

const Layout = Object.assign(LayoutBase, {
  Toolbar: LayoutToolbar,
  Header: LayoutHeader,
  Footer: LayoutFooter,
  Content: LayoutContent,
  Block: LayoutBlock,
  Flex: LayoutFlex,
  Grid: LayoutGrid,
  Panel: LayoutPanel,
  PanelHeader: LayoutPanelHeader,
}) as LayoutComponent;

export { Layout };
