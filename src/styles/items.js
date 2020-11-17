import { createRule } from '../utils/styles';

export default function itemsStyle({ items }) {
  return createRule('place-items', items);
}

itemsStyle.__styleLookup = ['items'];
