import { dimensionStyle } from './dimension';

const dimension = dimensionStyle('height');

export function heightStyle({ height }) {
  return dimension(height);
}

heightStyle.__lookupStyles = ['height'];
