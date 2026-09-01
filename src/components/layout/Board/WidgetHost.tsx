import { Styles, tasty } from '@tenphi/tasty';
import {
  CSSProperties,
  ReactNode,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFocusRing, useFocusWithin, useHover, useMove } from 'react-aria';
import { createPortal } from 'react-dom';

import { useEvent } from '../../../_internal/hooks';
import { useI18n } from '../../../i18n';
import { isDevEnv } from '../../../utils/is-dev-env';
import { mergeProps } from '../../../utils/react';

import {
  BoardDragState,
  BoardHost,
  BoardHostContext,
  BoardRegistryContextValue,
  useBoardHost,
  ViewportRect,
} from './board-context';
import { WidgetRegistration } from './board-store';
import {
  calcGridColWidth,
  calcGridItemPosition,
  LayoutItem,
  PositionParams,
  ResizeHandleAxis,
} from './grid-core';
import { BoardSelectModifierKey } from './use-board-select-modifier-key';

import type { BoardCornerPlacement, BoardResizeGripPlacement } from './Widget';

export type ResizePhase = 'start' | 'move' | 'end';

/**
 * Slack (px) absorbed when converting an auto-height widget's content height to
 * whole rows, so sub-pixel measurement/rounding noise never bumps an extra row.
 */
const AUTO_HEIGHT_TOLERANCE = 4;

/**
 * Corner grip size in px, and therefore how far a `corner`-placed grip hangs
 * outside the widget: exactly half of it, since it is centred on the corner. The
 * hit-zone reads the same number so what you see is what you can grab.
 */
const GRIP_SIZE = 10;

/**
 * How far a `corner`-placed hit-zone may reach *inward*: exactly the half of the
 * dot that is painted inside the widget, and no further. Reaching deeper would
 * park an invisible resize target over the widget's own content — and when that
 * content is a nested `Board`, the child in the bottom-right cell loses its own
 * corner handle to it and cannot be resized at all (CUB-4166).
 */
const CORNER_HIT_INWARD = GRIP_SIZE / 2;

/**
 * Ceiling on how far the same hit-zone reaches *outward*, where there is only
 * grid gutter to cover. Past a whole grip size the target stops reading as "that
 * dot" and starts reading as "somewhere near the corner".
 */
const CORNER_HIT_OUTWARD_MAX = GRIP_SIZE;

/**
 * Thickness of an `outside` grip: the band, measured out from the widget's edge,
 * that the affordance owns. It is the grid gutter where the gutter is big enough
 * to hold it, and this floor where it is not — an affordance thinner than this
 * stops being reliably clickable, so it overhangs the neighbour instead and the
 * board says so in development.
 */
const OUTSIDE_GRIP_MIN_BAND = 8;

/** Length of an `outside` edge grip along the edge it belongs to. */
const OUTSIDE_GRIP_LENGTH = 24;

/**
 * Painted thickness of an `outside` edge grip, which is deliberately less than
 * the band it sits in: the rest becomes a gap, so the control reads as a thing
 * lying in the gutter rather than as an extension of the widget's own edge.
 *
 * Only the PAINT is inset. The element keeps the whole band, so the target does
 * not shrink with the visual and the two still cannot drift apart.
 */
const OUTSIDE_GRIP_THICKNESS = 4;

/** Gap between a widget's corner and its `outside` corner grip. */
const OUTSIDE_CORNER_GAP = 2;

/**
 * How far an `outside` corner angle reaches out from the widget, given the gutter
 * it has to reach into: the full `GRIP_SIZE` where the gutter can take it, and
 * whatever is left over where it cannot.
 *
 * A corner grip sits in the square where the two gutters cross, which is empty —
 * but only as far as the gutters go. At `GRIP_SIZE` stepped `OUTSIDE_CORNER_GAP`
 * off the corner it reached 12px out, past the 8px gutter the defaults give it
 * and onto the diagonal neighbour, swallowing that widget's own corner. Shrinking
 * rather than warning because the angle still reads at 6px, and a grip that is a
 * little small is not the same order of problem as one covering someone else's
 * widget.
 *
 * `band` arrives floored at `OUTSIDE_GRIP_MIN_BAND`, so the result is never below
 * `OUTSIDE_GRIP_MIN_BAND - OUTSIDE_CORNER_GAP`.
 */
function cornerGripExtent(band: number): number {
  return Math.min(GRIP_SIZE, band - OUTSIDE_CORNER_GAP);
}

const WidgetElement = tasty({
  qa: 'BoardWidget',
  styles: {
    position: 'absolute',
    top: 0,
    left: 0,
    // Widgets always carry a `#surface-2` fill and rounded corners. The `card`
    // modifier (board-level `widgetProps.isCard` or per-widget `isCard`) adds a
    // border on top; a non-card widget is borderless so nested boards can align
    // their columns flush with the parent grid.
    fill: '#surface-2',
    radius: '1cr',
    // Selection reads as a focus-like state here - it is transient, it follows
    // what the user is working with, and it is dropped the moment they touch
    // something else - so it is drawn as an edge treatment rather than as a
    // fill. `outline` stays reserved for the real focus ring (the kit's
    // convention everywhere), and the two are kept legible side by side by
    // token: selection is a saturated `#primary` ring, focus a `#primary-text`
    // outline sitting one border-width further out (`outlineOffset`).
    // A widget a live marquee currently covers gets the same treatment with the
    // ring dimmed, so releasing the pointer only changes the strength of an edge
    // that is already there — no geometry shift, nothing to re-read. The border
    // is *not* dimmed with it: `#primary-border` is close to `#border` on a dark
    // scheme, so fading it lands below the border a widget already has and the
    // preview would read as weaker than doing nothing.
    border: {
      '': false,
      card: true,
      'pre-selected': '#primary-border',
      selected: '#primary-border',
    },
    shadow: {
      '': false,
      'hovered & !card & !no-hover-ring & (draggable | resizing)':
        '0 0 0 1bw #border',
      'pre-selected': '0 0 0 1bw #primary.40',
      selected: '0 0 0 1bw #primary',
      // `$dialog-shadow` uses Glaze `#shadow-lg`, which adapts to dark / high-contrast schemes.
      'drag | resizing': '$dialog-shadow',
    },
    outline: {
      '': '1bw #primary-text.0',
      'focus-visible': '1bw #primary-text',
    },
    outlineOffset: '1bw',
    zIndex: {
      '': 1,
      'drag | resizing': 10,
    },
    // The pointer-drag ghost (the clone that floats in the overlay) is slightly
    // translucent so the user can see through it to whatever it hovers over -
    // e.g. a Tabs header underneath - and land a precise drop / tab switch. The
    // in-place host (keyboard drags, which never float) stays fully opaque.
    opacity: {
      '': 1,
      floating: 0.8,
    },
    // Reflowing widgets animate their position and size. The actively
    // dragged/resized element - and the floating overlay clone - must track the
    // pointer with no lag, so they drop geometry from the list. Geometry is also
    // dropped until the board reports `settled`: on init widgets jump to their
    // first measured positions, and without this gate they would slide/grow in
    // from their default box. The board lifts the gate after the first
    // positioned paint so subsequent reflows animate normally.
    transition: {
      '': 'theme, shadow, opacity',
      settled: 'theme, shadow, opacity, inset, width, height',
      'drag | floating | resizing': 'theme, shadow, opacity',
    },
    boxSizing: 'border-box',
    userSelect: {
      '': 'auto',
      'drag | resizing': 'none',
    },
    cursor: {
      '': 'auto',
      draggable: 'grab',
      drag: 'grabbing',
    },
    touchAction: 'none',
    // A widget owns its grid cell and must not paint outside it: a nested board
    // with more rows than currently fit, a mid-drag reflow (an auto-height
    // container deliberately cannot grow while a drag is in flight), or a long
    // unbreakable string would otherwise spill over its neighbours. Clipping
    // holds regardless of `isCard` — a borderless widget has no drawn edge, but
    // it still has a cell.
    //
    // The cost is that a descendant's `outline` is cropped at the edge, since an
    // outline is clipped by an *ancestor's* overflow rather than its own. A
    // widget whose content needs to paint outside — a control drawing its own
    // active ring — opts out with `overflow="visible"`, or draws the ring inset
    // with a negative `outlineOffset`.
    overflow: 'hidden',
  },
});

