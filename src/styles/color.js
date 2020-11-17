import { createRule } from '../utils/styles';

export default function colorStyle({ color }) {
  return createRule('color', color);
}

colorStyle.__styleLookup = ['color'];
