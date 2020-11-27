import { createRule } from '../utils/styles';

export default function itemsStyle({ items }) {
  if (!items) return '';

  return createRule('place-items', items);
}

itemsStyle.__styleLookup = ['items'];
