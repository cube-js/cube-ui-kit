import { Styles, tasty } from '@tenphi/tasty';

import { Button } from '../../actions/Button/Button';

/**
 * The one stacking context Dashboard owns.
 *
 * Every layer below is ordered on a single flat scale — node bodies 1..3, drop
 * placeholders 4, resize handles 5, node menus 6 — which only works if nothing
 * between the root and a control opens a stacking context of its own. `zIndex: 0`
 * closes the scale off from the host app instead of leaking six levels into it.
 *
 * The `1x` gap is the top-level rhythm and is deliberately not the `gap` prop:
 * that one is the spacing *inside* a container's grid.
 */
export const DashboardElement = tasty({
  qa: 'Dashboard',
  styles: {
    position: 'relative',
    zIndex: 0,
    display: 'grid',
    gridColumns: 'minmax(0, 1fr)',
    gap: '1x',
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  },
});

export const ContainerElement = tasty({
  qa: 'DashboardContainer',
  styles: {
    position: 'relative',
    display: 'grid',
    gridRows: {
      '': 'minmax(0, 1fr)',
      titled: 'auto minmax(0, 1fr)',
    },
    minWidth: 0,
    boxSizing: 'border-box',
    fill: false,
    border: false,
    radius: true,
    padding: {
      '': '1x',
      'depth=2': '5px',
      'depth=3': '2px',
    },
    margin: {
      '': '-8px',
      'depth=2': '-5px',
      'depth=3': '-2px',
    },
    shadow: {
      '': false,
      'editing & empty': '0 0 0 1px #dark.30',
      'editing & hovered': '0 0 0 1px #dark.30',
      'editing & resizing': '0 0 0 1px #dark.30',
      'editing & arriving': '0 0 0 1px #dark.30',
      dragging: '0 0 0 1px #dark.30',
      'editing & focus-visible': '0 0 0 2px #primary-text',
      'selected | moving': '0 0 0 2px #primary',
    },
    outline: 'none',
    // No `z-index` on purpose: a positioned element with one becomes a stacking
    // context, which would trap this container's own chrome (menu 6, grip 5)
    // at the container's level and let a neighbouring node paint over it. The
    // ring is an outside shadow and orders fine in DOM order. This also retires
    // the old `:has([data-selected])` clause, which existed only to lift a
    // container so a selected child's chrome could escape it.
    cursor: {
      '': 'auto',
      movable: 'grab',
      moving: 'grabbing',
    },
    transition: 'shadow, theme',
    touchAction: {
      '': 'auto',
      movable: 'none',
    },
  },
});

export const ContainerHeaderElement = tasty({
  styles: {
    display: 'flex',
    placeContent: 'space-between',
    alignItems: 'center',
    gap: '1x',
    minWidth: 0,
    padding: '0.5x 0.5x 1x',
    preset: 'h6',
    color: '#dark',
    userSelect: 'none',
  },
});

export const ContentGridElement = tasty({
  qa: 'DashboardContainerContent',
  styles: {
    position: 'relative',
    display: 'grid',
    alignItems: 'stretch',
    minWidth: 0,
    boxSizing: 'border-box',
  },
});

export const FreeCellsLayerElement = tasty({
  styles: {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    display: 'grid',
    minWidth: 0,
    pointerEvents: 'none',
  },
});

export const FreeCellElement = tasty({
  qa: 'DashboardFreeCell',
  styles: {
    minWidth: 0,
    minHeight: 0,
    boxSizing: 'border-box',
    pointerEvents: 'auto',
    fill: '#primary.06',
    shadow: 'inset 0 0 0 1px #primary.12',
    radius: true,
    opacity: {
      '': 0,
      highlighted: 1,
    },
    transition: 'opacity 100ms ease-in-out, theme',
  },
});

export const ADD_CELL_BUTTON_STYLES: Styles = {
  // Above `FreeCellsLayerElement` (0), which is absolutely positioned and would
  // otherwise paint over an in-flow grid item, and below the node controls.
  zIndex: 1,
  alignSelf: 'stretch',
  justifySelf: 'stretch',
  minWidth: 0,
  minHeight: 0,
  padding: 0,
  fill: {
    '': '#primary.06',
    'hovered | focused': '#primary.12',
    pressed: '#primary.18',
  },
  color: '#primary-text',
  border: '0',
  outline: {
    '': false,
    focused: false,
  },
  shadow: {
    '': 'inset 0 0 0 1px #primary.12',
    'hovered | focused': 'inset 0 0 0 1px #primary',
  },
  radius: true,
  transition: 'opacity 100ms ease-in-out, theme',
  visibility: {
    '': 'visible',
    '@parent(:has(> [data-dashboard-drop-covers-add-slot]))': 'hidden',
  },
};

export const RootAddButtonElement = tasty(Button, {
  qa: 'DashboardRootAddButton',
  styles: {
    width: '100%',
    minHeight: '6x',
    padding: 0,
    fill: '#surface-2',
    border: '0',
    shadow: 'inset 0 0 0 1px #border',
    radius: true,
  },
});

