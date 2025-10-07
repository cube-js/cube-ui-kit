# Component Documentation Guidelines

This guide outlines the standards and structure for documenting components in the Cube UI Kit. Following these guidelines ensures consistency, clarity, and comprehensive coverage of component features.

## Overview

Our component documentation serves multiple purposes:
- Provides clear usage instructions for developers
- Ensures accessibility best practices are communicated
- Documents styling capabilities through the `tasty` style system
- Maintains consistency across all component documentation

## Key Principles

1. **Accessibility First**: Components use React Aria Hooks and documentation should emphasize accessibility features
2. **Style System Integration**: Document `tasty` styling capabilities thoroughly
3. **Practical Examples**: Include real-world usage examples, not just API references
4. **Clear Structure**: Follow the prescribed documentation structure for consistency

## Documentation Structure

Every component documentation file should follow this structure:

```mdx
import { Meta, Canvas, Story, Controls } from '@storybook/addon-docs/blocks';
import { ComponentName } from './ComponentName';
import * as ComponentStories from './ComponentName.stories';

<Meta of={ComponentStories} />

# ComponentName

Brief description of what the component is and its primary purpose.

## When to Use

- Scenario 1 where this component is appropriate
- Scenario 2 where this component is appropriate
- Scenario 3 where this component is appropriate

## Component

<Story of={ComponentStories.Default} />

---

### Properties

<Controls of={componentStories.Default} />

### Base Properties

Supports [Base properties](/BaseProperties)

### Styling Properties

#### styles

Customizes the root element of the component.

**Sub-elements:**
- `ElementName` - Description of what this element represents

#### [additionalStyles] (if applicable)

Customizes the [specific part] of the component.

**Sub-elements:**
- `SubElementName` - Description of what this sub-element represents

### Style Properties

These properties allow direct style application without using the `styles` prop: `width`, `height`.

### Modifiers

The `mods` property accepts the following modifiers you can override:

| Modifier | Type | Description |
|----------|------|-------------|
| modifierName | `boolean` | Description of what this modifier does |

## Variants

### Types

- `primary` - Description of primary type
- `secondary` - Description of secondary type

### Themes

- `default` - Standard appearance
- `danger` - Used for destructive actions

### Sizes

- `small` - Compact size for dense interfaces
- `medium` - Default size
- `large` - Emphasized size for important actions

## Examples

### Basic Usage

```jsx
<ComponentName arg="something" />
```

### [Additional Examples as needed]

## Accessibility

### Keyboard Navigation

- `Tab` - Moves focus to the component
- `Space/Enter` - Activates the component
- [Additional keyboard shortcuts]

### Screen Reader Support

- Component announces as "[role]" to screen readers
- State changes are announced (e.g., "pressed", "expanded")
- [Additional screen reader considerations]

### ARIA Properties

- `aria-label` - Provides accessible label when no visible label exists
- [Additional ARIA properties]

## Best Practices

1. **Do**: Best practice example
   ```jsx
   <ComponentName label="Clear Label">Content</ComponentName>
   ```

2. **Don't**: Anti-pattern example
   ```jsx
   <ComponentName>Unclear usage</ComponentName>
   ```

3. **Accessibility**: Always provide meaningful labels
4. **Performance**: Consider performance implications for specific use cases

## Integration with Forms

[For input components only]
This component supports all [Field properties](/field-properties.md) when used within a Form.

## Suggested Improvements

- Improvement 1: Description of potential enhancement
- Improvement 2: Description of potential enhancement
- Improvement 3: Description of potential enhancement

## Related Components

- [RelatedComponent1](/components/RelatedComponent1) - When to use instead
- [RelatedComponent2](/components/RelatedComponent2) - Complementary component
```

## Specific Guidelines

### 1. Component Description

- Start with a clear, concise description of what the component is
- Follow with scenarios where the component should be used
- Avoid technical implementation details in the introduction

### 2. Properties Documentation

#### Base Properties
- If the component uses `filterBaseProps`, don't list base properties individually
- Instead, include the link: `Supports [Base properties](/base-properties.md)`
- Exception: Always document the `qa` property if it has special behavior

#### Styling Properties
- Document each `styles` or `*Styles` property separately
- For each styling property, list all available tasty sub-elements with descriptions. Count only those sub-elements that are mentioned in tasty styles in the root element inside component and can be overrided by passing an object with a specific key (sub-element name) to `styles` property
- Format: `ElementName` - Description of what this element represents

#### Style Properties
- List all properties that can be used for direct styling (e.g., `width`, `height`, `padding`)
- These are properties that map to `tasty` styles without using the `styles` prop
- Use `src/tasty/styles/list.ts` file to understand how it works.

#### React Aria Properties
- Document all React Aria properties with clear descriptions
- It's acceptable to rewrite React Aria descriptions for clarity
- Focus on practical usage rather than technical implementation

### 3. Examples

- Provide practical, real-world examples written in `jsx` code
- Avoid styling examples unless it demonstrates essential capabilities
- Each example should have a clear purpose and title
- Do not use Storybook's Canvas and Story components for interactive examples
- Each story should describe a usage case
- The more sophisticated component, the more stories we need to cover all cases

### 4. Modifiers

- Document all available modifiers that can be passed via the `mods` property
- Explain how each modifier affects the component's appearance or behavior
- Include any modifier combinations that have special behavior

### 5. Accessibility Section

- Include keyboard navigation patterns
- Document screen reader behavior
- List relevant ARIA properties and their usage
- Provide guidance on ensuring accessible implementations

### 6. Form Integration

For input components (TextInput, Select, DatePicker, etc.):
- Don't duplicate field property documentation
- Include: "This component supports all [Field properties](/field-properties.md) when used within a Form."

### 7. File Naming and Location

- Documentation files use `.docs.mdx` extension
- Place in the same directory as the component
- Naming convention: `ComponentName.tsx` → `ComponentName.docs.mdx`

## Review Checklist

Before submitting component documentation, ensure:

- [ ] Follows the prescribed structure
- [ ] Includes practical examples with Storybook Stories
- [ ] Documents all styling properties and sub-elements
- [ ] Lists all modifiers with descriptions
- [ ] Includes accessibility information
- [ ] Contains best practices section
- [ ] Has "Suggested Improvements" section
- [ ] Uses correct file naming and location
- [ ] All links use provided placeholder format
- [ ] Style properties are documented separately from styling properties
- [ ] Form integration mentioned for input components
- [ ] Base properties linked, not listed (except `qa`)
- [ ] Tabler (`@tabler/icons-react`) or UI Kit icons are used in examples
