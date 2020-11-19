import { createRule, parseStyle } from '../utils/styles';

export default function rowsStyle({ rows }) {
  if (!rows) return '';

  rows = parseStyle(rows, 1).value;

  return createRule('grid-template-rows', rows);
}

rowsStyle.__styleLookup = ['rows'];
