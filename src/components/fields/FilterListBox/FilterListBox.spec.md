# FilterListBox Component Specification

## Overview

The `FilterListBox` component is a searchable list selection component that combines a search input with a ListBox. It provides real-time filtering capabilities, custom value support, and full accessibility features. Built on top of the base ListBox component with React Aria patterns.

## Architecture

### Component Hierarchy

```
FilterListBox (forwardRef)
├── FilterListBoxWrapperElement (tasty styled container)
│   ├── StyledHeaderWithoutBorder (optional header)
│   ├── SearchWrapperElement (search input container)
│   │   ├── SearchInputElement (input field)
│   │   └── div[data-element="Prefix"] (search/loading icon)
│   └── ListBox (internal list component)
│       ├── Option components (filtered items)
│       └── ListBoxSection components (filtered sections)
```

### Core Dependencies

- **Base ListBox**: Extends `CubeListBoxProps` and uses internal `ListBox` component
- **React Aria**: `useFilter`, `useKeyboard` for search and navigation
- **React Stately**: `Item`, `Section` for collection management
- **Form Integration**: Custom form hooks (`useFieldProps`, `useFormProps`)
- **Styling**: Tasty design system with styled components

## Key Features

### 1. Real-time Search & Filtering
- **Search Input**: Integrated search field at the top of the component
- **Filter Function**: Configurable text filtering with default `contains` behavior
- **Multi-type Filtering**: Supports filtering of both items and sections
- **Empty State**: Customizable "no results" message when filters yield no matches

### 2. Custom Value Support
- **allowsCustomValue**: Enables users to enter values not present in the original options
- **Dynamic Options**: Custom values are added to the collection and persist in selection
- **Custom Value Management**: Tracks custom keys separately from original options
- **Selection Priority**: Selected custom values appear at the top of the list

### 3. Advanced Keyboard Navigation
- **Arrow Navigation**: Up/Down arrows navigate through filtered results
- **Home/End/PageUp/PageDown**: Jump to first/last visible items
- **Enter/Space**: Select focused item
- **Escape Handling**: Clear search or trigger parent close behavior

### 4. Focus Management
- **Virtual Focus**: Uses `shouldUseVirtualFocus={true}` to keep DOM focus in search input
- **Focus Preservation**: Maintains keyboard navigation through filtered items
- **Auto-focus Management**: Automatically focuses first available item when collection changes

### 5. Form Integration
- **Value Mapping**: Supports both single and multiple selection modes
- **Validation State**: Inherits validation from form system
- **Custom Value Integration**: Seamlessly integrates custom values with form state

## Component Props Interface

### Core Search Props
```typescript
interface SearchProps {
  searchPlaceholder?: string;     // Search input placeholder
  autoFocus?: boolean;           // Auto-focus search input
  filter?: FilterFn;             // Custom filter function
  emptyLabel?: ReactNode;        // Custom "no results" message
  searchInputStyles?: Styles;    // Search input styling
  searchInputRef?: RefObject<HTMLInputElement>;
}
```

### Custom Value Props
```typescript
interface CustomValueProps {
  allowsCustomValue?: boolean;   // Enable custom value entry
  onEscape?: () => void;         // Escape key handler for parent components
}
```

### Enhanced Selection Props
```typescript
interface EnhancedSelectionProps extends CubeListBoxProps {
  isCheckable?: boolean;         // Show checkboxes in multiple mode
  onOptionClick?: (key: Key) => void; // Click handler for content area
}
```

## Implementation Details

### Filtering Logic
The component implements a multi-stage filtering system:

```typescript
// 1. Base filtering with user-provided or default filter function
const textFilterFn = filter || contains;

// 2. Recursive filtering supporting sections
const filterChildren = (childNodes: ReactNode): ReactNode => {
  // Filters items and sections recursively
  // Preserves section structure when items match
};

// 3. Custom value enhancement
if (allowsCustomValue && searchTerm && !termExists) {
  // Adds custom value option at the end
}
```

### Custom Value Management
```typescript
// State management for custom values
const [customKeys, setCustomKeys] = useState<Set<string>>(new Set());

// Integration with selection
const mergedChildren = useMemo(() => {
  // Combines original children with custom value items
  // Promotes selected custom values to the top
}, [children, customKeys, selectedKeys]);
```

