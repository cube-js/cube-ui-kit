import { CONTAINER_STYLES, filterBaseProps, Styles } from '@tenphi/tasty';
import { forwardRef, useContext, useMemo, useRef, useState } from 'react';
import { useMove } from 'react-aria';

import { useEvent } from '../../../_internal/hooks';
import { useI18n } from '../../../i18n';
import { GripVerticalIcon } from '../../../icons/GripVerticalIcon';
import {
  mergeProps,
  useCombinedRefs,
  useLayoutEffect,
} from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';
import { Button } from '../../actions/Button/Button';

import { DashboardMetricsContext, DashboardTreeContext } from './context';
import { DashboardContainerContent } from './DashboardContainerContent';
import { DashboardNodeActions } from './DashboardNodeActions';
import { renderDashboardDropPreview } from './drag';
import {
  getContainerChildMinimum,
  getDashboardDescendantContainerDepth,
  getDashboardStackUsage,
  hasContainerLayoutChildren,
} from './occupancy';
import {
  clamp,
  clampRowOrigin,
  clampRows,
  clampSpan,
  getPlacementStyle,
  getStackSpanBounds,
  isSamePlacement,
  normalizePlacement,
} from './placement';
import {
  ContainerElement,
  ContainerHeaderElement,
  CornerResizeGripElement,
  ResizeHandleElement,
  TopLevelResizeHandleElement,
} from './styles';
import { useDashboardGestures } from './use-dashboard-gestures';
import { useDashboardNodeInteraction } from './use-dashboard-node';

import type { ForwardedRef, ReactNode } from 'react';
import type {
  CubeDashboardContainerProps,
  DashboardContainerKind,
  DashboardPlacement,
  DashboardPlacementChangeInput,
  DashboardPlacementChangeItem,
  DashboardPlacementChangePhase,
  DashboardPlacementChangeReason,
  DashboardTreeContextValue,
} from './types';

export interface DashboardContainerShellProps
  extends CubeDashboardContainerProps {
  kind: DashboardContainerKind;
  content: ReactNode;
}

