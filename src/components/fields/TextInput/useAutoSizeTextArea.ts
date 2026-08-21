import { RefObject, useEffect, useLayoutEffect, useRef } from 'react';

import { useEvent } from '../../../_internal/index';

/**
 * Computed properties that decide where text wraps and how tall a line box is.
 * Copied onto the mirror so it wraps exactly like the live textarea.
 */
const MIRROR_TYPOGRAPHY_PROPS = [
  'direction',
  'fontFamily',
  'fontFeatureSettings',
  'fontKerning',
  'fontSize',
  'fontStretch',
  'fontStyle',
  'fontVariant',
  'fontVariationSettings',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'overflowWrap',
  'tabSize',
  'textIndent',
  'textTransform',
  'whiteSpace',
  'wordBreak',
  'wordSpacing',
] as const;

const FALLBACK_LINE_HEIGHT = 20;

/**
 * An off-screen textarea used to measure how tall the content wants to be.
 *
 * It carries no padding and no border, and its width is set to the live
 * element's *content* width, so `scrollHeight` is the content height and
 * nothing else. `height: 0` is what makes shrinking measurable: a textarea's
 * `scrollHeight` never drops below its own client height, so measuring the live
 * element can only ever report "at least what it already is".
 */
function createMirror(): HTMLTextAreaElement {
  const mirror = document.createElement('textarea');

  mirror.setAttribute('aria-hidden', 'true');
  mirror.setAttribute('tabindex', '-1');
  mirror.readOnly = true;
  mirror.rows = 1;

  Object.assign(mirror.style, {
    position: 'absolute',
    top: '0',
    left: '-9999px',
    boxSizing: 'content-box',
    margin: '0',
    padding: '0',
    border: '0',
    height: '0',
    minHeight: '0',
    maxHeight: 'none',
    overflow: 'hidden',
    resize: 'none',
    visibility: 'hidden',
    pointerEvents: 'none',
  });

  return mirror;
}

/** The width the text actually has to wrap in, scrollbar and padding removed. */
function getContentWidth(
  textarea: HTMLTextAreaElement,
  style: CSSStyleDeclaration,
): number {
  const paddingLeft = parseFloat(style.paddingLeft) || 0;
  const paddingRight = parseFloat(style.paddingRight) || 0;
  const borderLeft = parseFloat(style.borderLeftWidth) || 0;
  const borderRight = parseFloat(style.borderRightWidth) || 0;
  // A classic (space-taking) scrollbar narrows the text; overlay scrollbars
  // report 0 here.
  const scrollbar = Math.max(
    0,
    Math.round(
      textarea.offsetWidth - textarea.clientWidth - borderLeft - borderRight,
    ),
  );

  return Math.max(
    0,
    textarea.getBoundingClientRect().width -
      borderLeft -
      borderRight -
      scrollbar -
      paddingLeft -
      paddingRight,
  );
}

/** `line-height: normal` has no px value to read, so measure one line instead. */
function getLineHeight(
  style: CSSStyleDeclaration,
  mirror: HTMLTextAreaElement,
): number {
  const parsed = parseFloat(style.lineHeight);

  if (Number.isFinite(parsed) && parsed > 0) return parsed;

  const previousValue = mirror.value;

  mirror.value = 'x';

  const measured = mirror.scrollHeight;

  mirror.value = previousValue;

  return measured > 0 ? measured : FALLBACK_LINE_HEIGHT;
}

export interface AutoSizeTextAreaOptions {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  /** Whether the textarea resizes to fit its content. */
  autoSize: boolean;
  /** Minimum number of visible rows. */
  rows: number;
  /** Maximum number of visible rows. */
  maxRows: number;
  /** The rendered value. A change re-measures, so buffered drafts count too. */
  value: unknown;
}

/**
 * Keeps an `autoSize` textarea's height in step with its content, and returns
 * the `adjustHeight` callback so a change handler can resize in the same tick
 * as the keystroke.
 *
 * The height is derived from an off-screen mirror rather than from the live
 * element. Measuring the live element — `height: auto`, read `scrollHeight`,
 * restore — re-lays out every ancestor mid-keystroke: in a chat-style column
 * the input box collapses to one row and the scroll viewport grows by the
 * difference, and the browser's scroll anchoring has to undo that. It does so
 * imperfectly, which is visible as the whole conversation bouncing by a pixel
 * on every keystroke (CUB-4042). Measuring off-screen touches no ancestor, so
 * there is nothing to undo.
 */
export function useAutoSizeTextArea({
  inputRef,
  autoSize,
  rows,
  maxRows,
  value,
}: AutoSizeTextAreaOptions) {
  const mirrorRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustHeight = useEvent(() => {
    const textarea = inputRef.current;

    if (!textarea || !autoSize) return;

    let mirror = mirrorRef.current;

    if (!mirror) {
      mirror = createMirror();
      mirrorRef.current = mirror;
      document.body.appendChild(mirror);
    }

    const style = getComputedStyle(textarea);
    const contentWidth = getContentWidth(textarea, style);

    // Nothing to wrap into: the field is display:none, or has not been laid out
    // yet. Measuring at zero width would wrap every character onto its own line
    // and pin the height at `maxRows`; keep the current height instead and wait
    // for the ResizeObserver to report a real one.
    if (contentWidth === 0) return;

    for (const prop of MIRROR_TYPOGRAPHY_PROPS) {
      mirror.style[prop] = style[prop];
    }

    mirror.style.width = `${contentWidth}px`;
    mirror.value = textarea.value;

    const lineHeight = getLineHeight(style, mirror);
    // A textarea lays every line out at `line-height`, so the content height is
    // a whole number of lines — `round` keeps a fractional line height (a zoomed
    // page, a percentage preset) from adding a phantom row.
    const contentRows = Math.max(
      1,
      Math.round(mirror.scrollHeight / lineHeight),
    );
    const targetRows = Math.max(Math.min(contentRows, maxRows), rows);

    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;
    const borderTop = parseFloat(style.borderTopWidth) || 0;
    const borderBottom = parseFloat(style.borderBottomWidth) || 0;
    // `height` covers padding and border under `border-box` only.
    const box =
      style.boxSizing === 'border-box'
        ? paddingTop + paddingBottom + borderTop + borderBottom
        : 0;

    const nextHeight = `${targetRows * lineHeight + box}px`;

    // Writing an unchanged height would wake the ResizeObserver below for
    // nothing.
    if (textarea.style.height !== nextHeight) {
      textarea.style.height = nextHeight;
    }
  });

  const useEnvironmentalEffect =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  // Re-measure on element resize as that can affect wrapping.
  useEnvironmentalEffect(() => {
    if (!autoSize || !inputRef.current) return;

    adjustHeight();

    const resizeObserver = new ResizeObserver(adjustHeight);

    resizeObserver.observe(inputRef.current);

    return () => resizeObserver.disconnect();
  }, [autoSize, inputRef.current]);

  // Adjust when the value changes programmatically (controlled mode).
  useEnvironmentalEffect(() => {
    if (autoSize && inputRef.current) {
      adjustHeight();
    }
  }, [value]);

  useEffect(
    () => () => {
      mirrorRef.current?.remove();
      mirrorRef.current = null;
    },
    [],
  );

  return adjustHeight;
}
