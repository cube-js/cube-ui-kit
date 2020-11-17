import { createRule } from '../utils/styles';

export default function columnsStyle({ columns }) {
  return createRule('grid-template-columns', columns);
}

columnsStyle.__styleLookup = ['columns'];