export const DashboardContainerShell = forwardRef(
  function DashboardContainerShell(
    props: DashboardContainerShellProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    const {
      id,
      title,
      kind,
      content,
      isSelectable,
      isMovable = false,
      isResizable = false,
      minColumns = 1,
      maxColumns = 12,
      minRows = 1,
      maxRows,
      onPlacementChange,
      moveLabel,
      resizeLabel,
      onSettingsPress,
      settingsLabel,
      onDeletePress,
      onDuplicatePress,
      duplicateLabel,
      actions,
      onMenuAction,
      deleteLabel,
      column,
      row,
      columns,
      rows = 1,
      children,
      mods,
      styles: explicitStyles,
      style,
      'aria-label': ariaLabel,
      ...otherProps
    } = props;
    const { t } = useI18n();
    const metrics = useContext(DashboardMetricsContext);
    const localRef = useRef<HTMLDivElement>(null);
    const combinedRef = useCombinedRefs(ref, localRef);
    const node = useDashboardNodeInteraction({
      id,
      isContainer: true,
      isSelectable,
    });

    useLayoutEffect(() => {
      node.editing.markArriving(id);
    }, [id, node.editing.markArriving]);

    if (node.containerDepth > 3) {
      throw new Error(
        `Dashboard container "${id}" exceeds the maximum nesting depth of 3.`,
      );
    }

    const extractedStyles = extractStyles(props, CONTAINER_STYLES);
    const styles: Styles = { ...extractedStyles, ...explicitStyles };
    const normalizedPlacement =
      node.tree.parentKind === 'root'
        ? {
            column: 0,
            row: clampRowOrigin(row),
            columns: 12,
            rows: clampRows(rows, 1),
          }
        : normalizePlacement(
            { column, row, columns, rows },
            node.tree.parentColumns,
            node.tree.parentRows,
          );
    const placementStyle = getPlacementStyle(node.tree, normalizedPlacement);
    const childMinimum = getContainerChildMinimum(
      kind,
      children,
      normalizedPlacement.columns,
      normalizedPlacement.rows,
    );
    const descendantContainerDepth =
      getDashboardDescendantContainerDepth(children);
    const isEmpty = !hasContainerLayoutChildren(kind, children);
    const columnLimit = node.tree.parentColumns;
    const rowLimit =
      node.tree.parentKind === 'root'
        ? Math.max(
            childMinimum.rows,
            clampRows(maxRows, Math.max(12, normalizedPlacement.rows)),
          )
        : node.tree.parentRows;
    const resolvedMinColumns = clamp(
      Math.max(clampSpan(minColumns, 1), childMinimum.columns),
      1,
      columnLimit,
    );
    // A stack cannot usefully grow past what its children can absorb: the extra
    // tracks would have no taker and would read as trailing dead space.
    const resolvedMaxColumns = clamp(
      Math.min(
        clampSpan(maxColumns, columnLimit),
        childMinimum.maxColumns ?? columnLimit,
      ),
      resolvedMinColumns,
      columnLimit,
    );
    const resolvedMinRows = clamp(
      Math.max(clampRows(minRows, 1), childMinimum.rows),
      1,
      rowLimit,
    );
    const resolvedMaxRows = clamp(
      Math.min(clampRows(maxRows, rowLimit), childMinimum.maxRows ?? rowLimit),
      resolvedMinRows,
      rowLimit,
    );
    const canMove = isMovable && !!onPlacementChange;
    const canMoveColumns =
      canMove &&
      node.tree.parentKind !== 'root' &&
      node.tree.parentKind !== 'vertical-stack';
    const canMoveRows = canMove && node.tree.parentKind !== 'horizontal-stack';
    // Inside a stack the reachable range is narrower than the declared one —
    // see `getStackSpanBounds`. A container pinned between the two gets no grip
    // rather than one that cannot move.
    const stackBounds = getStackSpanBounds(
      node.tree,
      normalizedPlacement,
      node.tree.parentKind === 'vertical-stack'
        ? resolvedMinRows
        : resolvedMinColumns,
      node.tree.parentKind === 'vertical-stack'
        ? resolvedMaxRows
        : resolvedMaxColumns,
    );
    const canResizeColumns =
      isResizable &&
      !!onPlacementChange &&
      node.tree.parentKind !== 'root' &&
      node.tree.parentKind !== 'vertical-stack' &&
      (stackBounds?.axis === 'columns'
        ? stackBounds.max > stackBounds.min
        : resolvedMaxColumns > resolvedMinColumns);
    const canResizeRows =
      isResizable &&
      !!onPlacementChange &&
      node.tree.parentKind !== 'horizontal-stack' &&
      (stackBounds?.axis === 'rows'
        ? stackBounds.max > stackBounds.min
        : resolvedMaxRows > resolvedMinRows);
    const canResize = canResizeColumns || canResizeRows;
    const resizeAxis = canResizeColumns ? (canResizeRows ? 'both' : 'x') : 'y';
    const shouldRenderTitle = kind === 'tabs' && !!title;
    const label = ariaLabel ?? (typeof title === 'string' ? title : id);
    const baseProps = filterBaseProps(otherProps, {
      eventProps: true,
      labelable: true,
    });
    const gestures = useDashboardGestures({
      id,
      isContainer: true,
      containerKind: kind,
      nodeRef: localRef,
      tree: node.tree,
      editing: node.editing,
      metrics,
      placement: normalizedPlacement,
      isSelected: node.isSelected,
      selectSelf: node.selectSelf,
      onPlacementChange,
      canMove,
      canMoveColumns,
      canMoveRows,
      canResize,
      canResizeColumns,
      canResizeRows,
      minColumns: resolvedMinColumns,
      maxColumns: resolvedMaxColumns,
      minRows: resolvedMinRows,
      maxRows: resolvedMaxRows,
      isRootChild: node.tree.parentKind === 'root',
      maximumContainerParentDepth: Math.max(0, 2 - descendantContainerDepth),
    });
    const { isMoving, isResizing, dropPreview, surfaceMoveProps, resizeProps } =
      gestures;
    const handleSettingsPress = useEvent(() => {
      node.selectSelf(false);
      onSettingsPress?.();
    });
    const handleDeletePress = useEvent(() => {
      node.selectSelf(false);
      onDeletePress?.();
    });
    const handleDuplicatePress = useEvent(() => {
      node.selectSelf(false);
      onDuplicatePress?.();
    });
    const handleMenuResize = useEvent((next: DashboardPlacement) => {
      gestures.reportPlacement(next, 'resize', 'commit', 'command');
    });
    const resolvedMods = {
      ...mods,
      depth: String(node.containerDepth),
      titled: shouldRenderTitle,
      selected: node.isSelected,
      arriving: node.editing.arrivingIds.has(id),
      hovered: node.isHovered,
      'focus-within': node.isFocusWithin,
      editing: node.editing.isEditing,
      empty: isEmpty,
      dragging: node.editing.movingId !== null,
      movable: canMove,
      moving: isMoving,
      resizing: isResizing,
    };
    const ContainerResizeHandleElement =
      node.tree.parentKind === 'root'
        ? TopLevelResizeHandleElement
        : ResizeHandleElement;

    return (
      <ContainerElement
        {...mergeProps(baseProps, node.interactionProps, surfaceMoveProps)}
        ref={combinedRef}
        role="group"
        aria-label={moveLabel ?? label}
        aria-roledescription={t('dashboard.container', 'Dashboard container')}
        tabIndex={node.canSelect || canMove ? 0 : undefined}
        data-dashboard-node="container"
        data-dashboard-node-id={id}
        data-dashboard-depth={node.containerDepth}
        data-dashboard-column={normalizedPlacement.column}
        data-dashboard-row={normalizedPlacement.row}
        data-dashboard-columns={normalizedPlacement.columns}
        data-dashboard-rows={normalizedPlacement.rows}
        data-dashboard-min-columns={resolvedMinColumns}
        data-dashboard-max-columns={Math.max(
          resolvedMinColumns,
          clampSpan(maxColumns, 12),
        )}
        data-dashboard-min-rows={resolvedMinRows}
        data-dashboard-max-rows={
          maxRows === undefined
            ? Number.MAX_SAFE_INTEGER
            : Math.max(resolvedMinRows, clampRows(maxRows, resolvedMinRows))
        }
        data-selected={node.isSelected || undefined}
        data-arriving={node.editing.arrivingIds.has(id) || undefined}
        data-moving={isMoving || undefined}
        data-resizing={isResizing || undefined}
        data-dashboard-empty={isEmpty || undefined}
        mods={resolvedMods}
        styles={styles}
        style={{ ...placementStyle, ...style }}
      >
        {shouldRenderTitle ? (
          <ContainerHeaderElement>{title}</ContainerHeaderElement>
        ) : null}
        {content}
        <DashboardNodeActions
          label={label}
          mods={resolvedMods}
          qaAttribute="data-dashboard-container-actions"
          nodeId={id}
          isSelected={node.isSelected}
          placement={normalizedPlacement}
          bounds={{
            minColumns: resolvedMinColumns,
            maxColumns: resolvedMaxColumns,
            minRows: resolvedMinRows,
            maxRows: resolvedMaxRows,
            parentColumns: node.tree.parentColumns,
            parentRows: rowLimit,
          }}
          canResizeColumns={canResizeColumns}
          canResizeRows={canResizeRows}
          nodeRef={localRef}
          actions={actions}
          settingsLabel={settingsLabel}
          duplicateLabel={duplicateLabel}
          deleteLabel={deleteLabel}
          onResize={handleMenuResize}
          onSettingsPress={onSettingsPress && handleSettingsPress}
          onDuplicatePress={onDuplicatePress && handleDuplicatePress}
          onDeletePress={onDeletePress && handleDeletePress}
          onMenuAction={onMenuAction}
        />
        {canResize ? (
          <ContainerResizeHandleElement
            {...resizeProps}
            type="button"
            aria-label={
              resizeLabel ??
              t('dashboard.resizeContainer', 'Resize dashboard container')
            }
            data-dashboard-container-resize-handle=""
            data-dashboard-resize-axis={resizeAxis}
            data-dashboard-no-select=""
            aria-hidden={!node.isSelected || undefined}
            tabIndex={node.isSelected ? undefined : -1}
            mods={{
              ...resolvedMods,
              axis: resizeAxis,
              corner: resizeAxis === 'both',
            }}
          >
            <span data-element="Icon">
              {resizeAxis === 'both' ? (
                <CornerResizeGripElement />
              ) : (
                <GripVerticalIcon size="1.5x" />
              )}
            </span>
          </ContainerResizeHandleElement>
        ) : null}
        {renderDashboardDropPreview(
          dropPreview,
          t('dashboard.dropBlocked', 'This position is already taken'),
        )}
      </ContainerElement>
    );
  },
);

