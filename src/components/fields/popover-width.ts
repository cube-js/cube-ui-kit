/**
 * The width of a picker's popover: Picker, FilterPicker, and the
 * `ListBoxPopover` of ComboBox, SearchComboBox, TagInput and CommandTextArea.
 *
 * - **Floor:** the trigger's width (`$overlay-min-width`, which each popover
 *   sets from it and defaults to `30x`), and never under `30x`.
 * - **Preferred:** its content. A virtualized list counts its widest rows
 *   (`shared/virtual-width.ts`).
 * - **Cap:** half the viewport on a wide screen. On a narrow one half is under
 *   the floor, so the cap is the viewport less a margin, which React Aria's
 *   `containerPadding` keeps the popover inside. `60x` joins the two.
 */
export const POPOVER_WIDTH =
  'max($overlay-min-width, 30x) max-content max(50vw, min(100vw - 2x, 60x))';
