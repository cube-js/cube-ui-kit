import { createRule } from '../utils/styles';

export default function placeStyle({ place }) {
  return createRule('place-self', place);
}

placeStyle.__styleLookup = ['place'];
