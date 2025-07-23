# ListBox Component Specification

## Overview

The `ListBox` component is a fully-featured, accessible selection list component built on top of React Aria and React Stately. It provides a flexible interface for displaying collections of selectable items with support for single/multiple selection, keyboard navigation, virtualization, and form integration.

## Architecture

### Component Hierarchy

```
ListBox (forwardRef)
├── ListBoxWrapperElement (tasty styled container)
│   ├── StyledHeader (optional header)
│   ├── ListBoxScrollElement (scroll container)
│   │   └── ListElement (ul container)
│   │       ├── Option components (li items)
│   │       └── ListBoxSection components (grouped sections)
│   └── StyledFooter (optional footer)
```

### Core Dependencies

- **React Aria**: `useListBox`, `useOption`, `useListBoxSection`, `useKeyboard`
- **React Stately**: `useListState`, `Item`, `Section`
- **Virtualization**: `@tanstack/react-virtual` for performance with large datasets
- **Form Integration**: Custom form hooks (`useFieldProps`, `useFormProps`)
- **Styling**: Tasty design system with styled components

## Key Features

### 1. Selection Modes
- **Single Selection**: `selectionMode="single"` (default)
  - Uses `selectedKey` and `defaultSelectedKey` props
  - Returns single key in `onSelectionChange`
- **Multiple Selection**: `selectionMode="multiple"`
  - Uses `selectedKeys` and `defaultSelectedKeys` props
  - Returns array of keys in `onSelectionChange`
  - Optional checkbox indicators with `isCheckable` prop

### 2. Virtualization
- Automatic virtualization for large lists without sections
- Uses `@tanstack/react-virtual` for performance optimization
- Dynamic height estimation based on content (descriptions, size)
- Overscan of 10 items for smooth scrolling

### 3. Accessibility Features
- Full ARIA listbox pattern implementation
- Keyboard navigation (Arrow keys, Home, End, Page Up/Down)
- Screen reader support with proper announcements
- Focus management with `shouldUseVirtualFocus` option
- Optional visual focus vs DOM focus separation

### 4. Form Integration
- Seamless integration with form system via `useFieldProps`
- Validation state support (`valid`, `invalid`)
- Disabled state handling
- Field wrapping with labels, descriptions, and error messages

### 5. Content Organization
- **Sections**: Grouped content with headings and dividers
- **Headers/Footers**: Custom content areas above/below the list
- **Item Structure**: Label + optional description support

## Component Props Interface

### Core Selection Props
```typescript
interface SelectionProps {
  selectionMode?: 'single' | 'multiple';
  selectedKey?: Key | null;           // Single mode
  selectedKeys?: Key[];               // Multiple mode
  defaultSelectedKey?: Key | null;    // Single mode
  defaultSelectedKeys?: Key[];        // Multiple mode
  onSelectionChange?: (key: Key | null | Key[]) => void;
}
```

### Styling Props
```typescript
interface StylingProps {
  listStyles?: Styles;      // List container styles
  optionStyles?: Styles;    // Individual option styles
  sectionStyles?: Styles;   // Section wrapper styles
  headingStyles?: Styles;   // Section heading styles
  headerStyles?: Styles;    // Header area styles
  footerStyles?: Styles;    // Footer area styles
  size?: 'small' | 'medium';
}
```

### Behavior Props
```typescript
interface BehaviorProps {
  isDisabled?: boolean;
  focusOnHover?: boolean;           // DOM focus follows pointer (default: true)
  shouldUseVirtualFocus?: boolean;  // Keep DOM focus external (default: false)
  isCheckable?: boolean;            // Show checkboxes in multiple mode
  onEscape?: () => void;            // Custom escape key handling
  onOptionClick?: (key: Key) => void; // Click handler for option content
}
```

## Implementation Details

### State Management
- Uses `useListState` from React Stately for collection and selection state
- Converts between public API (scalar keys) and React Stately API (Set-based keys)
- Exposes internal state via optional `stateRef` for parent component access

### Virtualization Logic
```typescript
// Virtualization is enabled when:
const shouldVirtualize = !hasSections;

// Height estimation based on content:
estimateSize: (index) => {
  if (item.props?.description) return 49;  // With description
  return size === 'small' ? 33 : 41;       // Label only
}
```

### Focus Management
Two focus modes supported:
1. **Standard Focus**: DOM focus moves with selection (default)
2. **Virtual Focus**: DOM focus stays external, visual focus follows selection

### Event Handling
- **Keyboard**: Arrow navigation, selection, escape handling
- **Mouse/Touch**: Click selection with proper touch behavior
- **Custom Handlers**: Option-specific click handling for complex interactions

### Form Integration
The component integrates with the form system through value prop mapping:
```typescript
valuePropsMapper: ({ value, onChange }) => {
  if (selectionMode === 'multiple') {
    return { selectedKeys: value || [], onSelectionChange: onChange };
  } else {
    return { selectedKey: value ?? null, onSelectionChange: onChange };
  }
}
```

## Styling System

### Tasty Styles Structure
- **Base Container**: Border, focus outlines, validation states
- **Scroll Container**: Overflow handling, scrollbar styling
- **Options**: Hover, focus, selection, disabled states
- **Sections**: Grouping, dividers, headings
- **Checkboxes**: Visibility, colors, transitions

### Responsive Behavior
- Supports responsive style values through Tasty system
- Automatic size adjustments based on `size` prop
- Flexible layout with CSS Grid

## Performance Considerations

### Virtualization
- Automatically enabled for non-sectioned lists
- Reduces DOM nodes for large datasets
- Dynamic height measurement for variable content

### Memoization
- Selection change handlers are memoized
- Virtual items array is memoized based on collection changes
- Style calculations are optimized through Tasty caching

### Memory Management
- Proper cleanup of virtualization observers
- Ref cleanup and focus management
- Event handler cleanup on unmount

## Extension Points

### Custom Styling
- All major elements accept custom styles via props
- Modifier-based styling for different states
- CSS custom properties support for theming

### Custom Content
- Headers and footers for additional UI elements
- Rich content support in options (descriptions, icons)
- Section headings and organization

### Behavior Customization
- Custom escape key handling
- Focus behavior configuration
- Selection behavior overrides

## Common Use Cases

1. **Simple Selection Lists**: Basic item selection with labels
2. **Searchable Lists**: External input with virtual focus
3. **Multi-Select with Checkboxes**: Clear selection indicators
4. **Grouped Content**: Sections with headings and dividers
5. **Large Datasets**: Virtualized scrolling for performance
6. **Form Fields**: Integrated validation and error states

## Testing Considerations

- Uses `qa` prop for test selectors
- Proper ARIA attributes for accessibility testing
- Focus management testability
- Selection state verification
- Keyboard interaction testing

## Browser Compatibility

- Modern browsers with CSS Grid support
- React 18+ for concurrent features
- Proper fallbacks for older browsers through Tasty system

## Migration Notes

When upgrading or modifying:
- Selection API changes require careful prop mapping
- Virtualization changes may affect layout
- Form integration changes require testing with form providers
- Accessibility features should be regression tested 