const HandleElement = tasty({
  qa: 'BoardResizeHandle',
  styles: {
    position: 'absolute',
    zIndex: 20,
    fill: '#clear',
    // The corner hit-zone is drawn inside the grip layer, which takes no pointer
    // events; `pointer-events` inherits, so it has to opt back in. Inside the
    // widget this is what it already got from the default.
    pointerEvents: 'auto',
    '--handle-size': '3x',
    '--handle-inset': '1x',
    // An EDGE hit-zone is a band running along its edge, mostly inside the
    // widget. It is a descendant of the host, so the sliver that hangs outside is
    // eaten by the host's own clip and only the inward band is ever real.
    '--edge-overhang': '-8px',
    // A CORNER hit-zone under `corner` placement is the one that has to stay off
    // its own content, so it is built from its two halves rather than as one
    // square: it reaches `CORNER_HIT_INWARD` inward — the half-dot that is
    // actually painted there, so what you see stays what you can grab — and takes
    // the rest of its size outward, into the gutter. `WidgetHost` measures both
    // and publishes them as `--corner-hit-size` / `--corner-hit-overhang`.
    //
    // `inside` placement keeps the plain 3x square: its dot sits in the content
    // area by design, so it has nothing to stay clear of.
    '--corner-overhang': {
      '': '-8px',
      'placement=corner': '$corner-hit-overhang',
    },
    '--corner-size': {
      '': '$handle-size',
      'placement=corner': '$corner-hit-size',
    },
    // Corner axes are the DEFAULT case in the six maps below, and each edge axis
    // is named on its own, so a corner can never pick up an edge's geometry (it
    // used to, via a shared `--handle-overhang`, which is how the inward reach
    // above went unnoticed).
    width: {
      '': '$corner-size',
      '[data-axis="e"] | [data-axis="w"]': '$handle-size',
      '[data-axis="n"] | [data-axis="s"]': 'auto',
    },
    height: {
      '': '$corner-size',
      '[data-axis="n"] | [data-axis="s"]': '$handle-size',
      '[data-axis="e"] | [data-axis="w"]': 'auto',
    },
    top: {
      '': 'auto',
      '[data-axis="ne"] | [data-axis="nw"]': '$corner-overhang',
      '[data-axis="n"]': '$edge-overhang',
      '[data-axis="e"] | [data-axis="w"]': '$handle-inset',
    },
    bottom: {
      '': 'auto',
      '[data-axis="se"] | [data-axis="sw"]': '$corner-overhang',
      '[data-axis="s"]': '$edge-overhang',
      '[data-axis="e"] | [data-axis="w"]': '$handle-inset',
    },
    left: {
      '': 'auto',
      '[data-axis="nw"] | [data-axis="sw"]': '$corner-overhang',
      '[data-axis="w"]': '$edge-overhang',
      '[data-axis="n"] | [data-axis="s"]': '$handle-inset',
    },
    right: {
      '': 'auto',
      '[data-axis="ne"] | [data-axis="se"]': '$corner-overhang',
      '[data-axis="e"]': '$edge-overhang',
      '[data-axis="n"] | [data-axis="s"]': '$handle-inset',
    },
    cursor: {
      '': 'default',
      '[data-axis="n"] | [data-axis="s"]': 'ns-resize',
      '[data-axis="e"] | [data-axis="w"]': 'ew-resize',
      '[data-axis="ne"] | [data-axis="sw"]': 'nesw-resize',
      '[data-axis="nw"] | [data-axis="se"]': 'nwse-resize',
    },
    touchAction: 'none',
  },
});

const GripElement = tasty({
  qa: 'BoardResizeGrip',
  styles: {
    position: 'absolute',
    // Both placements derive from one number, so the grip can never drift out of
    // step with its own size: `inside` tucks it into the widget box, `corner`
    // centres it on the widget's corner - exactly half its own size back from
    // each edge. Consumers pick between them with `resizeGripPlacement` instead
    // of re-deriving these offsets from the outside.
    '--grip-size': `${GRIP_SIZE}px`,
    '--grip-inset': '4px',
    '--grip-offset': {
      '': '$grip-inset',
      'placement=corner': '($grip-size / -2)',
    },
    width: '$grip-size',
    height: '$grip-size',
    boxSizing: 'border-box',
    pointerEvents: 'none',
    opacity: {
      '': 0,
      revealed: 1,
    },
    transition: 'opacity 120ms ease-in-out',
    borderTop: {
      '': '0',
      '[data-axis="ne"] | [data-axis="nw"]': '2px solid #dark.40',
    },
    borderBottom: {
      '': '0',
      '[data-axis="se"] | [data-axis="sw"]': '2px solid #dark.40',
    },
    borderLeft: {
      '': '0',
      '[data-axis="nw"] | [data-axis="sw"]': '2px solid #dark.40',
    },
    borderRight: {
      '': '0',
      '[data-axis="ne"] | [data-axis="se"]': '2px solid #dark.40',
    },
    radius: {
      '': '0',
      '[data-axis="se"]': '4px bottom-right',
      '[data-axis="sw"]': '4px bottom-left',
      '[data-axis="ne"]': '4px top-right',
      '[data-axis="nw"]': '4px top-left',
    },
    top: {
      '': 'auto',
      '[data-axis="ne"] | [data-axis="nw"]': '$grip-offset',
    },
    bottom: {
      '': 'auto',
      '[data-axis="se"] | [data-axis="sw"]': '$grip-offset',
    },
    left: {
      '': 'auto',
      '[data-axis="nw"] | [data-axis="sw"]': '$grip-offset',
    },
    right: {
      '': 'auto',
      '[data-axis="ne"] | [data-axis="se"]': '$grip-offset',
    },
  },
});

/**
 * An `outside` grip: the visible control and the hit-zone in one element.
 *
 * The two used to be separate boxes of different sizes, aligned by hand, which is
 * how a 10px dot came to stand for a 24px target reaching back over the widget's
 * own content (CUB-4166). Here they cannot drift apart, because there is only one
 * box: what is painted is exactly what is grabbed.
 *
 * It lives in the grid gutter, beyond the widget's edge — never over the widget's
 * content, so a nested board's children keep every pixel of their own. The band
 * it occupies (`--grip-band-x` / `--grip-band-y`) is the gutter, floored at
 * `OUTSIDE_GRIP_MIN_BAND`. Rendered in `GripLayerElement`, which nothing clips.
 *
 * Always hit-testable, painted only once revealed: you have to be able to hover
 * it to reveal it, and `opacity` leaves hit-testing alone.
 */
const OutsideGripElement = tasty({
  qa: 'BoardResizeHandle',
  styles: {
    position: 'absolute',
    boxSizing: 'border-box',
    pointerEvents: 'auto',
    touchAction: 'none',
    zIndex: 20,
    opacity: {
      '': 0,
      revealed: 1,
    },
    transition: 'opacity 120ms ease-in-out, theme',
    // Anchored to the edge it resizes and centred along it, so the control reads
    // as belonging to that edge rather than floating near it.
    left: {
      '': 'auto',
      '[data-axis="e"] | [data-axis="ne"] | [data-axis="se"]': '100%',
      '[data-axis="n"] | [data-axis="s"]': '50%',
    },
    right: {
      '': 'auto',
      '[data-axis="w"] | [data-axis="nw"] | [data-axis="sw"]': '100%',
    },
    top: {
      '': 'auto',
      '[data-axis="s"] | [data-axis="se"] | [data-axis="sw"]': '100%',
      '[data-axis="e"] | [data-axis="w"]': '50%',
    },
    bottom: {
      '': 'auto',
      '[data-axis="n"] | [data-axis="ne"] | [data-axis="nw"]': '100%',
    },
    // Edges centre themselves along the edge; corners step off it by the gap, so
    // the angle sits clear of the widget it belongs to rather than touching it.
    transform: {
      '': 'translate(0, 0)',
      '[data-axis="e"] | [data-axis="w"]': 'translate(0, -50%)',
      '[data-axis="n"] | [data-axis="s"]': 'translate(-50%, 0)',
      '[data-axis="se"]': `translate(${OUTSIDE_CORNER_GAP}px, ${OUTSIDE_CORNER_GAP}px)`,
      '[data-axis="sw"]': `translate(${-OUTSIDE_CORNER_GAP}px, ${OUTSIDE_CORNER_GAP}px)`,
      '[data-axis="ne"]': `translate(${OUTSIDE_CORNER_GAP}px, ${-OUTSIDE_CORNER_GAP}px)`,
      '[data-axis="nw"]': `translate(${-OUTSIDE_CORNER_GAP}px, ${-OUTSIDE_CORNER_GAP}px)`,
    },
    // An edge grip spans the gutter band across, a fixed length along. A corner
    // grip is the same angle the `inside` and `corner` placements draw - it is a
    // familiar shape, and a filled dot read as a scrollbar rather than as a
    // resize corner - sized to the gutter it reaches into (`cornerGripExtent`),
    // one axis of the crossing per dimension.
    width: {
      '': '$outside-corner-w',
      '[data-axis="e"] | [data-axis="w"]': '$grip-band-x',
      '[data-axis="n"] | [data-axis="s"]': `${OUTSIDE_GRIP_LENGTH}px`,
    },
    height: {
      '': '$outside-corner-h',
      '[data-axis="n"] | [data-axis="s"]': '$grip-band-y',
      '[data-axis="e"] | [data-axis="w"]': `${OUTSIDE_GRIP_LENGTH}px`,
    },
    // The gap on an edge grip: pad the band away on the thickness axis and clip
    // the paint to what is left. The element - and so the target - is untouched.
    padding: {
      '': 0,
      '[data-axis="e"] | [data-axis="w"]': '0 $grip-pad-x',
      '[data-axis="n"] | [data-axis="s"]': '$grip-pad-y 0',
    },
    backgroundClip: 'content-box',
    fill: {
      '': '#clear',
      '[data-axis="n"] | [data-axis="s"] | [data-axis="e"] | [data-axis="w"]':
        '#dark.30',
      '([data-axis="n"] | [data-axis="s"] | [data-axis="e"] | [data-axis="w"]) & resizing':
        '#dark.50',
    },
    // Corner angles, mirroring `GripElement` so the two placements draw the same
    // affordance in different places.
    borderTop: {
      '': '0',
      '[data-axis="ne"] | [data-axis="nw"]': '2px solid #dark.40',
    },
    borderBottom: {
      '': '0',
      '[data-axis="se"] | [data-axis="sw"]': '2px solid #dark.40',
    },
    borderLeft: {
      '': '0',
      '[data-axis="nw"] | [data-axis="sw"]': '2px solid #dark.40',
    },
    borderRight: {
      '': '0',
      '[data-axis="ne"] | [data-axis="se"]': '2px solid #dark.40',
    },
    radius: {
      '': 'round',
      '[data-axis="se"]': '4px bottom-right',
      '[data-axis="sw"]': '4px bottom-left',
      '[data-axis="ne"]': '4px top-right',
      '[data-axis="nw"]': '4px top-left',
    },
    cursor: {
      '': 'default',
      '[data-axis="n"] | [data-axis="s"]': 'ns-resize',
      '[data-axis="e"] | [data-axis="w"]': 'ew-resize',
      '[data-axis="ne"] | [data-axis="sw"]': 'nesw-resize',
      '[data-axis="nw"] | [data-axis="se"]': 'nwse-resize',
    },
  },
});

