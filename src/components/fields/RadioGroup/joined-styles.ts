import type { Styles } from '@tenphi/tasty';

// =============================================================================
// Joined button-group look, shared by `Radio.Group type="button"` and
// `ToggleGroup`. They keep their own semantics (radio group vs toggle buttons)
// and keyboard behaviour, but render one control: a row of buttons sized by
// their content that share their borders. Radio is the reference.
//
// The join is keyed on the `joined` mod. RadioGroup and Radio set it for
// `type="button"`; ToggleGroup and its items always set it. The button layout
// in `JOINED_ITEM_STYLES` is not keyed: `Radio.Tabs` uses it too, under the
// segmented look (`navigation/Tabs/segmented-styles.ts`).
//
// `ToggleGroup/joined.browser.test.tsx` renders both controls and fails when
// their computed styles part.
// =============================================================================

/**
 * Same columns as `Item`, but none of them stretches — a button in a group is
 * sized by its content, not stretched like a list item. The label column still
 * has a zero minimum, the way `Item`'s `1sf` does, so a button given less room
 * than its label truncates the label instead of overflowing the button — which
 * is also what lets the auto tooltip (`tooltip` / `tooltip={true}`) fire.
 */
const BUTTON_COLUMNS =
  'max-content max-content minmax(0, max-content) max-content max-content max-content';

/**
 * A `block` description spans every column, and a spanning item's width goes
 * to the columns with an intrinsic minimum. With a zero-minimum label column
 * that is every column but the label's — so the description's width lands in
 * the empty icon / prefix / suffix columns and the button grows to label plus
 * description instead of the wider of the two. Only this layout keeps the
 * all-`max-content` columns, and with them a label that does not truncate.
 */
const BUTTON_BLOCK_COLUMNS =
  'max-content max-content max-content max-content max-content max-content';

/**
 * The group: no gap, so the buttons can overlap by one border width (see
 * `JOINED_ITEM_STYLES`). It isolates its stacking, so a raised button stays
 * inside the group and never paints over a consumer's sticky header or overlay
 * — a selected button stays raised for as long as it is selected.
 *
 * `gap` has no `''` key: `mergeStyles(styles, JOINED_GROUP_STYLES)` appends it
 * to the group's own map, which keeps its default for the other layouts.
 */
export const JOINED_GROUP_STYLES: Styles = {
  // oxlint-disable-next-line tasty/require-default-state -- extends the group's own map (see above)
  gap: { joined: 0 },
  isolation: { '': 'auto', joined: 'isolate' },
};

/**
 * One button: an `Item` sized by its content, with the join on top.
 *
 * The corner radius is shared, so the first and last buttons keep only their
 * outer corners and the middle ones go square. Every button but the first
 * overlaps its neighbour by one border width, so two neighbours draw one line
 * between them.
 *
 * The selected button is raised above its neighbours, so its brand-tinted
 * border shows on all four sides: otherwise the next button would paint over
 * its right edge. A keyboard-focused button goes above the selected one, so its
 * ring is never covered. Hover changes no border, so it raises nothing.
 */
export const JOINED_ITEM_STYLES: Styles = {
  preset: 't3m / tight',
  flexGrow: 1,
  // Same areas as `Item`. The `description` rows have to be repeated here
  // because a plain string would replace `Item`'s whole state map and leave
  // the description without a grid area to land in.
  gridTemplate: {
    '': `"icon prefix label suffix rightIcon actions" auto / ${BUTTON_COLUMNS}`,
    'description=inline': `"icon prefix description suffix rightIcon actions" auto / ${BUTTON_COLUMNS}`,
    'description=inline & has-label': `"icon prefix label suffix rightIcon actions" auto "icon prefix description suffix rightIcon actions" auto / ${BUTTON_COLUMNS}`,
    'description=block': `"icon prefix label suffix rightIcon actions" auto "description description description description description description" auto / ${BUTTON_BLOCK_COLUMNS}`,
  },
  placeContent: 'center',
  shadow: {
    '': false,
  },
  radius: {
    '': true,
    'joined & !:last-child': '1r left',
    'joined & !:first-child': '1r right',
    'joined & !:first-child & !:last-child': 0,
  },
  margin: {
    '': 0,
    'joined & !:first-child': '-1bw left',
  },
  zIndex: {
    '': 'auto',
    'joined & selected': 1,
    'joined & focused': 2,
  },

  Label: {
    placeSelf: {
      '': 'center start',
      '!has-prefix & !has-suffix & !has-icon & !has-right-icon': 'center',
    },
  },
};
