/**
 * The width of a picker's popover: Picker, FilterPicker, and the
 * `ListBoxPopover` of ComboBox, SearchComboBox, TagInput and CommandTextArea.
 *
 * - **Floor:** what it opens from, `$overlay-min-width`, which each popover
 *   sets from it and defaults to `30x`. A picker's trigger can be a small
 *   button, so a picker's popover is never under `30x` either; a field's
 *   popover matches the field.
 * - **Preferred:** its content. A virtualized list counts its widest rows
 *   (`shared/virtual-width.ts`).
 * - **Cap:** half the viewport on a wide screen. On a narrow one half is under
 *   the floor, so the cap is the viewport less a margin, which React Aria's
 *   `containerPadding` keeps the popover inside. `60x` joins the two.
 */

/** Picker and FilterPicker: at least their trigger and `30x`. */
export const PICKER_POPOVER_WIDTH =
  'max($overlay-min-width, 30x) max-content max(50vw, min(100vw - 2x, 60x))';

/** `ListBoxPopover`: at least its field, or `30x` with no field to match. */
export const FIELD_POPOVER_WIDTH =
  '$overlay-min-width max-content max(50vw, min(100vw - 2x, 60x))';
