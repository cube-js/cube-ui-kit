import dimensionStyle from './dimension';

const dimension = dimensionStyle('width');

export default function widthStyle({ width }) {
  return dimension(width);
}

widthStyle.__styleLookup = ['width'];
