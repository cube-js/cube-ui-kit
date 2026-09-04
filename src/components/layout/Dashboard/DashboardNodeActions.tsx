import { useMemo, useState } from 'react';

import { useEvent } from '../../../_internal/hooks';
import { useI18n } from '../../../i18n';
import { ArrowsHorizontalIcon } from '../../../icons/ArrowsHorizontalIcon';
import { ArrowsInHorizontalIcon } from '../../../icons/ArrowsInHorizontalIcon';
import { ArrowsInVerticalIcon } from '../../../icons/ArrowsInVerticalIcon';
import { ArrowsMaximizeIcon } from '../../../icons/ArrowsMaximizeIcon';
import { ArrowsMinimizeIcon } from '../../../icons/ArrowsMinimizeIcon';
import { ArrowsVerticalIcon } from '../../../icons/ArrowsVerticalIcon';
import { CopyIcon } from '../../../icons/CopyIcon';
import { MaximizeIcon } from '../../../icons/MaximizeIcon';
import { MoreIcon } from '../../../icons/MoreIcon';
import { SettingsIcon } from '../../../icons/SettingsIcon';
import { TrashIcon } from '../../../icons/TrashIcon';
import { Button } from '../../actions/Button/Button';
import { Menu } from '../../actions/Menu/Menu';

import { readDashboardStackAxis } from './drag';
import { getLargestFreeRect } from './occupancy';
import { placementsOverlap } from './placement';
import { NodeActionsElement } from './styles';

import type { Key } from '@react-types/shared';
import type { ModValue } from '@tenphi/tasty';
import type { ReactNode, RefObject } from 'react';
import type {
  DashboardNodeAction,
  DashboardPlacement,
  DashboardSizeBounds,
} from './types';

type DashboardSizeCommand =
  | 'expand-width'
  | 'shrink-width'
  | 'expand-height'
  | 'shrink-height'
  | 'expand-both'
  | 'shrink-both'
  | 'fill';

export interface DashboardNodeActionsProps {
  /** Accessible name of the node, used in the fallback labels. */
  label: string;
  mods: Record<string, ModValue>;
  /** Marks this cluster for tests and for the drag engine's target checks. */
  qaAttribute:
    | 'data-dashboard-widget-actions'
    | 'data-dashboard-container-actions';
  nodeId: string;
  isSelected: boolean;
  placement: DashboardPlacement;
  bounds: DashboardSizeBounds;
  canResizeColumns: boolean;
  canResizeRows: boolean;
  /** The node itself; its parent grid is read for occupancy on menu open. */
  nodeRef: RefObject<HTMLElement | null>;
  onResize: (placement: DashboardPlacement) => void;
  onSettingsPress?: () => void;
  settingsLabel?: string;
  onDuplicatePress?: () => void;
  duplicateLabel?: string;
  onDeletePress?: () => void;
  deleteLabel?: string;
  actions?: readonly DashboardNodeAction[];
  onMenuAction?: (key: string) => void;
}

/** Sibling boxes, read straight off the DOM the way the drag engine does. */
function readSiblingPlacements(
  parentElement: HTMLElement | null,
  nodeId: string,
): DashboardPlacement[] {
  if (!parentElement) return [];

  return Array.from(parentElement.children).flatMap((child) => {
    if (!(child instanceof HTMLElement)) return [];
    if (!child.dataset.dashboardNode) return [];
    if (child.dataset.dashboardNodeId === nodeId) return [];
    if (child.dataset.dashboardAddSlot !== undefined) return [];
    const column = Number(child.dataset.dashboardColumn);
    const row = Number(child.dataset.dashboardRow);
    const columns = Number(child.dataset.dashboardColumns);
    const rows = Number(child.dataset.dashboardRows);
    if (![column, row, columns, rows].every(Number.isFinite)) return [];

    return [{ column, row, columns, rows }];
  });
}

/**
 * What each size command would produce, or nothing when it would change nothing.
 *
 * In a layout addressed by position, two things can stop a command: the node's
 * own bounds together with the space left in the parent, and an occupant in the
 * way. Both are checked, because "disabled when pressing it has no effect" is
 * the whole point — an enabled item that silently does nothing is worse than a
 * greyed-out one. In a stack, whose children are packed by sequence rather
 * than addressed, "in the way" is instead the room the siblings leave over.
 *
 * Resolved when the menu opens rather than on every render: the occupancy half
 * is a DOM read, and a node re-renders on every frame of a neighbour's drag.
 */