export const DropPlaceholderElement = tasty({
  qa: 'DashboardDropPlaceholder',
  styles: {
    position: 'absolute',
    boxSizing: 'border-box',
    pointerEvents: 'none',
    zIndex: 4,
    fill: {
      '': '#primary.10',
      danger: '#danger.10',
    },
    shadow: {
      '': '0 0 0 1px #primary',
      danger: '0 0 0 1px #danger',
    },
    radius: true,
    transition: 'inset 80ms linear, width 80ms linear, height 80ms linear',
    display: 'grid',
    placeItems: 'center',

    // A blocked landing must not be signalled by colour alone. The icon is the
    // non-colour half of that signal and carries the accessible name.
    Icon: {
      display: 'grid',
      placeItems: 'center',
      color: '#danger-text',
      opacity: {
        '': 0,
        danger: 1,
      },
    },
  },
});

export const WidgetElement = tasty({
  qa: 'DashboardWidget',
  styles: {
    position: 'relative',
    minWidth: 0,
    minHeight: 0,
    boxSizing: 'border-box',
    outline: 'none',
    visibility: {
      '': 'visible',
      'add-slot & @parent(:has(> [data-dashboard-drop-covers-add-slot]))':
        'hidden',
    },
    // The raise lives on `WidgetSurfaceElement` instead — see `DashboardElement`.
    cursor: {
      '': 'auto',
      movable: 'grab',
      moving: 'grabbing',
    },
    touchAction: {
      '': 'auto',
      movable: 'none',
    },
  },
});

export const WidgetSurfaceElement = tasty({
  styles: {
    position: 'relative',
    // The painted body of a widget, and the only part that should be raised on
    // hover or selection. Keeping the raise here rather than on the placement
    // wrapper is what lets a neighbour's menu and resize grip stay on top.
    zIndex: {
      '': 1,
      'hovered | focus-within': 2,
      selected: 3,
    },
    width: '100%',
    height: '100%',
    minWidth: 0,
    minHeight: 0,
    boxSizing: 'border-box',
    overflow: 'hidden',
    fill: '#surface-2',
    radius: true,
    shadow: {
      '': false,
      card: '0 0 0 1px #border',
      hovered: '0 0 0 1px #dark.30',
      'focus-within': '0 0 0 2px #primary-text',
      'selected | moving': '0 0 0 2px #primary',
    },
    transition: 'shadow, theme',
  },
});

export const NodeActionsElement = tasty({
  styles: {
    position: 'absolute',
    top: 0,
    right: '(-1 * $size-sm / 2)',
    zIndex: 6,
    display: 'flex',
    gap: '0.5x',
    transform: 'translateY(-50%)',
    opacity: {
      '': 0,
      selected: 1,
    },
    pointerEvents: {
      '': 'none',
      selected: 'auto',
    },
    transition: 'opacity 120ms ease-in-out',
  },
});

export const CornerResizeGripElement = tasty({
  qa: 'DashboardResizeCornerGrip',
  styles: {
    width: '10px',
    height: '10px',
    boxSizing: 'border-box',
    borderRight: '2px solid #dark.40',
    borderBottom: '2px solid #dark.40',
    radius: '4px bottom-right',
  },
});

export const ResizeHandleElement = tasty({
  qa: 'DashboardResizeHandle',
  as: 'button',
  styles: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    top: {
      '': 'auto',
      'axis=x': '50%',
    },
    zIndex: 5,
    display: 'grid',
    placeItems: 'center',
    width: {
      '': '3.5x',
      'axis=x': '2x',
    },
    height: {
      '': '3.5x',
      'axis=y': '2x',
    },
    padding: 0,
    transform: {
      '': 'translate(50%, 50%)',
      'axis=x': 'translate(50%, -50%)',
    },
    fill: '#surface',
    color: '#dark',
    border: '1bw #border',
    radius: 'round',
    shadow: '$item-shadow',
    cursor: {
      '': 'nwse-resize',
      'axis=x': 'col-resize',
      'axis=y': 'row-resize',
    },
    opacity: {
      '': 0,
      'selected | resizing': 1,
    },
    pointerEvents: {
      '': 'none',
      'selected | resizing': 'auto',
    },
    outline: {
      '': '1bw #primary-text.0',
      'focus-visible': '1bw #primary-text',
    },
    outlineOffset: '1bw',
    transition: 'opacity, theme',
    touchAction: 'none',

    Icon: {
      display: 'flex',
      placeContent: 'center',
      alignItems: 'center',
      lineHeight: 0,
      transform: {
        '': 'rotate(-45deg)',
        corner: 'none',
        'axis=x': 'rotate(0deg)',
        'axis=y': 'rotate(90deg)',
      },
    },
  },
});

export const TopLevelResizeHandleElement = tasty(ResizeHandleElement, {
  styles: {
    left: '50%',
    right: 'auto',
    transform: 'translate(-50%, 50%)',
  },
});
