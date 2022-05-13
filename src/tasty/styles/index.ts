import { predefine } from './predefined';

const { STYLE_HANDLER_MAP, defineCustomStyle, defineStyleAlias } = predefine();

export { STYLE_HANDLER_MAP, defineCustomStyle, defineStyleAlias };
export * from './createStyle';