export function getDashboardSizeCommands(
  placement: DashboardPlacement,
  bounds: DashboardSizeBounds,
  siblings: readonly DashboardPlacement[],
  canResizeColumns: boolean,
  canResizeRows: boolean,
  /** Set for a stack child, which is bounded by free space, not by overlap. */
  stackAxis: 'columns' | 'rows' | null = null,
): Map<DashboardSizeCommand, DashboardPlacement> {
  const resolved = new Map<DashboardSizeCommand, DashboardPlacement>();
  const fits = (candidate: DashboardPlacement) => {
    if (
      candidate.columns < bounds.minColumns ||
      candidate.columns > bounds.maxColumns ||
      candidate.rows < bounds.minRows ||
      candidate.rows > bounds.maxRows
    ) {
      return false;
    }

    // A stack packs by sequence, so its children's coordinates are derived and
    // an overlap test would read every growth as blocked. What actually bounds
    // one is the room its siblings leave over — and shrinking always has room.
    if (stackAxis) {
      const capacity =
        stackAxis === 'columns' ? bounds.parentColumns : bounds.parentRows;
      const used = siblings.reduce(
        (total, sibling) => total + sibling[stackAxis],
        0,
      );

      return used + candidate[stackAxis] <= capacity;
    }

    return (
      candidate.column + candidate.columns <= bounds.parentColumns &&
      candidate.row + candidate.rows <= bounds.parentRows &&
      !siblings.some((sibling) => placementsOverlap(candidate, sibling))
    );
  };
  const propose = (
    command: DashboardSizeCommand,
    columns: number,
    rows: number,
  ) => {
    const candidate = { ...placement, columns, rows };
    const changes =
      candidate.columns !== placement.columns ||
      candidate.rows !== placement.rows;

    if (changes && fits(candidate)) resolved.set(command, candidate);
  };

  if (canResizeColumns) {
    propose('expand-width', placement.columns + 1, placement.rows);
    propose('shrink-width', placement.columns - 1, placement.rows);
  }
  if (canResizeRows) {
    propose('expand-height', placement.columns, placement.rows + 1);
    propose('shrink-height', placement.columns, placement.rows - 1);
  }
  if (canResizeColumns && canResizeRows) {
    propose('expand-both', placement.columns + 1, placement.rows + 1);
    propose('shrink-both', placement.columns - 1, placement.rows - 1);

    const largest = getLargestFreeRect(
      placement,
      siblings,
      bounds.parentColumns,
      bounds.parentRows,
      bounds.maxColumns,
      bounds.maxRows,
    );
    propose('fill', largest.columns, largest.rows);
  }

  return resolved;
}

/**
 * Every action a selected node offers, behind one trigger.
 *
 * Settings and Delete used to sit on the node as two loose round buttons, which
 * capped how many actions a node could ever have and left resizing as a
 * pointer-only gesture. One menu holds the same two actions plus the size
 * commands, a consumer's own entries, and whatever comes next — and the size
 * commands double as the accessible route to resizing.
 */