/**
 * Where the corner grips are drawn when `resizeGripPlacement` is `'corner'`.
 *
 * `WidgetElement` clips its children (`overflow: hidden`, and that clipping is
 * load-bearing - see its own note), so a grip centred on the widget's corner
 * would be cut in half if it stayed inside. This layer mirrors the widget's grid
 * rect as a *sibling* of it, clips nothing, and never takes pointer events: the
 * transparent `HandleElement` inside the widget still owns the gesture, so
 * escaping the clip costs no hit-testing behaviour.
 *
 * It sits above a resting widget (`zIndex: 1`) so a grip is never hidden by the
 * neighbour it overhangs, and below a dragged or resized one (`zIndex: 10`) so a
 * lifted widget still paints over its neighbours' grips.
 *
 * Nothing clips this layer — `BoardElement` sets no `overflow` — so a grip on a
 * widget flush against its board's edge (`containerPadding: [0, 0]`, which
 * `isAligned` sets) is painted *outside* the board's content box rather than
 * cropped to fit inside it. Inside a nested board that puts it exactly on the
 * host widget's own corner: the two corners are the same point, so the two hit
 * zones cannot be separated by geometry, and `z-index` cannot arbitrate either
 * (this layer is a sibling of the host, so it outranks the whole nested subtree
 * whatever the inner handle asks for). `ResizeHandle` settles it by depth
 * instead.
 */
const GripLayerElement = tasty({
  qa: 'BoardResizeGripLayer',
  styles: {
    position: 'absolute',
    overflow: 'visible',
    pointerEvents: 'none',
    zIndex: 5,
  },
});

/**
 * A control anchored to one corner of a widget, centred on it.
 *
 * Lives in the same layer as the corner resize grips, which is the layer that
 * exists precisely because a widget clips its own content: a control an app
 * hangs off the corner itself is cropped in half by that clip, or by an
 * ancestor's scroll container when the widget sits in the first row. Here it is
 * a sibling of the widget rather than a descendant, so neither can reach it.
 *
 * Being outside the widget host also means `useMove` is not attached, so a press
 * on the chrome cannot start a drag — no `dragCancel` entry required.
 */
const CornerChromeElement = tasty({
  qa: 'BoardWidgetCornerChrome',
  styles: {
    position: 'absolute',
    // The layer takes no pointer events; chrome is interactive, so it opts back in.
    pointerEvents: 'auto',
    zIndex: 1,
    top: {
      '': 'auto',
      'corner=ne | corner=nw': 0,
    },
    bottom: {
      '': 'auto',
      'corner=se | corner=sw': 0,
    },
    left: {
      '': 'auto',
      'corner=nw | corner=sw': 0,
    },
    right: {
      '': 'auto',
      'corner=ne | corner=se': 0,
    },
    // Centre it on the corner: half of its own size in each direction. The
    // default matches `ne`, which is also the default placement, so chrome is
    // still centred rather than hanging off-centre if no corner mod matches.
    transform: {
      '': 'translate(50%, -50%)',
      'corner=nw': 'translate(-50%, -50%)',
      'corner=se': 'translate(50%, 50%)',
      'corner=sw': 'translate(-50%, 50%)',
    },
  },
});

// Edge axes (n/s/e/w) get a dotted grip affordance, revealed on
// hover/focus/resize. The dots line up along the edge (a vertical column for the
// e/w handles, a horizontal row for n/s), matching the design-system pane grip
// (see `Layout.Pane`). Purely visual - the interaction still lives on the
// transparent `HandleElement` hit-zone above.
const EdgeGripElement = tasty({
  qa: 'BoardResizeEdgeGrip',
  styles: {
    position: 'absolute',
    display: 'grid',
    gap: '2bw',
    boxSizing: 'border-box',
    pointerEvents: 'none',
    opacity: {
      '': 0,
      revealed: 1,
    },
    transition: 'opacity 120ms ease-in-out',
    // A column of 5 dots for the vertical edges (e/w), a row of 5 for n/s.
    gridColumns: {
      '': '3px',
      '[data-axis="n"] | [data-axis="s"]': '3px 3px 3px 3px 3px',
    },
    gridRows: {
      '': '3px 3px 3px 3px 3px',
      '[data-axis="n"] | [data-axis="s"]': '3px',
    },
    // Anchor to the relevant edge and center along it.
    top: {
      '': '50%',
      '[data-axis="n"]': '3px',
      '[data-axis="s"]': 'auto',
    },
    bottom: {
      '': 'auto',
      '[data-axis="s"]': '3px',
    },
    left: {
      '': 'auto',
      '[data-axis="w"]': '3px',
      '[data-axis="n"] | [data-axis="s"]': '50%',
    },
    right: {
      '': 'auto',
      '[data-axis="e"]': '3px',
    },
    transform: {
      '': 'translate(0, 0)',
      '[data-axis="e"] | [data-axis="w"]': 'translate(0, -50%)',
      '[data-axis="n"] | [data-axis="s"]': 'translate(-50%, 0)',
    },

    Dot: {
      width: '3px',
      height: '3px',
      radius: 'round',
      fill: {
        '': '#dark-03',
        resizing: '#dark-02',
      },
    },
  },
});

/** Corner axes get a visible grip affordance on hover/focus/resize. */
function isCornerAxis(axis: ResizeHandleAxis): boolean {
  return axis.length === 2;
}

/** Edge axes (n/s/e/w) get a dotted grip affordance. */
function isEdgeAxis(axis: ResizeHandleAxis): boolean {
  return axis.length === 1;
}

/** `data-qa` of a resize hit-zone, as published by `HandleElement`. */
const HANDLE_QA = 'BoardResizeHandle';

/**
 * The deepest resize hit-zone under `point` belonging to a board nested deeper
 * than `depth`, or `null` when the caller is already the innermost one there.
 *
 * Asked of the document rather than of a registry, deliberately: the two handles
 * belong to different boards, which share no owner below the app root, and "what
 * is under this pixel" is the browser's own question to answer.
 * `elementsFromPoint` skips `pointer-events: none` nodes, so everything it hands
 * back is something the pointer could genuinely have landed on.
 */
