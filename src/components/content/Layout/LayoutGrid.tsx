import { ForwardedRef, forwardRef } from 'react';

import { Styles, tasty } from '../../../tasty';

import { CubeLayoutContentProps, LayoutContent } from './LayoutContent';

const GridElement = tasty(LayoutContent, {
  qa: 'LayoutGrid',
  styles: {
    container: 'none',
    flexShrink: 0,
    flexGrow: 0,

    Inner: {
      display: 'grid',
      flow: 'row',
      padding: 0,
    },
  },
});

export interface CubeLayoutGridProps extends CubeLayoutContentProps {
  /** Grid template columns */
  columns?: Styles['gridColumns'];
  /** Grid template rows */
  rows?: Styles['gridRows'];
  /** Grid template shorthand */
  template?: Styles['gridTemplate'];
}

function LayoutGrid(
  props: CubeLayoutGridProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    children,
    scrollbar = 'tiny',
    columns,
    rows,
    template,
    ...otherProps
  } = props;

  return (
    <GridElement
      {...otherProps}
      ref={ref}
      scrollbar={scrollbar}
      gridColumns={columns}
      gridRows={rows}
      gridTemplate={template}
    >
      {children}
    </GridElement>
  );
}

const _LayoutGrid = forwardRef(LayoutGrid);

_LayoutGrid.displayName = 'Layout.Grid';

export { _LayoutGrid as LayoutGrid };
