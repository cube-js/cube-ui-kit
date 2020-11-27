import { createRule } from '../utils/styles';

export default function placeStyle({ place }) {
  if (!place) return '';

  return createRule('place-self', place);
}

placeStyle.__styleLookup = ['place'];
