/**
 * How much an element is scaled on screen along an axis by an ancestor's
 * `transform: scale(…)`, such as a zoomable canvas: its on-screen size over its
 * layout size. `getBoundingClientRect()` measures in screen pixels, while
 * `left`, `width` and `scrollLeft` are in layout pixels, so divide a measured
 * distance by this before using it in layout.
 */
export function getLayoutScale(
  element: Element,
  axis: 'horizontal' | 'vertical',
): number {
  const isVertical = axis === 'vertical';
  const style = getComputedStyle(element);
  const px = (value: string) => parseFloat(value) || 0;

  // The rect measures the border box. The computed size is fractional, where
  // `offsetWidth` would round it to whole pixels.
  let layoutSize = px(isVertical ? style.height : style.width);

  if (style.boxSizing !== 'border-box') {
    layoutSize += isVertical
      ? px(style.paddingTop) +
        px(style.paddingBottom) +
        px(style.borderTopWidth) +
        px(style.borderBottomWidth)
      : px(style.paddingLeft) +
        px(style.paddingRight) +
        px(style.borderLeftWidth) +
        px(style.borderRightWidth);
  }

  const rect = element.getBoundingClientRect();
  const screenSize = isVertical ? rect.height : rect.width;

  if (layoutSize <= 0 || screenSize <= 0) return 1;

  const scale = screenSize / layoutSize;

  // The computed size keeps 6 significant digits, so a ratio this close to 1
  // is no scale: unscaled elements keep their exact measurements.
  return Math.abs(scale - 1) < 1e-5 ? 1 : scale;
}
