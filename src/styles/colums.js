import { createRule, parseStyle } from '../utils/styles';

export default function columnsStyle({ columns }) {
  if (!columns) return '';

  columns = parseStyle(columns, 1).value;

  return createRule('grid-template-columns', columns);
}

columnsStyle.__styleLookup = ['columns'];
