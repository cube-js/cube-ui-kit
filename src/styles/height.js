import dimensionStyle from './dimension';

const dimension = dimensionStyle('height');

export default function heightStyle({ height }) {
  return dimension(height);
}

heightStyle.__styleLookup = ['height'];
