/**
 * Tasty lint configuration
 *
 * `@tenphi/eslint-plugin-tasty` reads this file. It lists the token names,
 * presets, recipes and state aliases UI Kit defines, which a project's styles
 * are checked against, and the components consumers customize through their
 * props rather than by restyling them (`protectedComponents`). The plugin
 * loads it with jiti, which follows the import of `tasty.config.generated.ts`.
 * A loader that only parses the object literal, such as the plugin's own
 * fallback when jiti fails, can't evaluate the spreads and reads no config.
 *
 * Projects using @cube-dev/ui-kit can extend this config:
 * ```typescript
 * export default {
 *   extends: '@cube-dev/ui-kit',
 *   // Add project-specific tokens, states, presets, etc.
 * };
 * ```
 */

import { runtimeNames } from './tasty.config.generated';

/**
 * Component tokens a component's docs offer consumers: to read inside the
 * component that sets them, so their own content lines up with it, or to set
 * on it. Each is part of that component's documented API:
 * `pnpm check:component-tokens` fails when one is in no component's
 * `.docs.mdx`, and `src/tokens/tasty-config.test.ts` when no component sets
 * it. UI Kit's internal component tokens are in `src/tasty.config.ts`, which
 * consumers' lint never reads.
 */
export const componentTokens = [
  // Dialog
  '$dialog-size',
  '$dialog-padding-h',
  '$dialog-title-padding-v',
  '$dialog-content-padding-v',
  '$dialog-footer-v',
  // Item, Button and the text inputs publish their height; ColorSwatch reads it.
  '$size',
  '$prefix-gap',
  '$suffix-gap',
  // ItemButton's actions
  '$action-size',
  // ItemTable's rows and cells
  '#row-base',
  '#row-overlay',
  '#row-text',
  '$row-overlay-weight',
  '$dim',
  '$row-height',
  '$header-height',
  '$cell-padding-x',
  '$cell-padding-y',
  // Layout, for its sub-components
  '$content-padding',
  // FieldWrapper's side label, for a row without one
  '$full-label-width',
  // GridProvider
  '$grid-width',
  '$columns-amount',
  '$column-gap',
  '$column-width',
  // Slider and HueSlider, through `thumbTokens`
  '#slider-thumb',
  // Notifications and Toast: an app sets it to keep the stack below its bar.
  '$overlay-inset-top',
];

