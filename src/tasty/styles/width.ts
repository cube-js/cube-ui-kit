import { dimensionStyle } from './dimension';

const dimension = dimensionStyle('width');

interface WidthStyleProps {
  width?: string | number | boolean;
  minWidth?: string | number | boolean;
  maxWidth?: string | number | boolean;
}

export function widthStyle({ width, minWidth, maxWidth }: WidthStyleProps) {
  return dimension({ value: width, min: minWidth, max: maxWidth });
}

widthStyle.__lookupStyles = ['width', 'minWidth', 'maxWidth'];
