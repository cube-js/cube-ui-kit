import { tasty } from '../../../tasty';
import { Item } from '../../content/Item';

// =============================================================================
// Main Tabs Container
// =============================================================================

export const TabsElement = tasty({
  styles: {
    display: 'flex',
    flow: 'row',
    placeItems: {
      '': 'end stretch',
      'type=radio | type=file': 'stretch',
    },
    overflow: 'visible',
    border: {
      '': 0,
      '(type=default | type=file | type=narrow) & has-panels': 'bottom',
    },
    width: {
      '': '100%',
      'type=radio': 'max-content',
    },
    padding: {
      '': 0,
      'type=radio': '.5x',
    },
    radius: {
      '': 0,
      'type=radio': '1cr',
    },
    fill: {
      '': '#clear',
      'type=radio': '#dark.06',
    },
    flexShrink: 0,
    flexGrow: 0,

    $transition: '$tab-transition',
    '$tab-indicator-size': {
      '': '2bw',
      'size=large': '1ow',
    },

    Prefix: {
      display: 'flex',
      placeItems: 'center',
      placeContent: 'center',
      flexShrink: 0,
      placeSelf: 'stretch',
      border: {
        '': 0,
        'type=file': 'right',
      },
    },

    Suffix: {
      display: 'flex',
      placeItems: 'center',
      placeContent: 'center',
      flexShrink: 0,
      placeSelf: 'stretch',
      border: {
        '': 0,
        'type=file': 'left',
      },
    },

    // Wrapper for scroll area and scrollbar (scrollbar is positioned relative to this)
    ScrollWrapper: {
      position: 'relative',
      display: 'flex',
      flexGrow: 1,
      flexShrink: 1,
      width: 'min 0',
      overflow: {
        '': 'hidden',
        'type=radio': 'visible',
      },
    },

    Scroll: {
      position: 'relative',
      display: 'block',
      overflow: {
        '': 'auto hidden',
        'type=radio': 'visible',
      },
      scrollbar: 'none',
      flexGrow: 1,
      width: '100%',
      // Add padding/margin for radio type to allow shadow to render outside
      padding: {
        '': 0,
        'type=radio': '.5x',
      },
      margin: {
        '': 0,
        'type=radio': '-.5x',
      },
      // Use multi-group fade with color tokens for smooth transitions
      fade: '2x left #tabs-fade-left #black, 2x right #tabs-fade-right #black',
      // ##name outputs --name-color (literal CSS property name)
      transition:
        '##tabs-fade-left $tab-transition ease-in, ##tabs-fade-right $tab-transition ease-in',

      // Transition transparent color: opaque (no fade) -> transparent (fade visible)
      '#tabs-fade-left': {
        '': 'rgb(0 0 0 / 1)',
        'fade-left': 'rgb(0 0 0 / 0)',
      },
      '#tabs-fade-right': {
        '': 'rgb(0 0 0 / 1)',
        'fade-right': 'rgb(0 0 0 / 0)',
      },
    },

    Container: {
      position: 'relative',
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns: {
        '': 'auto',
        'type=radio': '1fr',
      },
      gap: {
        '': 0,
        'type=narrow': '2x',
        'type=radio': '.5x',
      },
      placeContent: 'start',
      overflow: 'visible',
      width: {
        '': 'max-content',
        'type=radio': '100%',
      },
    },

    // Size variable for actions (if ItemAction is used instead of TabsAction)
    $size: {
      '': '$size-md',
      'size=xsmall': '$size-xs',
      'size=small': '$size-sm',
      'size=medium': '$size-md',
      'size=large': '$size-lg',
      'size=xlarge': '$size-xl',
    },

    // Custom horizontal scrollbar (tiny) - positioned relative to ScrollWrapper
    ScrollbarH: {
      position: 'absolute',
      bottom: '1px',
      left: '$scrollbar-h-left',
      height: '1ow',
      width: '$scrollbar-h-width',
      radius: 'round',
      fill: '#dark.35',
      opacity: {
        '': 0,
        'focused | scrolling': 1,
      },
      transition: 'opacity 0.15s',
      pointerEvents: 'none',
    },
  },
});

// =============================================================================
// Tab Button (extends Item)
// =============================================================================

