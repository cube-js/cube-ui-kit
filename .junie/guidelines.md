# Description

Package name: `@cube-dev/ui-kit`

# Project Structure

## Component file structure (preferable)

/src/components/{category}/{ComponentName}/
- {ComponentName}.tsx – implementation of the component
- {ComponentName}.docs.mdx - documentation
- {ComponentName}.stories.tsx - Storybook stories
- {ComponentName}.test.tsx - Unit tests
- index.tsx - re-export of all instances

## Icons

/src/icons/

# Commands

## Test

All tests: `$ pnpm test`
Specific test: `$ pnpm test -- {TestFileName}`

## Build

`pnpm run build`

## Lint + Fix

`pnpm run fix`

# Stack

- `tasty` style helper.
  - `src/tasty` - sources
  - `src/stories/Tasty.docs.mdx` - documentation
  - `src/stories/Styles.docs.mdx` - custom tasty styles documentation
  - `src/stories/CreateComponent.docs.mdx` - create components using tasty helper.
- Storybook v8.6
- React and React DOM v18
- `styled-components` v6
- `react-aria` and `react-stately` with the latest versions.
- `tabler/icons-react` - icons.

# Recomendations

- Use `DOCUMENTATION_GUIDELINES.md` for writing documentation for components.
- Use icons from `/src/icons` if they have a required one. If not - use `tabler/icons-react`. If we need to customize the size or color of the icon, then wrap it with `<Icon/>` component and pass all required props there. Do not add any props to the tabler icons directly.

## Form System

- Form validation uses async rule-based system with built-in validators:
  - `required` - field is required
  - `type` - validates data type (email, url, number, etc.)
  - `pattern` - regex pattern validation
  - `min`/`max` - length/value constraints
  - `enum` - allowed values
  - `whitespace` - non-empty content
  - `validator` - custom async function
- Form fields support direct integration without Field wrapper
- Use `useForm` hook for form instance management
- Form state includes validation, touched state, and error handling

## Testing

- Testing setup: Jest + React Testing Library + `@testing-library/react-hooks`
- Test configuration: `src/test/setup.ts` with custom configurations
- Testing utilities: `src/test/render.tsx` provides `renderWithRoot` wrapper
- QA attributes: Use `qa` prop for e2e testing selectors (`data-qa`)
- Test environment: Uses `jsdom` with React 18 act() environment
- Coverage: Run `pnpm test-cover` for coverage reports

## Accessibility

- All components use React Aria hooks for accessibility
- Keyboard navigation patterns are consistent across components
- ARIA attributes are automatically managed by React Aria
- Screen reader support is built-in with proper announcements
- Focus management is handled automatically
- Components support all standard ARIA labeling props

## TypeScript

- Interface naming: Use descriptive names with `Props` suffix for component props
- Base props: Extend from `BaseProps` or `AllBaseProps` for standard properties
- Form types: Use `FieldTypes` interface for form field type definitions
- Style props: Use specific style prop interfaces (e.g., `ContainerStyleProps`)
- Generic constraints: Use `extends` for type safety in form and field components

## Component Architecture

- Use `filterBaseProps` to separate design system props from DOM props
- Export pattern: Use barrel exports with compound components (e.g., `Button.Group`)
- Style system: Use `extractStyles` for separating style props from other props
- Modifiers: Use `mods` prop for state-based styling
- Sub-elements: Use `data-element` attribute for targeting specific parts in styles

## Style System (Tasty)

- Use `tasty` documentation
- Use `tasty` custom styles with tasty syntax when possible.
- Use `style` property only for dynamic styles and tokens (css custom properties).
- Style categories: BASE, POSITION, BLOCK, COLOR, TEXT, DIMENSION, FLOW, CONTAINER, OUTER
- Responsive values: Use arrays for breakpoint-based styling
- Modifiers: Use object syntax for conditional styles
- Sub-elements: Target inner elements using capitalized keys in styles
- Style props: Direct style application without `styles` prop
- CSS custom properties: Use `@token-name` syntax for design tokens
- To declare a CSS animation use `styled-components` and then pass the animation name to the tasty styles.

## Export Patterns

- Compound components: Use `Object.assign` pattern for sub-components
- Barrel exports: Each category has index.ts for re-exports
- Main export: All components exported from `src/index.ts`
- Type exports: Export component prop types for external use

## Development Workflow

- Branch naming: `[type/(task-name | scope)]` (e.g., `feat/button-group`)
- Commit convention: `category: message` format
- Changesets: Use `pnpm changeset` for version management
- Code snippets: Use `jsx live=false` for documentation snippets
- Storybook: Two modes - `stories` and `docs` for different outputs

## Performance

- Icon optimization: Reuse icon components, wrap with `<Icon/>` for customization
- Style caching: Tasty system includes built-in style caching
- Bundle size: Monitor with `pnpm size` command
- Lazy loading: Use dynamic imports for large components

## Error Handling

- Form validation: Async error handling with Promise-based validation
- Console suppression: Test setup includes act() warning suppression
- Error boundaries: Use proper error boundaries in complex components
- Validation state: Use `validationState` prop for field error states
