import { dimensionStyle } from './dimension.ts';

const dimension = dimensionStyle('width');

export function widthStyle({ width }) {
  return dimension(width);
}

widthStyle.__lookupStyles = ['width'];