export const TabElement = tasty(Item, {
  as: 'button',
  styles: {
    radius: {
      '': false,
      'type=radio': true,
      'type=default | type=narrow': 'top',
    },
    color: {
      '': '#dark-02',
      '(type=default | type=narrow) & (hovered & !selected)': '#purple-text',
      '(type=default | type=narrow) & selected': '#purple-text',
      disabled: '#dark-04',
    },
    fill: {
      '': '#clear',
      'type=file': '#light',
      'type=file & hovered': '#light.5',
      'type=radio & hovered': '#white.5',
      '(type=file | type=radio) & selected': '#white',
    },
    border: {
      '': '#clear',
      'type=file': '0 #clear',
    },
    preset: {
      '': 't3m',
      'size=xsmall': 't4',
    },
    shadow: {
      '': '$selection-shadow',
      'focused & focus-visible':
        'inset 0 0 0 1bw #purple-text, $selection-shadow',
      editing: 'inset 0 0 0 1bw #purple-text, $selection-shadow',
      'type=radio & selected': '$item-shadow',
      'type=radio & selected & focused & focus-visible':
        '$item-shadow, inset 0 0 0 1bw #purple-text',
    },
    '$selection-shadow': {
      '': 'inset 0 0 0 0 #purple',
      'type=file & selected': 'inset 0 (-1 * $tab-indicator-size) 0 0 #purple',
      '!type=file': 'none',
    },
    // Collapse horizontal padding for narrow type
    '$label-padding-left': {
      '': '$inline-padding',
      'has-start-content': 0,
      'type=narrow': 0,
    },
    '$label-padding-right': {
      '': '$inline-padding',
      'has-end-content': 0,
      'type=narrow': 0,
    },
    Label: {
      placeSelf: {
        '': 'center start',
        'type=radio': 'center start',
        'type=radio & !has-prefix & !has-suffix & !has-icon & !has-right-icon':
          'center',
      },
    },
    Actions: {
      transition: false,
    },
  },
});

// =============================================================================
// Tab Container (wrapper for tab + actions)
// =============================================================================

export const TabContainer = tasty({
  styles: {
    position: 'relative',
    display: 'grid',
    border: {
      '': 0,
      'type=file': 'right',
    },
    cursor: {
      '': 'default',
      draggable: 'grab',
      dragging: 'grabbing',
    },

    // Size variable for actions (same as ItemButton's ActionsWrapper)
    $size: {
      '': '$size-md',
      'size=xsmall': '$size-xs',
      'size=small': '$size-sm',
      'size=medium': '$size-md',
      'size=large': '$size-lg',
      'size=xlarge': '$size-xl',
    },

    // Actions rendered outside the button for accessibility
    Actions: {
      $: '>',
      position: 'absolute',
      inset: '1bw 1bw auto auto',
      display: 'flex',
      gap: '1bw',
      placeItems: 'center',
      placeContent: 'center end',
      pointerEvents: 'auto',
      height: 'min ($size - 2bw)',
      padding: '0 $side-padding',
      // Simple CSS opacity for show-on-hover
      opacity: {
        '': 1,
        'show-actions-on-hover': 0,
        'show-actions-on-hover & (active | :hover | :focus-within | :has([data-pressed]))': 1,
      },
      transition: 'opacity $transition',
      // Size variables (same as Item)
      '$action-size': 'min(max((2x + 2bw), ($size - 1x - 2bw)), (4x - 2bw))',
      '$side-padding': '(($size - $action-size - 2bw) / 2)',
    },
  },
});

// =============================================================================
// Drop Indicator for Drag-and-Drop
// =============================================================================

export const DropIndicatorElement = tasty({
  styles: {
    zIndex: 10,
    position: 'absolute',
    pointerEvents: 'none',
    opacity: {
      '': 0,
      'drop-target': 1,
    },
    fill: '#purple',
    width: '.5x',
    top: 0,
    bottom: 0,
    left: {
      '': 'auto',
      before: '-2px',
    },
    right: {
      '': 'auto',
      after: '-2px',
    },
  },
});

// =============================================================================
// Tab Selection Indicator (for default type)
// =============================================================================

export const TabIndicatorElement = tasty({
  styles: {
    position: 'absolute',
    bottom: '0',
    left: 0,
    height: '$tab-indicator-size',
    fill: '#purple',
    transition: 'left, width',
    transitionDuration: '.2s',
    transitionTimingFunction: 'ease-out',
    pointerEvents: 'none',
  },
});

// =============================================================================
// Tab Panel
// =============================================================================

export const TabPanelElement = tasty({
  as: 'section',
  styles: {
    display: 'contents',
  },
});

// =============================================================================
// Editable Title Input
// =============================================================================

export const EditableTitleInputElement = tasty({
  as: 'input',
  styles: {
    border: 0,
    padding: 0,
    margin: 0,
    fill: 'transparent',
    outline: 0,
    preset: 'inherit',
    color: 'inherit',
    width: 'initial $input-width 100%',
  },
});

export const HiddenMeasure = tasty({
  styles: {
    position: 'absolute',
    visibility: 'hidden',
    whiteSpace: 'pre',
    font: 'inherit',
    pointerEvents: 'none',
    height: 0,
    overflow: 'hidden',
  },
});
