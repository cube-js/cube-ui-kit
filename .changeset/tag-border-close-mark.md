---
'@cube-dev/ui-kit': patch
---

**Tag:** a default-theme tag now takes the standard `#border` instead of the text color at 20%, which read darker than any field's; themed tags keep their own borders and `special` stays borderless. The close mark on a closable `Tag` and on a `TagInput` chip is quieter: a 12px glyph at 60% of the label color, full color on hover or press, with the button's target unchanged. `closeButtonStyles` still overrides it.
