import {
  ForwardedRef,
  forwardRef,
  ForwardRefExoticComponent,
  ReactNode,
  RefAttributes,
} from 'react';

import { Styles, tasty } from '../../../tasty';

import { CubeLayoutProps, Layout } from './Layout';
import { LayoutBlock } from './LayoutBlock';
import { LayoutContent } from './LayoutContent';
import { LayoutFooter } from './LayoutFooter';
import { LayoutHeader } from './LayoutHeader';
import { LayoutPanel } from './LayoutPanel';
import { LayoutPanelHeader } from './LayoutPanelHeader';
import { LayoutToolbar } from './LayoutToolbar';

const GridLayoutElement = tasty(Layout, {
  qa: 'GridLayout',
  styles: {
    Content: {
      display: 'grid',
    },
  },
});

export interface CubeGridLayoutProps extends CubeLayoutProps {
  /** Grid template columns */
  columns?: Styles['gridColumns'];
  /** Grid template rows */
  rows?: Styles['gridRows'];
  /** Grid template shorthand */
  template?: Styles['gridTemplate'];
  children?: ReactNode;
}

function GridLayoutBase(
  props: CubeGridLayoutProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { columns, rows, template, ...otherProps } = props;

  return (
    <GridLayoutElement
      ref={ref}
      isGrid
      columns={columns}
      rows={rows}
      template={template}
      {...otherProps}
    />
  );
}

const _GridLayout = forwardRef(GridLayoutBase);

_GridLayout.displayName = 'GridLayout';

// Create the GridLayout with all sub-components aliased
interface GridLayoutComponent
  extends ForwardRefExoticComponent<
    CubeGridLayoutProps & RefAttributes<HTMLDivElement>
  > {
  Toolbar: typeof LayoutToolbar;
  Header: typeof LayoutHeader;
  Footer: typeof LayoutFooter;
  Content: typeof LayoutContent;
  Block: typeof LayoutBlock;
  Panel: typeof LayoutPanel;
  PanelHeader: typeof LayoutPanelHeader;
}

const GridLayout = Object.assign(_GridLayout, {
  Toolbar: LayoutToolbar,
  Header: LayoutHeader,
  Footer: LayoutFooter,
  Content: LayoutContent,
  Block: LayoutBlock,
  Panel: LayoutPanel,
  PanelHeader: LayoutPanelHeader,
}) as GridLayoutComponent;

export { GridLayout };
