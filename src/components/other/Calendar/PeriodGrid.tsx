import { Styles, tasty } from '@tenphi/tasty';
import { KeyboardEvent, useLayoutEffect, useRef } from 'react';

import { CALENDAR_CELL_STYLES } from './styled';

const PeriodGridElement = tasty({
  as: 'table',
  role: 'grid',
  styles: {
    borderCollapse: 'collapse',
    borderSpacing: 0,
    // Columns share the width evenly. The owner passes that width explicitly —
    // a percentage here would resolve against the popover's `max-content` box.
    tableLayout: 'fixed',
  },
});

const PeriodGridCellElement = tasty({
  as: 'td',
  role: 'gridcell',
  styles: {
    margin: 0,
    padding: '2bw right bottom',
  },
});

const PeriodGridButtonElement = tasty({
  as: 'button',
  'data-popover-keep': true,
  styles: {
    ...CALENDAR_CELL_STYLES,
    width: '100%',
    height: '4x',
    padding: '0 .5x',
  },
});

export interface CubePeriodGridCell {
  /** Stable identity of the cell, also used as the React key. */
  key: string;
  label: string;
  /** Overrides the accessible name when the visible label is ambiguous. */
  ariaLabel?: string;
  isSelected?: boolean;
  /** Whether the cell contains today. */
  isCurrent?: boolean;
  isDisabled?: boolean;
  /** Whether the cell belongs to a neighbouring page (e.g. an adjacent decade). */
  isOutside?: boolean;
}

export interface CubePeriodGridProps {
  cells: CubePeriodGridCell[];
  columns: number;
  /** Index of the cell that holds the roving tab stop. */
  focusedIndex: number;
  autoFocus?: boolean;
  'aria-label'?: string;
  styles?: Styles;
  onCellPress: (index: number) => void;
  /** Focus moved to another cell of the current page. */
  onCellFocus: (index: number) => void;
  /**
   * Focus moved past the edge of the current page by `delta` periods. The owner
   * moves its anchor, which in turn flips the page and the focused index.
   */
  onMoveFocus: (delta: number) => void;
  /** `PageUp` / `PageDown` — one page back or forward. */
  onMovePage: (delta: -1 | 1) => void;
}

/**
 * A keyboard-navigable grid of calendar periods (months, quarters or years).
 *
 * The grid owns rendering, the roving tab stop and DOM focus; the owner owns
 * the periods themselves. Arrow keys that leave the page are reported through
 * `onMoveFocus` so the owner can page and keep focus on the adjacent period.
 */
export function PeriodGrid(props: CubePeriodGridProps) {
  let {
    cells,
    columns,
    focusedIndex,
    autoFocus,
    styles,
    onCellPress,
    onCellFocus,
    onMoveFocus,
    onMovePage,
  } = props;

  let cellRefs = useRef<Array<HTMLButtonElement | null>>([]);
  // Set by the grid's own keyboard handling and by `autoFocus`, so paging with
  // the header buttons never steals focus into the grid.
  let shouldFocusRef = useRef(!!autoFocus);

  let safeIndex = Math.max(0, Math.min(cells.length - 1, focusedIndex));

  cellRefs.current.length = cells.length;

  useLayoutEffect(() => {
    if (shouldFocusRef.current) {
      shouldFocusRef.current = false;
      cellRefs.current[safeIndex]?.focus();
    }
  });

  let moveFocus = (delta: number) => {
    shouldFocusRef.current = true;

    let next = safeIndex + delta;

    // Disabled cells can't hold DOM focus, so step over them instead of
    // stranding the caret on an unreachable period.
    while (next >= 0 && next < cells.length && cells[next].isDisabled) {
      next += delta;
    }

    if (next < 0 || next >= cells.length) {
      onMoveFocus(delta);
    } else {
      onCellFocus(next);
    }
  };

  let focusEdge = (edge: 'start' | 'end') => {
    let step = edge === 'start' ? 1 : -1;
    let index = edge === 'start' ? 0 : cells.length - 1;

    while (index >= 0 && index < cells.length && cells[index].isDisabled) {
      index += step;
    }

    if (index < 0 || index >= cells.length) return;

    shouldFocusRef.current = true;
    onCellFocus(index);
  };

  let onKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
        moveFocus(1);
        break;
      case 'ArrowLeft':
        moveFocus(-1);
        break;
      case 'ArrowDown':
        moveFocus(columns);
        break;
      case 'ArrowUp':
        moveFocus(-columns);
        break;
      case 'Home':
        focusEdge('start');
        break;
      case 'End':
        focusEdge('end');
        break;
      case 'PageUp':
        shouldFocusRef.current = true;
        onMovePage(-1);
        break;
      case 'PageDown':
        shouldFocusRef.current = true;
        onMovePage(1);
        break;
      default:
        return;
    }

    e.preventDefault();
    e.stopPropagation();
  };

  let rows: CubePeriodGridCell[][] = [];

  for (let i = 0; i < cells.length; i += columns) {
    rows.push(cells.slice(i, i + columns));
  }

  return (
    <PeriodGridElement
      aria-label={props['aria-label']}
      styles={styles}
      onKeyDown={onKeyDown}
    >
      <tbody data-element="Body">
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} role="row" data-element="Row">
            {row.map((cell, columnIndex) => {
              let index = rowIndex * columns + columnIndex;

              return (
                <PeriodGridCellElement
                  key={cell.key}
                  aria-selected={!!cell.isSelected}
                >
                  <PeriodGridButtonElement
                    ref={(element: HTMLButtonElement | null) => {
                      cellRefs.current[index] = element;
                    }}
                    type="button"
                    tabIndex={index === safeIndex ? 0 : -1}
                    disabled={cell.isDisabled}
                    aria-label={cell.ariaLabel}
                    mods={{
                      selected: cell.isSelected,
                      current: cell.isCurrent,
                      outside: cell.isOutside,
                      disabled: cell.isDisabled,
                    }}
                    onFocus={() => onCellFocus(index)}
                    onClick={() => onCellPress(index)}
                  >
                    {cell.label}
                  </PeriodGridButtonElement>
                </PeriodGridCellElement>
              );
            })}
          </tr>
        ))}
      </tbody>
    </PeriodGridElement>
  );
}