export function DashboardContainer(
  kind: Exclude<DashboardContainerKind, 'tabs'>,
  props: CubeDashboardContainerProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { id, columns, rows = 1, children } = props;
  const tree = useContext(DashboardTreeContext);
  const containerDepth = tree.containerDepth + 1;
  const resolvedColumns =
    tree.parentKind === 'root'
      ? 12
      : Math.min(clampSpan(columns, tree.parentColumns), tree.parentColumns);
  const resolvedRows =
    tree.parentKind === 'root'
      ? clampRows(rows, 1)
      : Math.min(clampRows(rows, 1), tree.parentRows);
  const childTree = useMemo<DashboardTreeContextValue>(
    () => ({
      containerDepth,
      parentKind: kind,
      parentId: id,
      layoutParentId: id,
      parentColumns: resolvedColumns,
      parentRows: resolvedRows,
      ancestorIds: [...tree.ancestorIds, id],
      parentStackUsed: getDashboardStackUsage(
        kind,
        children,
        resolvedColumns,
        resolvedRows,
      ),
    }),
    [
      children,
      containerDepth,
      id,
      kind,
      resolvedColumns,
      resolvedRows,
      tree.ancestorIds,
    ],
  );

  const content = (
    <DashboardTreeContext.Provider value={childTree}>
      <DashboardContainerContent
        id={id}
        kind={kind}
        columns={resolvedColumns}
        rows={resolvedRows}
        depth={containerDepth}
        ancestorIds={[...tree.ancestorIds, id]}
      >
        {children}
      </DashboardContainerContent>
    </DashboardTreeContext.Provider>
  );

  return (
    <DashboardContainerShell
      {...props}
      ref={ref}
      kind={kind}
      content={content}
    />
  );
}

export const DashboardHorizontalStack = forwardRef(
  function DashboardHorizontalStack(
    props: CubeDashboardContainerProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    return DashboardContainer('horizontal-stack', props, ref);
  },
);
DashboardHorizontalStack.displayName = 'DashboardHorizontalStack';

export const DashboardVerticalStack = forwardRef(
  function DashboardVerticalStack(
    props: CubeDashboardContainerProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    return DashboardContainer('vertical-stack', props, ref);
  },
);
DashboardVerticalStack.displayName = 'DashboardVerticalStack';

export const DashboardGrid = forwardRef(function DashboardGrid(
  props: CubeDashboardContainerProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  return DashboardContainer('grid', props, ref);
});
DashboardGrid.displayName = 'DashboardGrid';
