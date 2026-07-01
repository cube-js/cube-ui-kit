/**
 * Computes the caret's position for a `<textarea>` using a mirror-element
 * technique. jsdom returns zeros (no layout), but in a real browser this gives
 * the caret's viewport coordinates and its line height, so a popover can be
 * anchored to it.
 */

export interface CaretRect {
  /** Caret left edge, in viewport coordinates (px). */
  left: number;
  /** Caret top edge, in viewport coordinates (px). */
  top: number;
  /** Caret height (the textarea's line height), in px. */
  height: number;
}

// Computed styles that affect text wrapping / caret placement inside a textarea.
const MIRROR_STYLES: ReadonlyArray<keyof CSSStyleDeclaration> = [
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
  'whiteSpace',
  'wordWrap',
  'wordBreak',
  'overflowWrap',
];

/**
 * Returns the viewport-space rect of the caret at `index` within `textarea`,
 * or `null` if it can't be measured (e.g. jsdom, no layout, detached node).
 */
export function getCaretRect(
  textarea: HTMLTextAreaElement,
  index: number,
): CaretRect | null {
  if (typeof document === 'undefined') return null;

  const doc = textarea.ownerDocument;
  const style = doc.defaultView?.getComputedStyle(textarea);
  if (!style) return null;

  // Bail out in environments without real layout (jsdom reports 0x0).
  const box = textarea.getBoundingClientRect();
  if (box.width === 0 && box.height === 0) return null;

  const mirror = doc.createElement('div');
  mirror.setAttribute('data-caret-mirror', '');
  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';
  mirror.style.top = '0';
  mirror.style.left = '0';
  // Prevent the mirror from affecting scroll/anchor lookups.
  mirror.style.overflow = 'hidden';

  for (const prop of MIRROR_STYLES) {
    const value = style[prop];
    if (value != null) {
      mirror.style.setProperty(
        prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()),
        value,
      );
    }
  }

  // Match the textarea's content width, not its border-box scroll width.
  mirror.style.width = style.width;

  const value = textarea.value;
  const before = value.slice(0, index);
  const after = value.slice(index) || '.';

  mirror.textContent = before;

  const marker = doc.createElement('span');
  marker.textContent = after;
  marker.style.display = 'inline-block';
  mirror.appendChild(marker);

  // The mirror must be attached to the same document to inherit fonts.
  doc.body.appendChild(mirror);

  let rect: CaretRect | null = null;
  try {
    const mirrorRect = mirror.getBoundingClientRect();
    const markerRect = marker.getBoundingClientRect();
    // The mirror is not scrolled, so subtract the textarea's scroll to map the
    // unscrolled caret offset back into viewport space.
    const { scrollTop, scrollLeft } = textarea;
    rect = {
      left: box.left - scrollLeft + (markerRect.left - mirrorRect.left),
      top: box.top - scrollTop + (markerRect.top - mirrorRect.top),
      height: markerRect.height || parseFloat(style.lineHeight) || 0,
    };
  } finally {
    mirror.remove();
  }

  return rect.height > 0 ? rect : null;
}
