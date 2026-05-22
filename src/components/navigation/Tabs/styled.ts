import { tasty } from '@tenphi/tasty';

import { Item } from '../../content/Item';

// =============================================================================
// Main Tabs Container — flex wrapper holding the tab Bar and the panels.
// `placement` mod drives `flex-direction` so DOM order stays "bar then panels"
// and visual order is controlled with `column / column-reverse / row / row-reverse`.
// =============================================================================

export const TabsElement = tasty({
  styles: {
    display: 'flex',
    flow: {
      '': 'column',
      'placement=bottom': 'column-reverse',
      'placement=left': 'row',
      'placement=right': 'row-reverse',
    },
    // Participate in parent flex layouts; allow shrinking on both axes so we
    // never force the parent into overflow. The Bar keeps `flex-shrink: 0`,
    // which makes the practical minimum of the wrapper along the main axis
    // equal to the tablist's intrinsic size.
    flexShrink: 1,
    flexGrow: 1,
    width: 'min 0',
    height: 'min 0',
    overflow: 'visible',

    // ============================================
    // Bar — the tab strip (Prefix + ScrollWrapper + Suffix).
    // ============================================
    Bar: {
      $: '>',
      display: 'flex',
      flow: {
        '': 'row',
        'placement=left | placement=right': 'column',
      },
      placeItems: {
        '': 'end stretch',
        'placement=bottom': 'start stretch',
        'placement=left': 'stretch end',
        'placement=right': 'stretch start',
        'type=radio | type=file': 'stretch',
      },
      overflow: 'visible',
      border: {
        '': 0,
        '(type=default | type=file | type=narrow) & has-panels': 'bottom',
        '(type=default | type=file | type=narrow) & has-panels & placement=bottom':
          'top',
        '(type=default | type=file | type=narrow) & has-panels & placement=left':
          'right',
        '(type=default | type=file | type=narrow) & has-panels & placement=right':
          'left',
      },
      // Bar sizing — always follow the outer wrapper along the main axis so
      // `width` / `height` props on `<Tabs>` apply to the strip as they did
      // before the wrapper was introduced.
      // - horizontal placements: main-axis = wrapper width  (100%), cross-axis intrinsic (auto)
      // - vertical   placements: main-axis = wrapper height (100%), cross-axis intrinsic (auto / max-content for radio)
      width: {
        '': '100%',
        'placement=left | placement=right': 'auto',
        'type=radio & (placement=left | placement=right)': 'max-content',
      },
      height: {
        '': 'auto',
        'placement=left | placement=right': '100%',
        'type=radio & (placement=left | placement=right)': 'max-content',
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
        'type=radio': '#surface-4',
      },
      // Never let the Bar shrink/grow within the outer wrapper — this is what
      // gives the wrapper its effective "tablist-size minimum" on the main axis.
      flexShrink: 0,
      flexGrow: 0,

      $transition: '$tab-transition',
      '$tab-indicator-size': {
        '': '2bw',
        'size=large': '1ow',
      },
    },

    // ============================================
    // Prefix — slot before the scroll area.
    // ============================================
    Prefix: {
      $: '> Bar >',
      display: 'flex',
      placeItems: 'center',
      placeContent: 'center',
      flexShrink: 0,
      placeSelf: 'stretch',
      padding: {
        '': 0,
        'type=default': '.5x 0 .5x 1x',
        'type=default & (placement=left | placement=right)': '1x .5x 0 .5x',
      },
      gap: {
        '': 0,
        'type=default': '.5x',
      },
      border: {
        '': 0,
        'type=file': 'right',
        'type=file & (placement=left | placement=right)': 'bottom',
      },
    },

    // ============================================
    // Suffix — slot after the scroll area.
    // ============================================
    Suffix: {
      $: '> Bar >',
      display: 'flex',
      placeItems: 'center',
      placeContent: 'center',
      flexShrink: 0,
      placeSelf: 'stretch',
      padding: {
        '': 0,
        'type=default': '.5x 1x .5x 0',
        'type=default & (placement=left | placement=right)': '0 .5x 1x .5x',
      },
      gap: {
        '': 0,
        'type=default': '.5x',
      },
      border: {
        '': 0,
        'type=file': 'left',
        'type=file & (placement=left | placement=right)': 'top',
      },
    },

    // Wrapper for scroll area and scrollbar (scrollbar is positioned relative to this)
    ScrollWrapper: {
      $: '> Bar >',
      position: 'relative',
      display: 'flex',
      flexGrow: 1,
      flexShrink: 1,
      width: {
        '': 'min 0',
        'placement=left | placement=right': 'auto',
      },
      height: {
        '': 'auto',
        'placement=left | placement=right': 'min 0',
      },
      overflow: {
        '': 'hidden',
        'type=radio': 'visible',
      },
    },

    Scroll: {
      $: '> Bar > ScrollWrapper >',
      position: 'relative',
      display: 'block',
      overflow: {
        '': 'auto hidden',
        'placement=left | placement=right': 'hidden auto',
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
      // Multi-group fade with axis-neutral color tokens for smooth transitions.
      // Direction flips based on placement.
      fade: {
        '': '2x left #tabs-fade-start #black, 2x right #tabs-fade-end #black',
        'placement=left | placement=right':
          '2x top #tabs-fade-start #black, 2x bottom #tabs-fade-end #black',
      },
      // ##name outputs --name-color (literal CSS property name)
      transition:
        '##tabs-fade-start $tab-transition ease-in, ##tabs-fade-end $tab-transition ease-in',

      // Transition transparent color: opaque (no fade) -> transparent (fade visible)
      '#tabs-fade-start': {
        '': 'rgb(0 0 0 / 1)',
        'fade-start': 'rgb(0 0 0 / 0)',
      },
      '#tabs-fade-end': {
        '': 'rgb(0 0 0 / 1)',
        'fade-end': 'rgb(0 0 0 / 0)',
      },
    },

    TabList: {
      $: '> Bar > ScrollWrapper > Scroll >',
      position: 'relative',
      display: 'grid',
      // `border-box` is required because we set `width: 100%` for vertical
      // placements AND apply padding. With the default `content-box`, the
      // TabList's outer box would be `100% + padding × 2` and overflow Scroll
      // horizontally — and the side selection indicator (positioned at
      // `right: 0` / `left: 0` of TabList) would land in that overflow region
      // and get clipped by Scroll's `overflow-x: hidden`.
      boxSizing: 'border-box',
      gridAutoFlow: {
        '': 'column',
        'placement=left | placement=right': 'row',
      },
      gridAutoColumns: {
        '': 'auto',
        'type=radio': '1fr',
      },
      gridAutoRows: {
        '': 'auto',
        'type=radio & (placement=left | placement=right)': '1fr',
      },
      gap: {
        '': 0,
        'type=default': '1x',
        'type=narrow': '2x',
        'type=radio': '.5x',
        // Tabs stack vertically — collapse the gap so the strip reads as a
        // single column. `narrow` is coerced to `default` in vertical, but we
        // keep the rule defensive in case the styled element is consumed
        // directly with a `type=narrow` mod set.
        '(type=default | type=narrow) & (placement=left | placement=right)':
          '1bw',
      },
      placeContent: 'start',
      overflow: 'visible',
      width: {
        '': 'max-content',
        'type=radio': '100%',
        'placement=left | placement=right': '100%',
      },
      height: {
        '': 'auto',
        'placement=left | placement=right': 'max-content',
      },
      // For vertical default/narrow we apply `$tablist-padding` on ALL sides
      // (instead of only the parallel axis) so the breathing room around the
      // tabs and the selection indicator can be tuned via the `tabListPadding`
      // prop — the same prop that controls horizontal start/end padding.
      padding: {
        '': '0 $tablist-padding',
        'placement=left | placement=right': '$tablist-padding 0',
        '(type=default | type=narrow) & (placement=left | placement=right)':
          '$tablist-padding',
      },

      // Default `$tablist-padding` per type. Vertical default/narrow gets the
      // smaller `.5x` default since it applies to all four sides; the
      // `tabListPadding` prop overrides this via inline CSS variable.
      '$tablist-padding': {
        '': '0',
        'type=default | type=narrow': '1x',
        '(type=default | type=narrow) & (placement=left | placement=right)':
          '.5x',
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

    // Custom tiny scrollbar — positioned relative to ScrollWrapper. Switches
    // edges and dimensions based on placement; the driving CSS custom
    // properties come from `useTinyScrollbar.handleHStyle` / `handleVStyle`.
    Scrollbar: {
      $: '> Bar > ScrollWrapper >',
      position: 'absolute',
      bottom: {
        '': '1px',
        'placement=left | placement=right': 'auto',
      },
      top: {
        '': 'auto',
        'placement=left | placement=right': '$scrollbar-v-top',
      },
      left: {
        '': '$scrollbar-h-left',
        'placement=left | placement=right': 'auto',
      },
      right: {
        '': 'auto',
        'placement=left | placement=right': '1px',
      },
      height: {
        '': '1ow',
        'placement=left | placement=right': '$scrollbar-v-height',
      },
      width: {
        '': '$scrollbar-h-width',
        'placement=left | placement=right': '1ow',
      },
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
      'type=radio | type=default': true,
      'type=narrow': 'top',
      'type=narrow & placement=bottom': 'bottom',
      'type=narrow & placement=left': 'left',
      'type=narrow & placement=right': 'right',
    },
    color: {
      '': '#dark-02',
      'type=narrow & (hovered & !selected)': '#primary-text',
      '(type=default | type=narrow) & selected': '#primary-text',
      disabled: '#disabled-surface-text',
    },
    fill: {
      '': '#clear',
      'hovered & !type=narrow': '#dark.03',
      'type=file': '#surface-3',
      'type=file & hovered': '#surface-3.5',
      'type=radio & hovered': '#surface.5',
      '(type=file | type=radio) & selected': '#surface',
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
        'inset 0 0 0 1bw #primary-text, $selection-shadow',
      editing: 'inset 0 0 0 1bw #primary-text, $selection-shadow',
      'type=radio & selected': '$item-shadow',
      'type=radio & selected & focused & focus-visible':
        '$item-shadow, inset 0 0 0 1bw #primary-text',
    },
    outline: 'none',
    placeContent: {
      // extend
      'type=radio': 'center',
    },
    gridTemplate: {
      // extend
      'type=radio':
        '"icon prefix label suffix rightIcon actions" auto / max-content max-content max-content max-content max-content max-content',
    },
    // File-type selection indicator: an inset shadow on the edge that faces
    // the panel area. Flips with placement so the highlight always sits on
    // the edge adjacent to the content.
    '$selection-shadow': {
      '': 'inset 0 0 0 0 #primary',
      'type=file & selected': 'inset 0 (-1 * $tab-indicator-size) 0 0 #primary',
      'type=file & selected & placement=bottom':
        'inset 0 $tab-indicator-size 0 0 #primary',
      'type=file & selected & placement=left':
        'inset (-1 * $tab-indicator-size) 0 0 0 #primary',
      'type=file & selected & placement=right':
        'inset $tab-indicator-size 0 0 0 #primary',
      '!type=file': 'inset 0 0 0 0 #primary.0',
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
    margin: {
      '': 0,
      // Horizontal strip: .5x top/bottom creates space between the tab and the
      // bottom-edge indicator (which sits at `bottom: 0` of TabList).
      'type=default': '.5x 0',
      // Vertical strip: the breathing room around the tabs and the gap from
      // the side indicator is provided by the TabList's own `.5x` padding —
      // don't add per-tab horizontal margin on top of it.
      'type=default & (placement=left | placement=right)': 0,
    },
    border: {
      '': 0,
      'type=file': 'right',
      'type=file & (placement=left | placement=right)': 'bottom',
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
        'auto-hide-actions': 0,
        'auto-hide-actions & (active | :hover | :focus-within | :has([data-pressed]))': 1,
      },
      transition: 'opacity $transition',
      // Size variables (same as Item)
      '$action-size': 'min(max((2x + 2bw), ($size - 1x - 2bw)), (3x - 2bw))',
      '$side-padding': '(($size - $action-size - 2bw) / 2)',
    },
  },
});

// =============================================================================
// Drop Indicator for Drag-and-Drop
// Geometry flips based on placement: a vertical bar between horizontal tabs,
// a horizontal bar between vertical tabs. `before`/`after` mods come from
// `TabDropIndicator` and decide which edge inset is applied.
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
    fill: '#primary',
    width: {
      '': '.5x',
      'placement=left | placement=right': 'auto',
    },
    height: {
      '': 'auto',
      'placement=left | placement=right': '.5x',
    },
    top: {
      '': 0,
      'placement=left | placement=right': 'auto',
      '(placement=left | placement=right) & before': '-2px',
    },
    bottom: {
      '': 0,
      'placement=left | placement=right': 'auto',
      '(placement=left | placement=right) & after': '-2px',
    },
    left: {
      '': 'auto',
      'before & !(placement=left | placement=right)': '-2px',
      'placement=left | placement=right': 0,
    },
    right: {
      '': 'auto',
      'after & !(placement=left | placement=right)': '-2px',
      'placement=left | placement=right': 0,
    },
  },
});

// =============================================================================
// Tab Selection Indicator (for default/narrow type)
// Position flips with placement; the dynamic axis dimensions (left/width for
// horizontal, top/height for vertical) are populated via inline `style` from
// `useTabIndicator` in `Tabs.tsx`.
// =============================================================================

export const TabIndicatorElement = tasty({
  styles: {
    position: 'absolute',
    bottom: {
      '': '0',
      'placement=bottom | placement=left | placement=right': 'auto',
    },
    top: {
      '': 'auto',
      'placement=bottom': '0',
    },
    left: {
      '': 'auto',
      'placement=right': '0',
    },
    right: {
      '': 'auto',
      'placement=left': '0',
    },
    height: {
      '': '$tab-indicator-size',
      'placement=left | placement=right': 'auto',
    },
    width: {
      '': 'auto',
      'placement=left | placement=right': '$tab-indicator-size',
    },
    fill: '#primary',
    // Transition all four properties unconditionally — only the two relevant
    // ones change per render, the others stay constant.
    transition:
      'left $tab-transition ease-in-out, width $tab-transition ease-in-out, top $tab-transition ease-in-out, height $tab-transition ease-in-out',
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
    hide: {
      '': true,
      active: false,
    },
  },
});