function findDeeperHandle(
  point: { x: number; y: number },
  depth: number,
): HTMLElement | null {
  let stack: Element[];

  try {
    // Absent in jsdom, where the pointer path is not exercised anyway.
    if (typeof document.elementsFromPoint !== 'function') return null;
    stack = document.elementsFromPoint(point.x, point.y);
  } catch {
    return null;
  }

  let deepest: HTMLElement | null = null;
  let deepestDepth = depth;

  for (const node of stack) {
    if (!(node instanceof HTMLElement)) continue;
    if (node.dataset.qa !== HANDLE_QA) continue;
    const nodeDepth = Number(node.dataset.boardDepth);
    if (!Number.isFinite(nodeDepth) || nodeDepth <= deepestDepth) continue;
    deepest = node;
    deepestDepth = nodeDepth;
  }

  return deepest;
}

/**
 * Hand a press to `target` unchanged.
 *
 * Safe because of how `useMove` (which owns the resize gesture) tracks a
 * pointer: through `window` listeners matched on `pointerId`, never through
 * `setPointerCapture`. So only the opening `pointerdown` is re-dispatched — every
 * real `pointermove`/`pointerup` that follows drives the forwarded gesture just
 * as it would drive a direct one.
 */
function forwardPointerDown(e: ReactPointerEvent, target: HTMLElement): void {
  const forwarded = new PointerEvent('pointerdown', {
    bubbles: true,
    cancelable: true,
    composed: true,
    pointerId: e.pointerId,
    pointerType: e.pointerType,
    isPrimary: e.isPrimary,
    button: e.button,
    buttons: e.buttons,
    clientX: e.clientX,
    clientY: e.clientY,
    screenX: e.screenX,
    screenY: e.screenY,
    shiftKey: e.shiftKey,
    ctrlKey: e.ctrlKey,
    altKey: e.altKey,
    metaKey: e.metaKey,
  });

  // `useMove` seeds the gesture from the PAGE pair and then measures every later
  // delta against it, so a wrong seed does not merely offset the resize - it
  // makes the first move jump. `pageX`/`pageY` are not init-dictionary members
  // (they are derived from the client pair), so copy the originals across instead
  // of trusting the derivation to agree with the real events that follow.
  Object.defineProperty(forwarded, 'pageX', {
    value: e.pageX,
    configurable: true,
  });
  Object.defineProperty(forwarded, 'pageY', {
    value: e.pageY,
    configurable: true,
  });

  target.dispatchEvent(forwarded);
}

/**
 * Warnings already emitted, keyed by their own text. A widget that yields its
 * only resize affordance is a layout mistake, not an event: it is the same
 * mistake every single time the user reaches for that corner, so it is worth
 * saying exactly once.
 */
const yieldWarnings = new Set<string>();

function warnOnce(message: string | undefined): void {
  if (!message || yieldWarnings.has(message)) return;
  yieldWarnings.add(message);
  console.warn(message);
}

interface ResizeHandleProps {
  axis: ResizeHandleAxis;
  placement: BoardResizeGripPlacement;
  /** Nesting depth of the board this handle's widget belongs to. */
  boardDepth: number;
  /**
   * What to warn (once) if this handle yields to a deeper one and its widget has
   * no edge axis left to be resized from. Built by `WidgetHost`, and `undefined`
   * when the widget does have a fallback or in production.
   */
  yieldWarning?: string;
  /**
   * `outside` placement only, where the control and the hit-zone are one element:
   * whether it is currently painted. It stays hit-testable either way — you have
   * to be able to hover it to reveal it.
   */
  isRevealed?: boolean;
  /** `outside` placement only: whether a resize is in flight on this widget. */
  isResizing?: boolean;
  onResize: (
    axis: ResizeHandleAxis,
    phase: ResizePhase,
    dx: number,
    dy: number,
  ) => void;
}

function ResizeHandle({
  axis,
  placement,
  boardDepth,
  yieldWarning,
  isRevealed,
  isResizing,
  onResize,
}: ResizeHandleProps) {
  const { moveProps } = useMove({
    onMoveStart() {
      onResize(axis, 'start', 0, 0);
    },
    onMove(e) {
      onResize(axis, 'move', e.deltaX, e.deltaY);
    },
    onMoveEnd() {
      onResize(axis, 'end', 0, 0);
    },
  });

  const stopProps = {
    onPointerDown: (e: ReactPointerEvent) => e.stopPropagation(),
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    onTouchStart: (e: React.TouchEvent) => e.stopPropagation(),
  };

  const handleProps = mergeProps(stopProps, moveProps);

  /**
   * Two resize hit-zones can want the same pixel. A `corner`-placed zone
   * straddles its widget's corner, and in a nested board that sits flush — which
   * `isAligned` guarantees, since it pins `containerPadding` to `[0, 0]` — the
   * host widget's corner and its bottom-right child's corner ARE one point.
   * Geometry has nothing left to separate them with, and `z-index` cannot
   * arbitrate either (see `GripLayerElement`), so the tie is broken here: the
   * innermost handle takes the press. It is the more specific target, and the
   * outer widget can still be resized from its edges — where it has any, which is
   * what `yieldWarning` is about.
   *
   * Decided on the press rather than on hover so that touch, which has no hover
   * to decide on, is covered by the same code. Nothing is lost by deciding this
   * late: both handles ask for the same resize cursor anyway.
   */
  const onPointerDown = (e: ReactPointerEvent) => {
    const deeper = findDeeperHandle({ x: e.clientX, y: e.clientY }, boardDepth);

    if (deeper) {
      // The press still must not reach the host and start a widget drag.
      e.stopPropagation();
      e.preventDefault();
      warnOnce(yieldWarning);
      forwardPointerDown(e, deeper);
      return;
    }

    handleProps.onPointerDown?.(e);
  };

  // `outside` is one element for the control and its hit-zone; the other
  // placements keep a transparent zone with a separate grip drawn near it.
  const Element = placement === 'outside' ? OutsideGripElement : HandleElement;

  return (
    <Element
      data-axis={axis}
      // Read by `findDeeperHandle` on a handle it can only reach through the DOM.
      data-board-depth={boardDepth}
      mods={{ placement, revealed: isRevealed, resizing: isResizing }}
      {...handleProps}
      onPointerDown={onPointerDown}
      aria-hidden="true"
    />
  );
}

export interface WidgetHostProps {
  boardId: string;
  item: LayoutItem;
  positionParams: PositionParams;
  registration: WidgetRegistration | undefined;
  /**
   * Whether this widget renders with card chrome (fill/border/radius). Resolved
   * by the owning `Board` from the per-widget `isCard` and the board-level
   * `widgetProps.isCard` default.
   */
  isCard: boolean;
  /**
   * Whether this widget draws the resting hover ring. Resolved by the owning
   * `Board` from the per-widget `hoverRing` and the board-level
   * `widgetProps.hoverRing` default.
   */
  hoverRing: boolean;
  /** Corner-anchored chrome, drawn outside the widget's clip. */
  cornerChrome?: ReactNode;
  /** Which corner {@link cornerChrome} is centred on. */
  cornerChromePlacement?: BoardCornerPlacement;
  /** App-defined modifiers merged into the host's own, for style maps to match. */
  mods?: Record<string, boolean | string | undefined>;
  /**
   * Resolved style overrides for the rendered widget element (per-widget
   * `styles` falling back to the board-level `widgetProps.styles`).
   */
  styles?: Styles;
  isDraggable: boolean;
  isResizable: boolean;
  resizeHandles: ResizeHandleAxis[];
  /**
   * Where the resize grips sit, if a consumer said. Resolved by the owning `Board`
   * from the per-widget `resizeGripPlacement`, the board-level
   * `widgetProps.resizeGripPlacement`, and the board's own prop — and left
   * `undefined` when none of them set it, in which case this host resolves it from
   * its own content: `outside` for a widget holding a nested `Board`, `inside`
   * otherwise.
   */
  resizeGripPlacement?: BoardResizeGripPlacement;
  /**
   * Nesting depth of the owning board (0 at the top level). Published on every
   * resize hit-zone so a press on a corner two boards share can be settled by
   * depth — see `ResizeHandle`.
   */
  boardDepth: number;
  /**
   * Whether this widget grows to fit its content. Resolved by the owning
   * `Board` from the per-widget `isAutoHeight` and the board-level
   * `widgetProps.isAutoHeight` default.
   */
  isAutoHeight: boolean;
  /**
   * Test id / accessible name for the rendered widget element. Resolved by the
   * owning `Board` from the per-widget `qa` and the board-level `widgetProps.qa`
   * default; falls back to the layout id.
   */
  qa?: string;
  /**
   * CSS selector for elements that must not start a pointer drag (e.g. form
   * controls inside the widget). A pointer-down whose target matches this
   * selector never begins a drag.
   */
  dragCancel?: string;
  /**
   * CSS selector for the only elements from which a pointer drag may start. A
   * pointer-down outside a matching element never begins a drag.
   */
  dragHandle?: string;
  /**
   * Whether the owning board has settled its widgets' initial positions. While
   * false, the widget does not animate `inset` (left/top) so the first
   * positioned paint isn't seen as a transition. Lifted after the board's first
   * measured render.
   */
  settled?: boolean;
  registry: BoardRegistryContextValue;
  dragState: BoardDragState | null;
  onResize: (
    id: string,
    axis: ResizeHandleAxis,
    phase: ResizePhase,
    dx: number,
    dy: number,
  ) => void;
  /**
   * Report the minimum number of rows this widget needs to fit its content
   * (typically a nested board). The owning board grows the item to this height
   * when it is taller than the current one, and treats it as the resize floor
   * so the widget cannot be dragged shorter than its content requires.
   */
  onAutoHeight: (id: string, neededRows: number) => void;
  /**
   * Notify the owning board of a drag gesture's lifecycle so it can emit the
   * public drag callbacks. Fires after the registry has updated drag state.
   */
  onDragLifecycle?: (id: string, phase: ResizePhase) => void;
  /** Whether this widget can be selected (board selection on and not opted out). */
  isSelectable?: boolean;
  isSelected?: boolean;
  /**
   * A live marquee currently covers this widget, so it *will* be selected when
   * the pointer is released. Provisional: it never reaches the selection model,
   * the callbacks or the live region.
   */
  isPreSelected?: boolean;
  /** CSS selector for descendants whose clicks must not change the selection. */
  selectionCancel?: string;
  /** Id of the board-owned node holding the shared "Selected" description. */
  selectedHintId?: string;
  /** Apply a selection gesture. `additive` toggles instead of replacing. */
  onSelect?: (id: string, additive: boolean) => void;
  /** Drop the whole selection. Called when the user interacts elsewhere. */
  onSelectionReset?: () => void;
  /** Pointer-event property carrying the platform additive-selection modifier. */
  selectModifierKey?: BoardSelectModifierKey;
}