### Virtual Focus System
- **Search Input Focus**: DOM focus remains in the search input
- **Visual Focus**: ListBox manages visual focus indication
- **Keyboard Navigation**: Custom keyboard handlers bridge input and list navigation
- **ARIA Integration**: Proper aria-activedescendant management

### Loading States
- **Global Loading**: `isLoading` prop shows loading spinner in search input
- **Search Icon**: Alternates between search icon and loading spinner

## Styling System

### Container Structure
- **FilterListBoxWrapperElement**: Main container with grid layout
- **SearchWrapperElement**: Search input container with input wrapper styles
- **SearchInputElement**: Styled input field with clear background

### Grid Layout
```css
gridRows: 'max-content max-content 1sf'
/* Header (optional) | Search Input | ListBox (flexible) */
```

### Modifier States
- **focused**: Search input has focus
- **invalid/valid**: Validation state styling
- **loading**: Loading state indication
- **searchable**: Always true for this component

## Performance Considerations

### Filtering Performance
- **Memoized Filtering**: Filter results are memoized based on search value and children
- **Recursive Processing**: Efficient recursive filtering for sectioned content
- **Key Normalization**: Optimized string operations for key comparison

### Virtual Scrolling
- **Inherited Virtualization**: Benefits from ListBox virtualization for large filtered results
- **Dynamic Height**: Proper height estimation for filtered content

### Memory Management
- **Custom Key Cleanup**: Tracks and cleans up unused custom values
- **Effect Dependencies**: Carefully managed effect dependencies to prevent unnecessary re-renders

## Integration Patterns

### With FilterPicker
```typescript
// FilterPicker uses FilterListBox as its internal component
<FilterListBox
  shouldUseVirtualFocus={true}
  isCheckable={isCheckable}
  onEscape={close}
  onOptionClick={handleOptionClick}
/>
```

### Form Integration
```typescript
// Value mapping for form compatibility
valuePropsMapper: ({ value, onChange }) => ({
  selectedKey: selectionMode === 'single' ? value : undefined,
  selectedKeys: selectionMode === 'multiple' ? value : undefined,
  onSelectionChange: (selection) => onChange(selection)
})
```

## Accessibility Features

### Search Input Accessibility
- **Role**: `combobox` with proper ARIA attributes
- **ARIA Expanded**: Always `true` to indicate expanded listbox
- **ARIA Controls**: Links to the internal listbox
- **Active Descendant**: Points to currently focused list item

### Keyboard Interaction
- **Standard Input**: Text entry, selection, clipboard operations
- **List Navigation**: Arrow keys, Home/End, Page Up/Down
- **Selection**: Enter/Space to select items
- **Escape**: Progressive escape (clear search → close component)

### Screen Reader Support
- **Proper Labeling**: Inherits aria-label from parent or label prop
- **Live Regions**: Filter results are announced
- **Focus Management**: Clear focus flow between input and list

## Common Use Cases

1. **Searchable Dropdowns**: Large option lists with search capability
2. **Tag Input Systems**: Multi-select with custom value entry
3. **Filter Interfaces**: Data filtering with real-time preview
4. **Autocomplete Components**: Search with suggested and custom options
5. **Category Pickers**: Searchable grouped content selection

## Testing Considerations

### Search Functionality
- Search input value changes
- Filter result accuracy
- Empty state handling
- Custom value creation

### Keyboard Navigation
- Arrow key navigation through filtered results
- Enter/Space selection behavior
- Escape key handling (clear search vs close)
- Home/End/Page navigation

### Custom Values
- Custom value creation and persistence
- Selection state with custom values
- Form integration with custom values

## Browser Compatibility

- **Input Events**: Modern input event handling
- **CSS Grid**: Grid layout for component structure
- **ARIA Support**: Full ARIA combobox pattern support
- **Focus Management**: Advanced focus coordination

## Migration Notes

When upgrading or modifying:
- Custom filter functions may need adjustment for new filtering logic
- Virtual focus behavior changes require testing with parent components
- Custom value handling affects selection state management
- Search input styling may inherit from base input components 