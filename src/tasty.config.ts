/**
 * UI Kit's internal component tokens, for its own lint
 *
 * A component token that one file sets and another reads, and that no
 * component's docs offer consumers. `@tenphi/eslint-plugin-tasty` merges every
 * `tasty.config.*` from a file's directory up to the project root, so these
 * names reach everything under `src/` on top of the root `tasty.config.ts`.
 * The package doesn't ship `src/`, so a consumer's lint never accepts them.
 *
 * A token a component's docs offer consumers goes in the root config's
 * `componentTokens` instead. `src/tokens/tasty-config.test.ts` fails when a
 * name here is set by no component, or is listed in both places.
 */
export default {
  tokens: [
    // Button, Item, ItemAction and Badge: the inline padding and its parts.
    '$inline-padding',
    '$inline-compensation',
    '$min-inline-padding',
    // Item and ItemActionsWrapper: the actions run, and the rows
    // ItemWithNativeLinks draws.
    '$actions-width',
    '$native-row-inset',
    '$native-row-width',
    '$native-row-height',
    '$native-row-clip',

    // ColorPanel, ColorSwatch, ColorSwatchGroup and HueSlider set these per
    // render through `tokens`.
    '#color-picker',
    '#color-picker-contrast',
    '#color-swatch',
    '#slider-thumb-hovered',
    '$columns',
    // Slider: the track's range and value, and the value label's width.
    '$slider-range-start',
    '$slider-range-end',
    '$slider-value',
    '$slider-value-width',

    // DatePicker's segments and InlineInput's measured width.
    '$segment-min-width',
    '$input-width',
    // Form, for FieldWrapper's side label.
    '$label-width',

    // Layout and its panes, panels and tiny scrollbar (`useTinyScrollbar`).
    '$inset-top',
    '$inset-right',
    '$inset-bottom',
    '$inset-left',
    '$layout-border-size',
    '$pane-size',
    '$pane-min-size',
    '$panel-size',
    '$min-size',
    '$max-size',
    '$scrollbar-h-left',
    '$scrollbar-h-width',
    '$scrollbar-v-top',
    '$scrollbar-v-height',
    // ResizablePanel.
    '$visual-size',
    '$size-compensation',

    // Tabs: the active tab's indicator.
    '$tab-indicator-size',
    '$indicator-start',
    '$indicator-size',
    // Tree, and TableView's tree column.
    '$tree-height',
    '$tree-padding',
    '$tree-content-height',
    '$tree-level',
    '$tree-row-offset',
    // TableView's sections.
    '$section-table-width',
    '$section-viewport-width',

    // Notifications' overlay stack and the Cube spinner.
    '$item-index',
    '$item-top',
    '$cube-spin-size',
  ],
};