/**
 * The positioned, interactive wrapper a board renders for each layout item it
 * owns. Content is pulled from the shared store (by id), so any board can host
 * any widget. Dragging uses React Aria `useMove`; during a drag the widget
 * renders into the shared overlay portal so it can float outside its board.
 */
export function WidgetHost(props: WidgetHostProps) {
  const {
    boardId,
    item,
    positionParams,
    registration,
    isCard,
    hoverRing,
    cornerChrome,
    cornerChromePlacement = 'ne',
    mods: customMods,
    styles: widgetStyles,
    isDraggable,
    isResizable,
    resizeHandles,
    resizeGripPlacement,
    boardDepth,
    isAutoHeight,
    qa,
    dragCancel,
    dragHandle,
    registry,
    dragState,
    settled,
    onResize,
    onAutoHeight,
    onDragLifecycle,
    isSelectable = false,
    isSelected = false,
    isPreSelected = false,
    selectionCancel,
    selectedHintId,
    onSelect,
    onSelectionReset,
    selectModifierKey = 'metaKey',
  } = props;

  const { t } = useI18n();
  const ariaLabel = registration?.['aria-label'];
  const hostRef = useRef<HTMLDivElement | null>(null);
  const isActiveDrag = dragState?.itemId === item.i;
  // Every member of a group drag floats, not just the grabbed one — otherwise
  // the rest sit motionless while their placeholders move, which reads as
  // broken. Only the grabbed host owns a live `useMove` gesture, so hiding the
  // others is trivially safe.
  const isDragMember = !!dragState?.itemIds.includes(item.i);

  // Translate a nested board's reported height deficit (signed px: positive when
  // it is squeezed, negative when it has slack) into the absolute number of rows
  // this widget needs, and report it to the owning board. The widget's chrome
  // cancels out: the needed pixel height is the widget's current pixel height
  // plus the deficit. A small tolerance keeps sub-pixel rounding from bumping an
  // extra row. Skipped during a drag (the widget is floating in the overlay).
  const requestHeightDeficit = useEvent((deficitPx: number) => {
    if (!isAutoHeight || isActiveDrag) return;
    const step = positionParams.rowHeight + positionParams.margin[1];
    if (step <= 0) return;
    const current = calcGridItemPosition(
      positionParams,
      item.x,
      item.y,
      item.w,
      item.h,
    );
    const neededPx = current.height + deficitPx;
    const neededRows = Math.max(
      1,
      Math.ceil(
        (neededPx + positionParams.margin[1] - AUTO_HEIGHT_TOLERANCE) / step,
      ),
    );
    onAutoHeight(item.i, neededRows);
  });

  // How many nested `Board`s this widget is holding. A count rather than a flag
  // because a widget may hold more than one (a Tabs panel per board), and each
  // registers and deregisters on its own schedule.
  const [nestedBoardCount, setNestedBoardCount] = useState(0);
  const registerNestedBoard = useEvent(() => {
    setNestedBoardCount((count) => count + 1);

    return () => setNestedBoardCount((count) => Math.max(0, count - 1));
  });

  // Whether the pointer is on a widget of a board nested inside this one. Also a
  // count: the pointer can be leaving one child as it arrives on another, and the
  // two reports interleave.
  const [descendantHoverCount, setDescendantHoverCount] = useState(0);
  const setDescendantHovered = useEvent((hovered: boolean) => {
    setDescendantHoverCount((count) => Math.max(0, count + (hovered ? 1 : -1)));
  });

  const hostValue = useMemo<BoardHost>(
    () => ({
      isAutoHeight,
      requestHeightDeficit,
      registerNestedBoard,
      setDescendantHovered,
    }),
    [
      isAutoHeight,
      requestHeightDeficit,
      registerNestedBoard,
      setDescendantHovered,
    ],
  );
  // Keyboard drags stay in place: moving the focused element into the overlay
  // portal would unmount it and stop arrow-key move events.
  const useOverlay = isActiveDrag && dragState?.pointerType !== 'keyboard';

  const [isResizing, setIsResizing] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const { hoverProps, isHovered } = useHover({ isDisabled: isActiveDrag });
  // A `corner` grip and its hit-zone live outside the widget box, so hovering the
  // half that hangs out is not hovering the widget. Without this the grip fades
  // away exactly as the pointer arrives on it - the affordance retreats from the
  // gesture it is inviting.
  const { hoverProps: layerHoverProps, isHovered: isLayerHovered } = useHover({
    isDisabled: isActiveDrag,
  });
  const { focusProps, isFocusVisible } = useFocusRing();
  const { focusWithinProps } = useFocusWithin({
    onFocusWithinChange: setIsFocusWithin,
  });

  // Where this widget's grips go, when nobody said explicitly.
  //
  // A widget holding a board puts them OUTSIDE its box, in the grid gutter; every
  // other widget keeps them INSIDE. That is what stops the two levels of a nested
  // board claiming the same pixel: the container's affordance is beyond its edge,
  // its children's are within theirs, and no geometry is shared. An explicit
  // `resizeGripPlacement` still wins - a consumer that wants the old look, or
  // wants a container's grips inside, says so.
  const placement: BoardResizeGripPlacement =
    resizeGripPlacement ?? (nestedBoardCount > 0 ? 'outside' : 'inside');

  // Report this widget's hover to the container holding it (null at the top
  // level), so only one level of a nested board shows grips at a time. Balanced
  // by construction: the cleanup runs on un-hover and on unmount, so a widget
  // that disappears mid-hover cannot leave its container stood down for good.
  //
  // The grip layer counts as this widget, not as a gap between it and its
  // container. It matters once this widget is itself a container — three levels
  // deep, a widget holding a board inside a board — because then its own grips
  // are `outside`, in the gutter, off its box. Reporting only `isHovered` there
  // left the pointer sitting on this widget's grips while the container above
  // still thought nothing of its own was hovered, and both levels lit up at once:
  // exactly the collision the placement split exists to prevent.
  const parentHost = useBoardHost();
  const reportHoverToHost = parentHost?.setDescendantHovered;
  const isSelfHovered = isHovered || isLayerHovered;
  useEffect(() => {
    if (!reportHoverToHost || !isSelfHovered) return;

    reportHoverToHost(true);

    return () => reportHoverToHost(false);
  }, [reportHoverToHost, isSelfHovered]);

  // Reveal the resize grips when the widget is interacted with (but not while it
  // is being dragged, where the widget floats in the overlay).
  //
  // A container stands down while the pointer is on one of its children: the
  // pointer is inside every ancestor at once, so without this, hovering a child
  // lights up its grips and every container's above it.
  const gripsRevealed =
    isResizable &&
    !item.static &&
    !isActiveDrag &&
    !descendantHoverCount &&
    (isSelfHovered || isFocusWithin || isResizing);

  const { moveProps } = useMove({
    onMoveStart(e) {
      if (!isDraggable) return;
      const rect = hostRef.current?.getBoundingClientRect();
      const pos = calcGridItemPosition(
        positionParams,
        item.x,
        item.y,
        item.w,
        item.h,
      );
      const vr: ViewportRect = rect
        ? {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          }
        : {
            left: pos.left,
            top: pos.top,
            width: pos.width,
            height: pos.height,
          };
      registry.onDragStart(boardId, item.i, vr, e.pointerType, hostRef.current);
      onDragLifecycle?.(item.i, 'start');
    },
    onMove(e) {
      if (!isDraggable) return;
      if (e.pointerType === 'keyboard') {
        // Amplify arrow-key steps to a full grid cell so items actually move.
        const colWidth = calcGridColWidth(positionParams);
        const stepX = colWidth + positionParams.margin[0];
        const stepY = positionParams.rowHeight + positionParams.margin[1];
        registry.onDragMove(
          Math.sign(e.deltaX) * stepX,
          Math.sign(e.deltaY) * stepY,
          e.pointerType,
        );
        onDragLifecycle?.(item.i, 'move');
        return;
      }
      registry.onDragMove(e.deltaX, e.deltaY, e.pointerType);
      onDragLifecycle?.(item.i, 'move');
    },
    onMoveEnd() {
      if (!isDraggable) return;
      registry.onDragEnd();
      onDragLifecycle?.(item.i, 'end');
    },
  });

  // `role="group"` is what makes `aria-roledescription` legal here - it is
  // invalid on a role-less `div`, which is what this element used to be. A
  // collection role (`option`, `gridcell`, ...) would be the only way to carry a
  // real `aria-selected`, but those require presentational children and a
  // widget hosts arbitrary interactive content, so selection is conveyed by the
  // board's live region plus the shared description below instead.
  const a11yProps = {
    role: 'group',
    tabIndex: isDraggable || isSelectable ? 0 : undefined,
    'aria-roledescription': isDraggable
      ? t('board.draggableWidget', 'Draggable widget')
      : t('board.widget', 'Widget'),
    'aria-label': ariaLabel ?? qa ?? item.i,
    'aria-describedby': isSelected ? selectedHintId : undefined,
    'aria-keyshortcuts': isSelectable ? 'Space' : undefined,
  };

  // True from the moment a real move begins until the click that ends the
  // gesture has been swallowed. `useMove` binds only pointerdown/keydown, never
  // click, so a click handler composes with it cleanly - but the click that
  // *terminates* a drag would otherwise land as a selection. Event order is
  // pointerdown -> onMove* -> pointerup -> onMoveEnd -> click, so this ref is
  // always accurate by the time the click arrives. More reliable than a pixel
  // threshold, which has to guess.
  const isInteractiveTarget = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;

    return !!(selectionCancel && el?.closest?.(selectionCancel));
  };

  /**
   * Pressing something interactive means the user has moved on from the
   * selection, so the selection is dropped — always, whatever the control is and
   * whatever it does with the event.
   *
   * That "always" is why this is a *capture*-phase handler and not part of
   * `handleSelectPointerDown` below. A bubble-phase handler only sees the
   * presses that reach the host, and a control is free to call
   * `stopPropagation()` before that happens — React Aria's `usePress` does it by
   * default, which is why some in-widget buttons dropped the selection and
   * others silently did not. Capture runs top-down, so it lands before any
   * descendant can speak. Portaled controls (a menu opened from a widget's
   * toolbar) are covered too: React propagates events along the React tree, so a
   * portal declared inside this widget still passes through here.
   *
   * Nothing is stopped or prevented here — the handler only reads the target, so
   * the control keeps its press, its focus and its default behaviour intact.
   */
  const handleSelectPointerDownCapture = (e: React.PointerEvent) => {
    if (!isSelectable || e.button !== 0) return;

    if (isInteractiveTarget(e.target)) {
      onSelectionReset?.();
    }
  };

  // The React capture handler above is dispatched from the React root, so a
  // descendant that stops the *native* event (charting and mapping libraries
  // attach their own listeners and do exactly that) keeps it from ever reaching
  // React — capture phase included. A native capture listener on the host node
  // itself sits below any such descendant and cannot be pre-empted. The two
  // overlap for the ordinary case and that costs nothing: clearing an already
  // empty selection is a no-op.
  useEffect(() => {
    const node = hostRef.current;

    if (!node || !isSelectable || !selectionCancel || !onSelectionReset) return;

    const handleCapture = (event: PointerEvent) => {
      if (event.button !== 0) return;

      const target = event.target as HTMLElement | null;

      if (target?.closest?.(selectionCancel)) {
        onSelectionReset();
      }
    };

    node.addEventListener('pointerdown', handleCapture, true);

    return () => node.removeEventListener('pointerdown', handleCapture, true);
  }, [isSelectable, selectionCancel, onSelectionReset]);

  /**
   * Selecting and starting a drag are the *same* gesture: you grab the thing you
   * are about to move. So the press selects immediately and the drag arms behind
   * it — move and it drags, stay still and it was only a selection. This is what
   * every canvas tool does, and it is why there is no ambiguity to resolve with a
   * modifier.
   *
   *  - a press on an interactive descendant belongs to that control, so the
   *    press is left alone (the selection was already dropped in the capture
   *    phase above);
   *  - <kbd>Shift</kbd> or the platform modifier toggles membership;
   *  - a press on an unselected widget makes it the selection, so the drag that
   *    follows moves exactly what was grabbed;
   *  - a press on an already-selected widget changes nothing, so the drag moves
   *    the whole group.
   *
   * Runs before the drag handler (see the `mergeProps` order below), so the
   * registry resolves the group against the selection this press just made.
   */
  const handleSelectPointerDown = (e: React.PointerEvent) => {
    if (!isSelectable || !onSelect || e.button !== 0) return;

    if (isInteractiveTarget(e.target)) return;

    // A press this widget owns must never reach an ancestor widget host: in a
    // nested board the outer widget would otherwise select itself on top of the
    // inner selection. This has to cover the already-selected case too, which
    // changes nothing here but is still a press this board handled — and
    // `stopBubbleProps` below only guards draggable widgets.
    e.stopPropagation();

    if (e.shiftKey || e[selectModifierKey]) {
      onSelect(item.i, true);

      return;
    }

    if (!isSelected) {
      onSelect(item.i, false);
    }
  };

  const handleSelectKeyDown = (e: React.KeyboardEvent) => {
    // Same guard the arrow keys use: only act when the host itself is focused,
    // so Space inside a nested input or button keeps its meaning.
    if (e.target !== e.currentTarget) return;
    if (!isSelectable || !onSelect) return;
    if (e.key !== ' ' && e.key !== 'Spacebar') return;

    // No modifier needed here: focus already says which widget is meant, and
    // Space cannot be mistaken for the start of a drag. Only swallow the key
    // once we know we are acting on it, so a board without selection still
    // scrolls on Space.
    e.preventDefault();
    e.stopPropagation();
    // Space is an explicit selection gesture (a click is also "interact with
    // this"), so it toggles - that is the keyboard's way to deselect one widget.
    onSelect(item.i, true);
  };

  // When this widget is draggable it owns its gesture, so stop the pointer-down
  // from bubbling to an ancestor widget host (e.g. a container widget hosting a
  // nested board / Tabs). Otherwise the ancestor's `useMove` would start a
  // second drag from the same press and the whole parent widget would move too.
  // Non-draggable widgets let the event bubble so their container stays grabbable
  // through their content.
  const stopBubbleProps = isDraggable
    ? {
        onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
        onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
        onTouchStart: (e: React.TouchEvent) => e.stopPropagation(),
      }
    : {};

  // Gate a pointer drag by `dragHandle` / `dragCancel` selectors. Returns true
  // when the press must NOT start a drag (outside a `dragHandle`, or matching
  // `dragCancel`).
  const shouldGateDrag = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    if (dragHandle && !target.closest(dragHandle)) return true;
    if (dragCancel && target.closest(dragCancel)) return true;

    // `selectionCancel` already declares which descendants are interactive, and
    // a drag must not start from them either — otherwise `useMove`'s
    // `preventDefault()` on pointer-down swallows the native focus and an input
    // inside a widget cannot be typed into. Only for selectable widgets, so a
    // board that never opted into selection keeps its exact previous behaviour
    // and `dragCancel` stays the only thing that gates a drag there.
    return !!(
      isSelectable &&
      selectionCancel &&
      target.closest(selectionCancel)
    );
  };

  // The gate wraps `useMove`'s own pointer-down handlers rather than a separate
  // capture-phase listener. When a press is gated we simply do not forward it to
  // `useMove`, so the drag never begins. This is deliberate: `useMove`'s
  // pointer-down handler calls both `stopPropagation()` and `preventDefault()`.
  // Calling it (or pre-empting it with a capture-phase `stopPropagation()`)
  // would break the very controls `dragCancel` is meant to protect - a
  // `preventDefault()` on pointer-down cancels a native `<input>`'s focus, and a
  // capture-phase `stopPropagation()` swallows a `<button>`'s own press events.
  // Skipping `useMove` entirely leaves the target's default behavior and its own
  // handlers fully intact.
  //
  // Keyboard moves also go through `useMove` (`onKeyDown`). Arrow keys must only
  // move the widget when the host itself is focused — not when focus is inside a
  // nested input, textarea, or other descendant (those events bubble to the host
  // and would otherwise steal caret / list navigation).
  //
  // A non-draggable widget must not carry `moveProps` at all: `useMove`'s
  // pointer-down handler calls `preventDefault()`, which cancels native text
  // selection inside the widget. Read-only boards (`isDraggable={false}`) still
  // need selectable content, so we drop the handlers entirely instead of relying
  // on the early-returns inside the `onMove*` callbacks.
  const gatedMoveProps = !isDraggable
    ? {}
    : {
        ...moveProps,
        ...(moveProps.onPointerDown && {
          onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
            if (shouldGateDrag(e.target)) return;
            hostRef.current?.focus({ preventScroll: true });
            moveProps.onPointerDown!(e);
          },
        }),
        ...(moveProps.onMouseDown && {
          onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => {
            if (shouldGateDrag(e.target)) return;
            hostRef.current?.focus({ preventScroll: true });
            moveProps.onMouseDown!(e);
          },
        }),
        ...(moveProps.onTouchStart && {
          onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => {
            if (shouldGateDrag(e.target)) return;
            moveProps.onTouchStart!(e);
          },
        }),
        ...(moveProps.onKeyDown && {
          onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.target !== e.currentTarget) return;
            handleSelectKeyDown(e);
            if (e.defaultPrevented) return;
            moveProps.onKeyDown!(e);
          },
        }),
      };

  // A non-draggable widget gets no `moveProps` at all, so its Space handling and
  // its focusability have to come from here instead.
  const selectionProps = isSelectable
    ? {
        onPointerDownCapture: handleSelectPointerDownCapture,
        onPointerDown: handleSelectPointerDown,
        // A draggable widget routes Space through the drag gate below, which
        // already enforces the host-focused rule; a non-draggable one gets no
        // `moveProps` at all and needs its own handler.
        ...(isDraggable ? {} : { onKeyDown: handleSelectKeyDown }),
      }
    : {};

  const handleResize = (
    axis: ResizeHandleAxis,
    phase: ResizePhase,
    dx: number,
    dy: number,
  ) => {
    if (phase === 'start') setIsResizing(true);
    else if (phase === 'end') setIsResizing(false);
    onResize(item.i, axis, phase, dx, dy);
  };

  const mods = {
    drag: isActiveDrag,
    draggable: isDraggable && !isActiveDrag,
    static: !!item.static,
    resizing: isResizing,
    card: isCard,
    'no-hover-ring': !hoverRing,
    hovered: isHovered,
    'focus-visible': isFocusVisible,
    selected: isSelected,
    // Mutually exclusive with `selected` by construction, so the two never
    // compete for precedence in a style map — and an additive lasso leaves the
    // widgets it already owns looking fully selected rather than downgrading
    // them to a preview.
    'pre-selected': isPreSelected && !isSelected,
  };

  // A widget whose only resize axes are corners has nothing to fall back on if a
  // nested board's child takes one of those corners from it (see `ResizeHandle`).
  // That is a layout mistake with no visible symptom other than "resizing this
  // container does nothing", so say so out loud — but only when it actually
  // happens, since whether a child sits in that corner is a runtime question.
  const cornerYieldWarning =
    isDevEnv() && !resizeHandles.some(isEdgeAxis)
      ? `Board: widget "${item.i}" yielded a resize press to a handle of a board nested inside it, because their handles sit on the same point (a nested board with no \`containerPadding\` puts its last child's corner exactly on its host's). The innermost handle wins, and this widget has only corner \`resizeHandles\`, so it can no longer be resized there. Give it an edge axis to fall back on (e.g. \`resizeHandles={['se', 'e', 's']}\`), or give the nested board some \`containerPadding\` so the two corners stop coinciding.`
      : undefined;

  // An `outside` grip needs gutter to sit in. Warn where there is not enough,
  // since the fallback (keep the band, overhang the neighbour) is visible and the
  // fix — widen `margin` — belongs to the board, not to the widget.
  //
  // `isDevEnv()` rather than a bare `process.env.NODE_ENV` check: the build folds
  // that constant away and keeps whichever branch it resolved to, so a
  // `!== 'production'` guard compiled at a dev NODE_ENV disappears and leaves the
  // warning firing in consumers' production bundles. `isDevEnv()` is evaluated at
  // runtime, so one build serves both — the same reason Tasty's diagnostics do it.
  if (isDevEnv() && placement === 'outside') {
    const [marginX, marginY] = positionParams.margin;

    if (marginX < OUTSIDE_GRIP_MIN_BAND || marginY < OUTSIDE_GRIP_MIN_BAND) {
      warnOnce(
        `Board: widget "${item.i}" holds a nested board, so its resize grips are drawn outside its box - but this board's \`margin\` is [${marginX}, ${marginY}] and a grip needs ${OUTSIDE_GRIP_MIN_BAND}px of gutter to sit in. The grips keep their size and overhang the neighbouring widgets. Raise \`margin\` to at least ${OUTSIDE_GRIP_MIN_BAND}px on both axes, or set \`resizeGripPlacement\` explicitly to put them back inside.`,
      );
    }
  }

  const content = (
    <BoardHostContext.Provider value={hostValue}>
      {registration?.content}
      {isResizable && !item.static && placement !== 'outside' ? (
        <>
          {/* A `corner` grip and its hit-zone both move to the sibling
              `GripLayerElement` below, which the widget's own `overflow: hidden`
              cannot clip. They travel together: hoisting only the visual would
              leave the half that hangs outside impossible to grab. Under
              `outside` the whole set moves there and this branch renders nothing:
              no part of the affordance belongs over the widget's own content. */}
          {(placement === 'corner'
            ? resizeHandles.filter((axis) => !isCornerAxis(axis))
            : resizeHandles
          ).map((axis) => (
            <ResizeHandle
              key={axis}
              axis={axis}
              placement={placement}
              boardDepth={boardDepth}
              yieldWarning={cornerYieldWarning}
              onResize={handleResize}
            />
          ))}
          {placement === 'corner'
            ? null
            : resizeHandles
                .filter(isCornerAxis)
                .map((axis) => (
                  <GripElement
                    key={`grip-${axis}`}
                    data-axis={axis}
                    mods={{ revealed: gripsRevealed, placement: 'inside' }}
                    aria-hidden="true"
                  />
                ))}
          {resizeHandles.filter(isEdgeAxis).map((axis) => (
            <EdgeGripElement
              key={`edge-grip-${axis}`}
              data-axis={axis}
              mods={{ revealed: gripsRevealed, resizing: isResizing }}
              aria-hidden="true"
            >
              <div data-element="Dot" />
              <div data-element="Dot" />
              <div data-element="Dot" />
              <div data-element="Dot" />
              <div data-element="Dot" />
            </EdgeGripElement>
          ))}
        </>
      ) : null}
    </BoardHostContext.Provider>
  );

  const pos = calcGridItemPosition(
    positionParams,
    item.x,
    item.y,
    item.w,
    item.h,
  );

  // While dragging with a pointer, the widget's visual floats in the shared
  // overlay so it is never clipped by an ancestor's `overflow: hidden`. The
  // gesture-owning element (the one carrying `moveProps`) must NOT be the node
  // that moves into the overlay: React Aria's `useMove` binds its pointer
  // move/end listeners relative to the node that received `onPointerDown`, and
  // relocating that node into the portal tears it down and mounts a fresh one
  // (inside a `pointerEvents: 'none'` layer), which can drop the in-flight
  // gesture. Instead we keep a stable, always-mounted in-grid host that owns the
  // gesture for its whole lifetime, and portal a separate, non-interactive
  // visual clone into the overlay.
  const overlayNode = registry.overlayRef.current;
  // Non-grabbed group members float too, from their own drag-start rect plus the
  // one shared gesture delta. Measuring them here would be wrong (the board is
  // mid-reflow); the registry measured every member once at drag start, which is
  // the only safe window.
  const memberRect = isDragMember
    ? dragState!.memberRects.get(item.i)
    : undefined;
  const floatInOverlay =
    !!overlayNode &&
    !!dragState &&
    dragState.pointerType !== 'keyboard' &&
    (useOverlay || (isDragMember && !!memberRect));

  // Where the floating clone sits. The grabbed widget tracks the live drag rect
  // directly; a member tracks its own start rect offset by the same delta, so
  // the block moves as one.
  const floatRect =
    floatInOverlay && dragState
      ? isActiveDrag || !memberRect
        ? dragState.rect
        : {
            left:
              memberRect.left +
              (dragState.rect.left - dragState.startRect.left),
            top:
              memberRect.top + (dragState.rect.top - dragState.startRect.top),
            width: memberRect.width,
            height: memberRect.height,
          }
      : null;

  // A corner hit-zone reaches only `CORNER_HIT_INWARD` into the widget, so the
  // rest of its size has to come from outward, where there is nothing but grid
  // gutter to cover. Half the gutter is the ceiling: past the midline the zone
  // would start eating into the NEIGHBOUR's content, which is the same bug
  // pointing the other way. `CORNER_HIT_INWARD` is the floor, so the zone is
  // never smaller than the dot it stands for even on a gutterless board — there
  // it matches the dot exactly, overhang for overhang.
  const cornerHitOutward = Math.min(
    CORNER_HIT_OUTWARD_MAX,
    Math.max(
      CORNER_HIT_INWARD,
      Math.min(positionParams.margin[0], positionParams.margin[1]) / 2,
    ),
  );

  // An `outside` grip owns a band measured out from the widget's edge: the grid
  // gutter, where the gutter can hold it. Below the floor it keeps the floor and
  // overhangs the neighbour instead — an affordance too thin to hit is worse than
  // one that encroaches, and the warning below makes the encroachment a choice
  // rather than a surprise.
  const gripBand: [number, number] = [
    Math.max(OUTSIDE_GRIP_MIN_BAND, positionParams.margin[0]),
    Math.max(OUTSIDE_GRIP_MIN_BAND, positionParams.margin[1]),
  ];

  // Published on the host as well as on the grip layer. Both carry handles for
  // this same widget — edge axes stay inside the host, corner axes are hoisted
  // out — and a handle whose geometry depended on which of the two it happened to
  // land in would be a trap for the next person to move one.
  const cornerHitVars = {
    '--corner-hit-size': `${CORNER_HIT_INWARD + cornerHitOutward}px`,
    '--corner-hit-overhang': `${-cornerHitOutward}px`,
    '--grip-band-x': `${gripBand[0]}px`,
    '--grip-band-y': `${gripBand[1]}px`,
    // What the band gives up to the gap, split evenly so the painted pill floats
    // in the middle of the gutter instead of leaning on one side of it.
    '--grip-pad-x': `${Math.max(0, (gripBand[0] - OUTSIDE_GRIP_THICKNESS) / 2)}px`,
    '--grip-pad-y': `${Math.max(0, (gripBand[1] - OUTSIDE_GRIP_THICKNESS) / 2)}px`,
    // A corner grip lies in the square where the two gutters cross, so each of
    // its dimensions is bounded by its own axis's band.
    '--outside-corner-w': `${cornerGripExtent(gripBand[0])}px`,
    '--outside-corner-h': `${cornerGripExtent(gripBand[1])}px`,
  } as CSSProperties;

  const hostStyle: CSSProperties = {
    ...cornerHitVars,
    left: `${pos.left}px`,
    top: `${pos.top}px`,
    width: `${pos.width}px`,
    height: `${pos.height}px`,
    // Kept mounted but hidden while its clone floats, so the gesture stays live
    // on this node (the pointer listeners never get torn down).
    ...(floatInOverlay ? { opacity: 0, pointerEvents: 'none' } : null),
  };

  // The floating clone carries the "drag" affordance (raised shadow/z-index);
  // keep the hidden host flat. Keyboard drags (which never float) still
  // highlight the in-grid host, so only suppress `drag` when floating.
  // App mods go UNDER the board's own: a custom mod must never be able to
  // shadow `selected`, `drag` and friends, which the board's own style map and
  // its accessibility wiring both depend on.
  const hostMods = {
    ...customMods,
    ...mods,
    drag: isActiveDrag && !floatInOverlay,
    settled,
  };

  // The host is always rendered first, with a stable element shape, so React
  // reuses the same DOM node across the drag transition (never remounts it).
  const host = (
    <WidgetElement
      ref={hostRef}
      // Marks this element as a board widget host so the registry can find the
      // container widget a nested board lives in (used to keep a drag anchored to
      // a nested board while the anchor is still over its host - e.g. the Tabs
      // header above a nested board - instead of reflowing the ancestor board).
      data-board-widget-host=""
      // Which widget, as opposed to "am I inside a widget host" - the two are
      // separate questions and the existing attribute is used as a presence
      // selector, so overloading it would make every such selector implicitly
      // value-dependent. Namespaced so it cannot collide with an app's own
      // `data-widget-id`.
      data-board-widget-id={item.i}
      {...mergeProps(
        // Before `gatedMoveProps`: the press selects, and only then does the
        // drag start and read that selection to decide what moves.
        selectionProps,
        gatedMoveProps,
        stopBubbleProps,
        hoverProps,
        focusProps,
        focusWithinProps,
        a11yProps,
        { style: hostStyle },
      )}
      qa={qa}
      mods={hostMods}
      styles={widgetStyles as Styles}
    >
      {floatInOverlay ? null : content}
    </WidgetElement>
  );

  const overlayClone = floatInOverlay
    ? createPortal(
        <WidgetElement
          style={{
            position: 'absolute',
            left: `${floatRect!.left}px`,
            top: `${floatRect!.top}px`,
            width: `${floatRect!.width}px`,
            height: `${floatRect!.height}px`,
            pointerEvents: 'none',
          }}
          // `hostMods` rather than `mods`, so the app's own modifiers survive the
          // gesture: the clone IS the widget while a pointer drag is in flight
          // (the in-grid host is hidden), and a custom state blinking off for the
          // duration of the drag is exactly when it would be most noticeable.
          mods={{ ...hostMods, drag: true, floating: true }}
          styles={widgetStyles as Styles}
          aria-hidden="true"
        >
          {content}
        </WidgetElement>,
        overlayNode!,
      )
    : null;

  // Grips that must escape the widget's clip, hoisted into `GripLayerElement`
  // (see its own note). Positioned on the same grid rect as the host, so the two
  // stay in step through reflows and auto-height changes.
  //
  // Under `corner` that is the corner axes, whose grips straddle the edge. Under
  // `outside` it is every axis, since the whole affordance lives in the gutter.
  const layerAxes =
    isResizable && !item.static
      ? placement === 'outside'
        ? resizeHandles
        : placement === 'corner'
          ? resizeHandles.filter(isCornerAxis)
          : []
      : [];
  // Suppressed while the widget floats in the drag overlay: the layer mirrors the
  // widget's *grid* rect, so leaving it behind would park a live hit-zone on a
  // cell the widget has visually left.
  // The layer is also what carries corner chrome, so it renders when either the
  // grips or the chrome need it.
  const gripLayer =
    (layerAxes.length || cornerChrome) && !floatInOverlay ? (
      <GripLayerElement
        {...layerHoverProps}
        style={{
          ...cornerHitVars,
          left: `${pos.left}px`,
          top: `${pos.top}px`,
          width: `${pos.width}px`,
          height: `${pos.height}px`,
        }}
        // Only the grips are decorative. Chrome is real, focusable UI, so the
        // layer can only be hidden from assistive tech when it holds no chrome.
        aria-hidden={cornerChrome ? undefined : 'true'}
      >
        {layerAxes.map((axis) => (
          <ResizeHandle
            key={`handle-${axis}`}
            axis={axis}
            placement={placement}
            boardDepth={boardDepth}
            yieldWarning={cornerYieldWarning}
            isRevealed={gripsRevealed}
            isResizing={isResizing}
            onResize={handleResize}
          />
        ))}
        {/* `outside` needs no separate grip: its hit-zone IS the control. */}
        {placement === 'outside'
          ? null
          : layerAxes.map((axis) => (
              <GripElement
                key={`grip-${axis}`}
                data-axis={axis}
                mods={{ revealed: gripsRevealed, placement: 'corner' }}
                aria-hidden="true"
              />
            ))}
        {cornerChrome ? (
          <CornerChromeElement mods={{ corner: cornerChromePlacement }}>
            {cornerChrome}
          </CornerChromeElement>
        ) : null}
      </GripLayerElement>
    ) : null;

  return (
    <>
      {host}
      {gripLayer}
      {overlayClone}
    </>
  );
}
