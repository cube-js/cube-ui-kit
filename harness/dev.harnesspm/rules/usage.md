# UI Kit

## Components

- Build screens from `@cube-dev/ui-kit` components before writing your own. Before you use a component, read its page in the UI Kit docs index.
- For a new form, use `Form.useController`. Read the modern form guide in the UI Kit docs index first.

## Styling

- Style with Tasty: the `styles` prop, `tasty()`, and UI Kit's tokens, units and presets. Read the Tasty pages in the UI Kit docs index before you change styles.
- Colors are UI Kit palette tokens, written `#name`, such as `#surface`, `#surface-text` or `#danger-accent-text`. Never paste raw `#rrggbb`, `rgb()` or `hsl()` values.
- To find a token, run `uikit:tokens <part of its name>`. It shows the token's values in light, dark and high contrast, its contrast against the base it was made for, and what an alias such as `#dark` resolves to. Put a text token on its base. The Usage guide lists the legacy aliases that new code avoids.
