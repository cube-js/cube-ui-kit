import { CONTAINER_STYLES, filterBaseProps, Styles } from '@tenphi/tasty';
import { forwardRef, useContext, useRef, useState } from 'react';
import { useMove } from 'react-aria';

import { useEvent } from '../../../_internal/hooks';
import { useI18n } from '../../../i18n';
import { GripVerticalIcon } from '../../../icons/GripVerticalIcon';
import { mergeProps, useCombinedRefs } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';
import { Button } from '../../actions/Button/Button';

import { DashboardMetricsContext } from './context';
import { DashboardNodeActions } from './DashboardNodeActions';
import { renderDashboardDropPreview } from './drag';
import {
  clamp,
  clampRows,
  clampSpan,
  getPlacementStyle,
  getStackSpanBounds,
  isSamePlacement,
  normalizePlacement,
} from './placement';
import {
  CornerResizeGripElement,
  ResizeHandleElement,
  WidgetElement,
  WidgetSurfaceElement,
} from './styles';
import { useDashboardGestures } from './use-dashboard-gestures';
import { useDashboardNodeInteraction } from './use-dashboard-node';

import type { ForwardedRef } from 'react';
import type {
  CubeDashboardWidgetProps,
  DashboardPlacement,
  DashboardPlacementChangeInput,
  DashboardPlacementChangeItem,
  DashboardPlacementChangePhase,
  DashboardPlacementChangeReason,
} from './types';

export const DashboardWidget = forwardRef(function DashboardWidget(
  props: CubeDashboardWidgetProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    id,
    children,
    isCard = false,
    isSelectable,
    onSettingsPress,
    settingsLabel,
    onDeletePress,
    onDuplicatePress,
    duplicateLabel,
    actions,
    onMenuAction,
    deleteLabel,
    isMovable = false,
    isResizable = false,
    minColumns = 1,
    maxColumns = 12,
    minRows = 1,
    maxRows,
    onPlacementChange,
    moveLabel,
    resizeLabel,
    column,
    row,
    columns,
    rows,
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
    isContainer: false,
    isSelectable,
  });

  if (node.tree.parentKind === 'root') {
    throw new Error(
      `Dashboard.Widget "${id}" must be placed inside a Dashboard container.`,
    );
  }

  const resolvedMinColumns = clamp(
    clampSpan(minColumns, 1),
    1,
    node.tree.parentColumns,
  );
  const resolvedMaxColumns = clamp(
    clampSpan(maxColumns, node.tree.parentColumns),
    resolvedMinColumns,
    node.tree.parentColumns,
  );
  const resolvedMinRows = Math.min(clampRows(minRows, 1), node.tree.parentRows);
  const resolvedMaxRows = clamp(
    clampRows(maxRows, node.tree.parentRows),
    resolvedMinRows,
    node.tree.parentRows,
  );
  const normalizedPlacement = normalizePlacement(
    {
      column,
      row,
      columns: clamp(
        clampSpan(columns, node.tree.parentColumns),
        resolvedMinColumns,
        resolvedMaxColumns,
      ),
      rows: clamp(clampRows(rows, 1), resolvedMinRows, resolvedMaxRows),
    },
    node.tree.parentColumns,
    node.tree.parentRows,
  );
  const canMove = isMovable && !!onPlacementChange;
  const canMoveColumns = canMove && node.tree.parentKind !== 'vertical-stack';
  const canMoveRows = canMove && node.tree.parentKind !== 'horizontal-stack';
  // In a stack the reachable range is narrower than the declared one: a child
  // shrinks to its own minimum and grows only into what its siblings left over,
  // so a child pinned between the two has no grip at all rather than a grip
  // that does nothing.
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

  const extractedStyles = extractStyles(props, CONTAINER_STYLES);
  const styles: Styles = { ...extractedStyles, ...explicitStyles };
  const placementStyle = getPlacementStyle(node.tree, normalizedPlacement);
  const baseProps = filterBaseProps(otherProps, {
    eventProps: true,
    labelable: true,
  });
  const resolvedLabel = ariaLabel ?? id;
  const isAddSlot =
    (
      props as CubeDashboardWidgetProps & {
        'data-dashboard-add-slot'?: unknown;
      }
    )['data-dashboard-add-slot'] !== undefined;
  const {
    isMoving,
    isResizing,
    dropPreview,
    surfaceMoveProps,
    resizeProps,
    reportPlacement,
  } = useDashboardGestures({
    id,
    isContainer: false,
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
    isRootChild: false,
  });
  const resolvedMods = {
    ...mods,
    'add-slot': isAddSlot,
    card: isCard,
    selected: node.isSelected,
    hovered: node.isHovered,
    'focus-within': node.isFocusWithin,
    editing: node.editing.isEditing,
    dragging: node.editing.movingId !== null,
    movable: canMove,
    moving: isMoving,
    resizing: isResizing,
  };
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
    reportPlacement(next, 'resize', 'commit', 'command');
  });

  return (
    <WidgetElement
      {...mergeProps(baseProps, node.interactionProps, surfaceMoveProps)}
      ref={combinedRef}
      role="group"
      aria-label={moveLabel ?? resolvedLabel}
      aria-roledescription={t(
        canMove ? 'dashboard.movableWidget' : 'dashboard.widget',
        canMove ? 'Movable dashboard widget' : 'Dashboard widget',
      )}
      tabIndex={node.canSelect || canMove ? 0 : undefined}
      data-dashboard-node="widget"
      data-dashboard-node-id={id}
      data-dashboard-column={normalizedPlacement.column}
      data-dashboard-row={normalizedPlacement.row}
      data-dashboard-columns={normalizedPlacement.columns}
      data-dashboard-rows={normalizedPlacement.rows}
      data-dashboard-min-columns={clampSpan(minColumns, 1)}
      data-dashboard-max-columns={Math.max(
        clampSpan(minColumns, 1),
        clampSpan(maxColumns, 12),
      )}
      data-dashboard-min-rows={clampRows(minRows, 1)}
      data-dashboard-max-rows={
        maxRows === undefined
          ? Number.MAX_SAFE_INTEGER
          : Math.max(clampRows(minRows, 1), clampRows(maxRows, 1))
      }
      data-selected={node.isSelected || undefined}
      data-moving={isMoving || undefined}
      data-resizing={isResizing || undefined}
      mods={resolvedMods}
      style={{ ...placementStyle, ...style }}
    >
      <WidgetSurfaceElement mods={resolvedMods} styles={styles}>
        {children}
      </WidgetSurfaceElement>
      <DashboardNodeActions
        label={resolvedLabel}
        mods={resolvedMods}
        qaAttribute="data-dashboard-widget-actions"
        nodeId={id}
        isSelected={node.isSelected}
        placement={normalizedPlacement}
        bounds={{
          minColumns: resolvedMinColumns,
          maxColumns: resolvedMaxColumns,
          minRows: resolvedMinRows,
          maxRows: resolvedMaxRows,
          parentColumns: node.tree.parentColumns,
          parentRows: node.tree.parentRows,
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
        <ResizeHandleElement
          {...resizeProps}
          type="button"
          aria-label={
            resizeLabel ??
            t('dashboard.resizeWidget', 'Resize dashboard widget')
          }
          data-dashboard-resize-handle=""
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
        </ResizeHandleElement>
      ) : null}
      {renderDashboardDropPreview(
        dropPreview,
        t('dashboard.dropBlocked', 'This position is already taken'),
      )}
    </WidgetElement>
  );
});
