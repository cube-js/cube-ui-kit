import { dimensionStyle } from './dimension';

const dimension = dimensionStyle('height');

interface HeightStyleProps {
  height?: string | number | boolean;
  minHeight?: string | number | boolean;
  maxHeight?: string | number | boolean;
}

export function heightStyle({
  height,
  minHeight,
  maxHeight,
}: HeightStyleProps) {
  return dimension({ value: height, min: minHeight, max: maxHeight });
}

heightStyle.__lookupStyles = ['height', 'minHeight', 'maxHeight'];
