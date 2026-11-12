## Where colors come from

- UI Kit's palette is a Glaze palette. Its colors are the `#name` tokens in Tasty styles, such as `#surface`, `#surface-text` or `#danger-accent-text`. Use them, and never paste raw `#rrggbb`, `rgb()` or `hsl()` values.
- To find a token, run `uikit:tokens <part of its name>`. It shows the token's values in light, dark and high contrast, and its contrast against the base it was made for. Put a text token on that base.
- A color the palette lacks comes from your own Glaze theme or `glaze.color()` token. Do not write its dark or high-contrast values by hand. To create or change one, use the `glaze-theme` skill.
