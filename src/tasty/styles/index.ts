import { predefine, styleHandlers } from './predefined';

const { STYLE_HANDLER_MAP, defineCustomStyle, defineStyleAlias } = predefine();

export {
  STYLE_HANDLER_MAP,
  defineCustomStyle,
  defineStyleAlias,
  styleHandlers,
};
export * from './createStyle';
export {
  normalizeHandlerDefinition,
  registerHandler,
  resetHandlers,
  validateHandlerResult,
} from './predefined';
