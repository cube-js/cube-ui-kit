import { createRule } from '../utils/styles';

export default function rowsStyle({ rows }) {
  return createRule('grid-template-rows', rows);
}

rowsStyle.__styleLookup = ['rows'];