export function DashboardNodeActions(props: DashboardNodeActionsProps) {
  const {
    label,
    mods,
    qaAttribute,
    nodeId,
    isSelected,
    placement,
    bounds,
    canResizeColumns,
    canResizeRows,
    nodeRef,
    onResize,
    onSettingsPress,
    settingsLabel,
    onDuplicatePress,
    duplicateLabel,
    onDeletePress,
    deleteLabel,
    actions,
    onMenuAction,
  } = props;
  const { t } = useI18n();
  const [sizeCommands, setSizeCommands] = useState<
    Map<DashboardSizeCommand, DashboardPlacement>
  >(() => new Map());

  const canResize = canResizeColumns || canResizeRows;
  const hasConsumerActions = !!(
    onSettingsPress ||
    onDuplicatePress ||
    onDeletePress ||
    actions?.length
  );

  /** Which size commands this node's axes make sense for at all. */
  const sizeItems = useMemo(() => {
    const both = canResizeColumns && canResizeRows;
    const candidates: {
      key: DashboardSizeCommand;
      icon: ReactNode;
      label: string;
      show: boolean;
    }[] = [
      {
        key: 'expand-width',
        icon: <ArrowsHorizontalIcon />,
        label: t('dashboard.expandWidth', 'Widen'),
        show: canResizeColumns,
      },
      {
        key: 'shrink-width',
        icon: <ArrowsInHorizontalIcon />,
        label: t('dashboard.shrinkWidth', 'Narrow'),
        show: canResizeColumns,
      },
      {
        key: 'expand-height',
        icon: <ArrowsVerticalIcon />,
        label: t('dashboard.expandHeight', 'Make taller'),
        show: canResizeRows,
      },
      {
        key: 'shrink-height',
        icon: <ArrowsInVerticalIcon />,
        label: t('dashboard.shrinkHeight', 'Make shorter'),
        show: canResizeRows,
      },
      {
        key: 'expand-both',
        icon: <ArrowsMaximizeIcon />,
        label: t('dashboard.expandBoth', 'Grow on both axes'),
        show: both,
      },
      {
        key: 'shrink-both',
        icon: <ArrowsMinimizeIcon />,
        label: t('dashboard.shrinkBoth', 'Shrink on both axes'),
        show: both,
      },
      {
        key: 'fill',
        icon: <MaximizeIcon />,
        label: t('dashboard.fill', 'Fill available space'),
        show: both,
      },
    ];

    return candidates.filter((item) => item.show);
  }, [canResizeColumns, canResizeRows, t]);

  const handleOpenChange = useEvent((isOpen: boolean) => {
    if (!isOpen || !canResize) return;
    const stackAxis = readDashboardStackAxis(
      nodeRef.current?.parentElement ?? null,
    );

    setSizeCommands(
      getDashboardSizeCommands(
        placement,
        bounds,
        readSiblingPlacements(nodeRef.current?.parentElement ?? null, nodeId),
        canResizeColumns,
        canResizeRows,
        stackAxis,
      ),
    );
  });

  const disabledKeys = useMemo(
    () => [
      ...sizeItems
        .filter((item) => !sizeCommands.has(item.key))
        .map((item) => item.key),
      ...(actions ?? [])
        .filter((action) => action.isDisabled)
        .map((action) => action.id),
    ],
    [actions, sizeCommands, sizeItems],
  );

  const handleAction = useEvent((key: Key) => {
    const command = String(key);
    const resized = sizeCommands.get(command as DashboardSizeCommand);

    if (resized) {
      onResize(resized);
      return;
    }
    if (command === 'settings') return onSettingsPress?.();
    if (command === 'duplicate') return onDuplicatePress?.();
    if (command === 'delete') return onDeletePress?.();

    onMenuAction?.(command);
  });

  if (!hasConsumerActions && !canResize) return null;

  const menuLabel = t('dashboard.nodeMenu', 'Actions for {{node}}', {
    node: label,
  });

  return (
    <NodeActionsElement
      aria-hidden={!isSelected || undefined}
      mods={mods}
      {...{ [qaAttribute]: '' }}
    >
      <Menu.Trigger onOpenChange={handleOpenChange}>
        <Button
          qa="DashboardNodeMenuButton"
          size="small"
          type="primary"
          radius="round"
          icon={<MoreIcon />}
          aria-label={menuLabel}
          tabIndex={isSelected ? undefined : -1}
        />
        <Menu
          aria-label={menuLabel}
          width="240px"
          disabledKeys={disabledKeys}
          onAction={handleAction}
        >
          {onSettingsPress ? (
            <Menu.Item key="settings" icon={<SettingsIcon />}>
              {settingsLabel ?? t('dashboard.settings', 'Settings')}
            </Menu.Item>
          ) : null}
          {onDuplicatePress ? (
            <Menu.Item key="duplicate" icon={<CopyIcon />}>
              {duplicateLabel ?? t('dashboard.duplicate', 'Duplicate')}
            </Menu.Item>
          ) : null}
          {(actions ?? []).map((action) => (
            <Menu.Item
              key={action.id}
              icon={action.icon}
              description={action.description}
            >
              {action.name}
            </Menu.Item>
          ))}
          {sizeItems.map((item) => (
            <Menu.Item key={item.key} icon={item.icon}>
              {item.label}
            </Menu.Item>
          ))}
          {onDeletePress ? (
            <Menu.Item key="delete" theme="danger" icon={<TrashIcon />}>
              {deleteLabel ?? t('dashboard.delete', 'Delete')}
            </Menu.Item>
          ) : null}
        </Menu>
      </Menu.Trigger>
    </NodeActionsElement>
  );
}
