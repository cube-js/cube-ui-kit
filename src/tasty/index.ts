import { configure } from './config';
import { okhslPlugin } from './plugins';

export { tasty, Element } from './tasty';
export {
  useStyles,
  useGlobalStyles,
  useRawCSS,
  useProperty,
  useKeyframes,
} from './hooks';
export type {
  UseStylesOptions,
  UseStylesResult,
  UsePropertyOptions,
} from './hooks';
// Configuration API
export {
  configure,
  getConfig,
  isConfigLocked,
  hasStylesGenerated,
  resetConfig,
  isTestEnvironment,
  hasGlobalKeyframes,
  getGlobalKeyframes,
} from './config';
export type { TastyConfig } from './config';

// Plugins
export { okhslPlugin, okhslFunc } from './plugins';
export type { TastyPlugin, TastyPluginFactory } from './plugins';

configure({
  plugins: [okhslPlugin()],
});
// Chunk utilities for advanced use cases
export { CHUNK_NAMES, STYLE_TO_CHUNK, categorizeStyleKeys } from './chunks';
export type { ChunkName, ChunkInfo } from './chunks';
// Advanced state mapping utilities
export { getGlobalPredefinedStates, setGlobalPredefinedStates } from './states';
export type {
  StateParserContext,
  ParsedAdvancedState,
  AtRuleContext,
} from './states';
export * from './utils/filter-base-props';
export * from './utils/colors';
export * from './utils/styles';
export * from './utils/mod-attrs';
export { styleHandlers } from './styles';
export { renderStyles, isSelector } from './pipeline';
export type { StyleResult, RenderResult } from './pipeline';
export * from './utils/dotize';
export * from './styles/list';
export * from './utils/merge-styles';
export * from './utils/warnings';
export * from './utils/get-display-name';
export * from './utils/process-tokens';
export * from './utils/typography';
export * from './injector';
export * from './debug';
export type {
  TastyProps,
  TastyElementOptions,
  TastyElementProps,
  AllBasePropsWithMods,
  SubElementDefinition,
  ElementsDefinition,
  SubElementProps,
} from './tasty';
export type {
  AllBaseProps,
  BaseProps,
  BaseStyleProps,
  DimensionStyleProps,
  ColorStyleProps,
  OuterStyleProps,
  PositionStyleProps,
  TextStyleProps,
  BlockStyleProps,
  BlockInnerStyleProps,
  BlockOuterStyleProps,
  ContainerStyleProps,
  BasePropsWithoutChildren,
  Props,
  FlowStyleProps,
  ShortGridStyles,
  GlobalStyledProps,
  TagName,
  Mods,
  ModValue,
  Tokens,
  TokenValue,
} from './types';
export type {
  StylesInterface,
  Styles,
  StylesWithoutSelectors,
  NoType,
  Selector,
  SuffixForSelector,
  NotSelector,
} from './styles/types';