export default {
  extends: '@tenphi/tasty',

  /**
   * Consumers re-export `tasty` from this package rather than from
   * `@tenphi/tasty`, and the ESLint plugin only inspects `tasty({ styles })`
   * calls whose import it can trace back to a tracked source. Without this,
   * every downstream project sees zero findings. Unioned with the parent's
   * list, so ui-kit's own `@tenphi/tasty` imports stay covered.
   */
  importSources: ['@cube-dev/ui-kit'],

  /**
   * Components a consumer customizes through their props (`type`, `theme`,
   * `size`, …) rather than by restyling them. `tasty/no-protected-restyle`
   * reports their instance `styles` and `*Styles` props, appearance style
   * props, and `tasty()` wrappers that restyle them, so an intended override
   * carries a reasoned disable. Every export is protected except the layout
   * and typography primitives, the bases meant for extension and the icons,
   * whose `styles` are their API. Style props that place or size the root
   * stay allowed, and containers also keep the props that lay out their
   * content. The first matching entry decides, so the last entry holds the
   * rest. A sub-component such as `Layout.Content` counts as the export it
   * hangs off, unless an entry names its member path, which then decides
   * first. Our own source imports components by relative path, which never
   * matches `source`, so the rule holds consumers only.
   *
   * Without `typeAwareJSX`, the rule reads any prop named like a Tasty style
   * as one, so a component whose own prop shares such a name gets that name
   * allowed in an entry of its own.
   */
  protectedComponents: [
    // `direction` places a field's popover, `filter` matches its options and
    // `resize` is a text field's resize handle. The fields share one entry, so
    // a field without one of these props still gets its name, which is no
    // plausible restyle of a field.
    {
      source: '@cube-dev/ui-kit',
      include: [
        'ComboBox',
        'SearchComboBox',
        'Select',
        'TagInput',
        'CommandTextArea',
        'CommandMenu',
        'FilterListBox',
        'FilterPicker',
        'ListBox',
        'Picker',
        'Input',
        'TextInputBase',
        'TextInput',
        'TextArea',
        'PasswordInput',
        'NumberInput',
        'SearchInput',
      ],
      allowedStyleProps: [
        'position',
        'dimension',
        'direction',
        'filter',
        'resize',
      ],
    },
    {
      source: '@cube-dev/ui-kit',
      include: ['ColorSwatch'],
      allowedStyleProps: ['position', 'dimension', 'color'],
    },
    {
      source: '@cube-dev/ui-kit',
      include: ['AlertDialog'],
      allowedStyleProps: ['position', 'dimension', 'content'],
    },
    {
      source: '@cube-dev/ui-kit',
      include: ['Root'],
      allowedStyleProps: ['position', 'dimension', 'font'],
    },
    {
      source: '@cube-dev/ui-kit',
      include: ['GridProvider'],
      allowedStyleProps: ['position', 'dimension', 'gap'],
    },
    // Containers. `Layout` and `GridLayout` cover their sub-components, such
    // as `Layout.Content`, whose `scrollbar` is their own prop;
    // `ResizablePanel`'s `direction` is the side it resizes from. `Alert`,
    // `Result` and `Skeleton` hold content the consumer supplies, so how that
    // content is spaced is the consumer's call.
    {
      source: '@cube-dev/ui-kit',
      include: [
        'Card',
        'Panel',
        'ResizablePanel',
        'Content',
        'Header',
        'Footer',
        'Layout',
        'GridLayout',
        'Alert',
        'Result',
        'Skeleton',
      ],
      allowedStyleProps: [
        'position',
        'dimension',
        'flow',
        'gap',
        'columnGap',
        'rowGap',
        'place',
        'placeItems',
        'placeContent',
        'align',
        'alignItems',
        'alignContent',
        'justify',
        'justifyItems',
        'justifyContent',
        'gridColumns',
        'gridRows',
        'gridTemplate',
        'gridAreas',
        'gridAutoFlow',
        'gridAutoColumns',
        'gridAutoRows',
        'padding',
        'blockPadding',
        'inlinePadding',
        'overflow',
        'scrollbar',
        'direction',
      ],
    },
    // A placeholder stands in for content of any shape, so `radius` is its
    // shape, like `dimension`.
    {
      source: '@cube-dev/ui-kit',
      include: ['Placeholder'],
      allowedStyleProps: ['position', 'dimension', 'radius'],
    },
    {
      source: '@cube-dev/ui-kit',
      // `*Icon` also matches `Icon`. `Button.Group` is `ButtonGroup`, a
      // `Space`, and its member path decides before `Button` does.
      exclude: [
        'Element',
        'Block',
        'Flex',
        'Flow',
        'Grid',
        'Space',
        'ButtonGroup',
        'Button.Group',
        'Prefix',
        'Suffix',
        'Text',
        'TextItem',
        'Title',
        'Paragraph',
        'Typography',
        'Action',
        '*Icon',
        'IconSwitch',
      ],
      allowedStyleProps: ['position', 'dimension'],
    },
  ],

  /**
   * The names UI Kit defines at runtime come from `tasty.config.generated.ts`,
   * which `pnpm generate:tasty-config` writes: the tokens `getTokens()` emits,
   * the state aliases and recipes `<Root>` registers, and the typography
   * presets. Built-in units (x, r, cr, bw, ow, lh, sf) need no list.
   */
  tokens: [
    ...runtimeNames.tokens,

    // Set for the whole app outside `getTokens()`: `<Root>`'s `tokens`, and
    // the `html` block `GlobalStyles` writes.
    '$pointer',
    '$font-sans',
    '$font-mono',

    ...componentTokens,
  ],
  states: runtimeNames.states,
  presets: runtimeNames.presets,
  recipes: runtimeNames.recipes,
};
