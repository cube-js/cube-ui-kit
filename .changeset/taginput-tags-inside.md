---
'@cube-dev/ui-kit': minor
---

**TagInput:** `tagPlacement="inside"` puts the chips in the input box, in one wrapping row with the text, for a field with no room below it; `below` stays the default and the preferred layout. One row is exactly the input's height at every size, and the box grows a row at a time. The text is as wide as what is typed, never under 48px: text that does not fit after the chips moves to a row of its own, and is cut only past the full width. The validation icon, clear button and popover trigger ride on the end of the text, so they always wrap together, and a long value or placeholder ends in an ellipsis. Inside, `ArrowLeft` at the start of the text moves to the last chip, `ArrowRight` on the last chip returns to the text, and the arrows stop at the first chip instead of wrapping round. The new `hidePlaceholderWithTags` hides the placeholder once there is a value, in either placement.
