import { ReactNode } from 'react';

import { BaseProps, ContainerStyleProps } from '../../../tasty';
import { Flow } from '../../layout/Flow';
import { CubeGridProps, Grid } from '../../layout/Grid';
import { Space } from '../../layout/Space';
import { CubePlaceholderProps, Placeholder } from '../Placeholder/Placeholder';

const LAYOUT_MAP = {
  page({
    lines,
    children,
    isStatic = false,
    rootProps,
  }: CubeSkeletonLayoutProps) {
    return (
      <Flow gap="4x" {...rootProps}>
        <Space placeContent="space-between">
          <Placeholder isStatic={isStatic} width="100px 25% 300px" />
          <Placeholder isStatic={isStatic} width="50px 10% 150px" />
        </Space>
        <Flow gap="2x">
          {children ||
            Array(lines || 5)
              .fill(0)
              .map((item, i) => <Placeholder key={i} isStatic={isStatic} />)}
        </Flow>
      </Flow>
    );
  },
  content({
    children,
    lines,
    isStatic = false,
    rootProps,
  }: CubeSkeletonLayoutProps) {
    return (
      <Flow gap="2x" {...rootProps}>
        {children ||
          Array(lines || 5)
            .fill(0)
            .map((item, i) => <Placeholder key={i} isStatic={isStatic} />)}
      </Flow>
    );
  },
  topbar({ isStatic = false, rootProps }: CubeSkeletonProps) {
    return (
      <Space
        gap="4x"
        placeContent="space-between"
        height="6x"
        padding="1x"
        border="bottom"
        {...rootProps}
      >
        <Space>
          <Placeholder circle isStatic={isStatic} size="4x" />
          <Placeholder isStatic={isStatic} width="20x" />
        </Space>

        <Space>
          <Placeholder isStatic={isStatic} width="10x" />
          <Placeholder circle isStatic={isStatic} size="4x" />
        </Space>
      </Space>
    );
  },
  menu({ lines, isStatic = false, rootProps }: CubeSkeletonLayoutProps) {
    return (
      <Flow gap="3.25x" padding="3x 1x" {...rootProps}>
        {Array(lines || 5)
          .fill(0)
          .map((item, i) => (
            <Placeholder key={i} isStatic={isStatic} />
          ))}
      </Flow>
    );
  },
  stats({ cards, isStatic = false, rootProps }: CubeSkeletonLayoutProps) {
    return (
      <Space gap="4x" {...rootProps}>
        {Array(cards || 3)
          .fill(0)
          .map((item, i) => (
            <Placeholder
              key={i}
              isStatic={isStatic}
              radius="1r"
              width="20x"
              height="12x"
              flexGrow={1}
            />
          ))}
      </Space>
    );
  },
  tabs({
    tabs,
    children,
    lines,
    isStatic = false,
    rootProps,
  }: CubeSkeletonLayoutProps) {
    return (
      <Flow gap="4x" {...rootProps}>
        <Space>
          {Array(tabs || 3)
            .fill(0)
            .map((item, i) => (
              <Placeholder key={i} isStatic={isStatic} width="15x" />
            ))}
        </Space>
        <Flow gap="2x">
          {children ||
            Array(lines || 5)
              .fill(0)
              .map((item, i) => <Placeholder key={i} isStatic={isStatic} />)}
        </Flow>
      </Flow>
    );
  },
  table({
    rows,
    columns,
    isStatic = false,
    rootProps,
  }: CubeSkeletonLayoutProps) {
    columns = columns || 5;
    rows = rows || 5;

    return (
      <Grid
        columns={`repeat(${columns}, 1fr)`}
        gap="3x"
        padding="1x 0"
        {...rootProps}
      >
        {Array(rows)
          .fill(0)
          .map((item, i) => {
            return Array(columns)
              .fill(0)
              .map((item, j) => {
                return (
                  <Placeholder
                    key={`${i}.${j}`}
                    isStatic={isStatic}
                    size={!i ? '3x' : '2x'}
                  />
                );
              });
          })}
      </Grid>
    );
  },
  chart({ columns, isStatic = false, rootProps }: CubeSkeletonLayoutProps) {
    columns = columns || 12;

    const heightMap = [1, 4, 2, 5, 8, 9, 5, 3, 4, 2, 6, 7, 2];

    return (
      <Grid
        columns={`repeat(${columns}, 1fr)`}
        gap="3x"
        padding="1x 0"
        placeItems="end stretch"
        height="40x"
        {...rootProps}
      >
        {Array(columns)
          .fill(0)
          .map((item, i) => {
            return (
              <Placeholder
                key={i}
                isStatic={isStatic}
                height={`${heightMap[i % 12] * 10}%`}
                width="max 6x"
              />
            );
          })}
      </Grid>
    );
  },
} as const;

export interface CubeSkeletonProps
  extends CubeSkeletonRootProps,
    CubeSkeletonLayoutProps {
  /** The type of the layout */
  layout?: keyof typeof LAYOUT_MAP;
}

export interface CubeSkeletonRootProps
  extends Omit<CubeGridProps, 'columns' | 'rows'>,
    CubePlaceholderProps,
    BaseProps,
    ContainerStyleProps {}

export interface CubeSkeletonLayoutProps {
  /** The number of columns for the table layout */
  columns?: number;
  /** The number of rows for the table layout */
  rows?: number;
  /** The number of placeholder lines */
  lines?: number;
  /** The number of tabs */
  tabs?: number;
  /** The number of cards */
  cards?: number;
  /** The static mode */
  isStatic?: boolean;
  rootProps: CubeSkeletonRootProps;
  children?: ReactNode;
}

export function Skeleton({
  layout,
  isStatic,
  columns,
  rows,
  lines,
  tabs,
  cards,
  ...props
}: CubeSkeletonProps) {
  layout = layout || 'page';

  return LAYOUT_MAP[layout] ? (
    LAYOUT_MAP[layout]({
      isStatic,
      qa: 'Skeleton',
      columns,
      rows,
      lines,
      tabs,
      cards,
      rootProps: props,
    })
  ) : (
    <Placeholder qa="Skeleton" isStatic={isStatic} {...props} />
  );
}
