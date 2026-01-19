import { parseStyle } from '../utils/styles';

export function fillStyle({
  fill,
  backgroundColor,
  image,
  backgroundImage,
  backgroundPosition,
  backgroundSize,
  backgroundRepeat,
  backgroundAttachment,
  backgroundOrigin,
  backgroundClip,
  background,
}) {
  // If background is set, it overrides everything
  if (background) {
    const processed = parseStyle(background);
    return { background: processed.output || background };
  }

  const result: Record<string, string> = {};

  // Priority: backgroundColor > fill
  const colorValue = backgroundColor ?? fill;
  if (colorValue) {
    const parsed = parseStyle(colorValue);
    result['background-color'] = parsed.groups[0]?.colors[0] || colorValue;
  }

  // Priority: backgroundImage > image
  const imageValue = backgroundImage ?? image;
  if (imageValue) {
    const parsed = parseStyle(imageValue);
    result['background-image'] = parsed.output || imageValue;
  }

  // Other background properties (pass through with parseStyle for token support)
  if (backgroundPosition) {
    result['background-position'] =
      parseStyle(backgroundPosition).output || backgroundPosition;
  }
  if (backgroundSize) {
    result['background-size'] =
      parseStyle(backgroundSize).output || backgroundSize;
  }
  if (backgroundRepeat) {
    result['background-repeat'] = backgroundRepeat;
  }
  if (backgroundAttachment) {
    result['background-attachment'] = backgroundAttachment;
  }
  if (backgroundOrigin) {
    result['background-origin'] = backgroundOrigin;
  }
  if (backgroundClip) {
    result['background-clip'] = backgroundClip;
  }

  if (Object.keys(result).length === 0) return;
  return result;
}

fillStyle.__lookupStyles = [
  'fill',
  'backgroundColor',
  'image',
  'backgroundImage',
  'backgroundPosition',
  'backgroundSize',
  'backgroundRepeat',
  'backgroundAttachment',
  'backgroundOrigin',
  'backgroundClip',
  'background',
];

export function svgFillStyle({ svgFill }) {
  if (!svgFill) return;

  const processed = parseStyle(svgFill);
  svgFill = processed.groups[0]?.colors[0] || svgFill;

  return { fill: svgFill };
}

svgFillStyle.__lookupStyles = ['svgFill'];
