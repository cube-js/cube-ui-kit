import { createRule } from '../utils/styles';

export default function displayStyle({ display }) {
  return createRule('display', display);
}

displayStyle.__styleLookup = ['display'];
