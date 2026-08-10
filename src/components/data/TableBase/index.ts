// `TableBase` is the internal table engine. Nothing here is a public component —
// only the shared types reach `src/index.ts`, via the category barrel.
export { TableView } from './TableView';
export type { TableViewProps, CubeTableRowRenderProps } from './TableView';
export { TableElement, TableHeaderItem } from './styled';
export {
  useTableColumns,
  getColumnValue,
  getColumnText,
  readPath,
  DEFAULT_MIN_WIDTH,
} from './use-table-columns';
export type { UseTableColumnsOptions } from './use-table-columns';
export { useContainerWidth } from './use-container-width';
export type {
  CubeResolvedColumn,
  CubeTableAlign,
  CubeTableCellContext,
  CubeTableColumn,
  CubeTableColumnHeader,
  CubeTableColumnLayout,
  CubeTableHeaderContext,
  CubeTableRowContext,
  CubeTableRowSection,
  CubeTableSort,
  CubeTableSortDirection,
} from './types';
