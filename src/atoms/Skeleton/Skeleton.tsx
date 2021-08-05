import { Placeholder } from '../Placeholder/Placeholder';
import { Flow } from '../../components/Flow';
import { Space } from '../../components/Space';
import { Grid } from '../../components/Grid';
import { BaseProps, ContainerStyleProps } from '../../components/types';

const LAYOUT_MAP = {
  page({ lines, children, ...props }) {
    return (
      <Flow gap="4x" {...props}>
        <Space placeContent="space-between">
          <Placeholder width="100px 25% 300px" />
          <Placeholder width="50px 10% 150px" />
        </Space>
        <Flow gap="2x">
          {children ||
            Array(lines || 5)
              .fill(0)
              .map((item, i) => <Placeholder key={i} />)}
        </Flow>
      </Flow>
    );
  },
  content({ children, lines, ...props }) {
    return (
      <Flow gap="2x" {...props}>
        {children ||
          Array(lines || 5)
            .fill(0)
            .map((item, i) => <Placeholder key={i} />)}
      </Flow>
    );
  },
  topbar(props) {
    return (
      <Space
        gap="4x"
        placeContent="space-between"
        height="6x"
        padding="1x"
        border="bottom"
        {...props}
      >
        <Space>
          <Placeholder circle size="4x" />
          <Placeholder width="20x" />
        </Space>

        <Space>
          <Placeholder width="10x" />
          <Placeholder circle size="4x" />
        </Space>
      </Space>
    );
  },
  menu({ lines, ...props }) {
    return (
      <Flow gap="3.25x" {...props} padding="3x 1x">
        {Array(lines || 5)
          .fill(0)
          .map((item, i) => (
            <Placeholder key={i} />
          ))}
      </Flow>
    );
  },
  stats({ cards, ...props }) {
    return (
      <Space gap="4x" {...props}>
        {Array(cards || 3)
          .fill(0)
          .map((item, i) => (
            <Placeholder key={i} radius="1x" width="20x" height="12x" />
          ))}
      </Space>
    );
  },
  tabs({ tabs, children, lines, ...props }) {
    return (
      <Flow gap="4x" {...props}>
        <Space>
          {Array(tabs || 3)
            .fill(0)
            .map((item, i) => (
              <Placeholder key={i} width="15x" />
            ))}
        </Space>
        <Flow gap="2x">
          {children ||
            Array(lines || 5)
              .fill(0)
              .map((item, i) => <Placeholder key={i} />)}
        </Flow>
      </Flow>
    );
  },
  table({ rows, columns, ...props }) {
    columns = columns || 5;
    rows = rows || 5;

    return (
      <Grid
        columns={`repeat(${columns}, 1fr)`}
        gap="3x"
        {...props}
        padding="1x 0"
      >
        {Array(rows)
          .fill(0)
          .map((item, i) => {
            return Array(columns)
              .fill(0)
              .map((item, j) => {
                return (
                  <Placeholder key={`${i}.${j}`} size={!i ? '3x' : '2x'} />
                );
              });
          })}
      </Grid>
    );
  },
  chart({ columns, ...props }) {
    columns = columns || 12;

    const heightMap = [1, 4, 2, 5, 8, 9, 5, 3, 4, 2, 6, 7, 2];

    return (
      <Grid
        columns={`repeat(${columns}, 1fr)`}
        gap="3x"
        padding="1x 0"
        placeItems="end stretch"
        height="40x"
        {...props}
      >
        {Array(columns)
          .fill(0)
          .map((item, i) => {
            return (
              <Placeholder
                key={i}
                height={`${heightMap[i % 12] * 10}%`}
                width="max 6x"
              />
            );
          })}
      </Grid>
    );
  },
} as const;

export interface CubeSkeletonProps extends BaseProps, ContainerStyleProps {
  /** The type of the layout */
  layout?: keyof typeof LAYOUT_MAP;
}

export function Skeleton({ layout, ...props }: CubeSkeletonProps) {
  layout = layout || 'page';

  return LAYOUT_MAP[layout] ? (
    LAYOUT_MAP[layout]({ ...props, qa: 'Skeleton' })
  ) : (
    <Placeholder {...props} />
  );
}
