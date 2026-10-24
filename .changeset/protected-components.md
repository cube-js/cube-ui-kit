---
'@cube-dev/ui-kit': minor
---

The published `tasty.config.ts` lists the components a consumer customizes through their props rather than by restyling them, as `protectedComponents`. With `@tenphi/eslint-plugin-tasty` 1.11.0 or newer, a project that extends the config gets `tasty/no-protected-restyle` reports for:

- instance `styles` and `*Styles` props;
- appearance style props such as `fill`, `color`, `border` or `radius`;
- `tasty()` wrappers that restyle one of these components.

Every component is protected except the layout and typography primitives, the `Action` base and the icons. Style props that place or size a component stay allowed. Containers also keep the ones that lay out their content: `Card`, `Panel`, `Content`, `Header`, `Footer` and the `Layout` family.

The rule is a warning in both of the plugin's presets, so a project that uses a preset sees these warnings once it updates. A project that lists its rules sees them only after it enables `tasty/no-protected-restyle`. The Usage docs (Customizing components) describe the contract.
