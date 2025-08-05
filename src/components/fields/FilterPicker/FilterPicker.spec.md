# FilterPicker Component Specification

## Overview

The `FilterPicker` component is a button-triggered popover that contains a FilterListBox for searchable selection. It combines the convenience of a dropdown trigger with the power of a searchable list, supporting both single and multiple selection with intelligent option sorting and custom summary rendering.

## Architecture

### Component Hierarchy

```
FilterPicker (forwardRef)
└── DialogTrigger (popover container)
    ├── Button (trigger element)
    │   ├── Icon (optional)
    │   ├── Text content (summary/placeholder)
    │   └── DirectionIcon (caret indicator)
    └── Dialog (popover content)
        └── FilterListBox (internal search and selection)
            ├── SearchInput
            └── ListBox (with sorted options)
```

### Core Dependencies

- **FilterListBox**: Uses FilterListBox as internal selection component
- **Dialog System**: `DialogTrigger`, `Dialog` for popover behavior
- **Button Component**: Styled trigger button with states
- **Form Integration**: Custom form hooks (`useFieldProps`, `useFormProps`)
- **React Stately**: `Item`, `Section` for collection management

## Key Features

### 1. Smart Option Sorting
- **Selection-Based Sorting**: Selected items automatically move to the top
- **Session-Based Persistence**: Maintains sorted order during popover session
- **Section-Aware**: Sorts items within sections while preserving section structure
- **Performance Optimized**: Uses memoization and caching to prevent layout thrashing

### 2. Custom Summary Rendering
- **Flexible Display**: Custom `renderSummary` function for trigger content
- **Mode-Aware**: Different parameters for single vs multiple selection
- **Selection Context**: Provides both keys and labels to render function
- **Fallback Behavior**: Automatic comma-separated list when no custom renderer

### 3. Popover Management
- **Auto-Close Behavior**: Closes on selection (single mode) or content click (multiple mode)
- **Escape Integration**: Connects FilterListBox escape behavior to popover close
- **Focus Management**: Auto-focus search input when opened
- **Position Management**: Uses Dialog system for smart positioning

### 4. Selection State Management
- **Controlled/Uncontrolled**: Supports both controlled and uncontrolled state
- **Key Normalization**: Handles React key formatting and deduplication
- **Custom Value Integration**: Seamlessly works with FilterListBox custom values
- **Form Compatibility**: Full integration with form system value mapping

### 5. Advanced Interaction Patterns
- **Checkbox Mode**: Optional checkboxes for clear multiple selection UX
- **Click Behavior**: Differentiated click handling for checkbox vs content areas
- **Loading States**: Button loading state integration
- **Validation States**: Visual validation state feedback on trigger

## Component Props Interface

### Core Selection Props
```typescript
interface SelectionProps {
  selectionMode?: 'single' | 'multiple';
  selectedKey?: string | null;
  selectedKeys?: string[];
  defaultSelectedKey?: string | null;
  defaultSelectedKeys?: string[];
  onSelectionChange?: (selection: any) => void;
}
```

### Display Props
```typescript
interface DisplayProps {
  placeholder?: string;          // Text when no selection
  icon?: ReactElement;          // Leading icon in trigger
  type?: ButtonType;            // Button styling type
  theme?: 'default' | 'special'; // Button theme
  size?: 'small' | 'medium' | 'large';
}
```

### Advanced Props
```typescript
interface AdvancedProps {
  renderSummary?: (args: {
    selectedLabels: string[];
    selectedKeys: (string | number)[];
    selectedLabel?: string;
    selectedKey?: string | number | null;
    selectionMode: 'single' | 'multiple';
  }) => ReactNode | false;
  
  listStateRef?: MutableRefObject<any>;
  isCheckable?: boolean;
  allowsCustomValue?: boolean;
}
```

## Implementation Details

### Option Sorting Algorithm
```typescript
const getSortedChildren = useCallback(() => {
  // 1. Cache current order when popover is open to prevent re-flow
  if (!isPopoverOpen && cachedChildrenOrder.current) {
    return cachedChildrenOrder.current;
  }

  // 2. Only sort when there were selections in previous session
  if (!hadSelectionsWhenClosed) {
    return children;
  }

  // 3. Process items and sections separately
  const sortChildrenArray = (childrenArray) => {
    const selected = [];
    const unselected = [];
    
    // Handle sections: sort items within each section
    // Handle items: group by selection status
    
    return [...selected, ...unselected];
  };
}, [children, effectiveSelectedKeys, selectionMode, isPopoverOpen]);
```

### Key Normalization System
The component handles React's automatic key prefixing:

```typescript
const normalizeKeyValue = (key: any): string => {
  const str = String(key);
  return str.startsWith('.$') 
    ? str.slice(2)      // Remove ".$ prefix
    : str.startsWith('.') 
    ? str.slice(1)      // Remove ". prefix
    : str;
};

const processSelectionArray = (iterable: Iterable<any>): string[] => {
  const resultSet = new Set<string>();
  for (const key of iterable) {
    const nKey = normalizeKeyValue(key);
    // Toggle behavior for duplicate selections
    if (resultSet.has(nKey)) {
      resultSet.delete(nKey);
    } else {
      resultSet.add(nKey);
    }
  }
  return Array.from(resultSet);
};
```

### Summary Rendering Logic
```typescript
const renderTriggerContent = () => {
  // Custom renderer takes precedence
  if (hasSelection && typeof renderSummary === 'function') {
    return renderSummary({
      selectedLabels,
      selectedKeys: effectiveSelectedKeys,
      selectedLabel: selectionMode === 'single' ? selectedLabels[0] : undefined,
      selectedKey: selectionMode === 'single' ? effectiveSelectedKey : null,
      selectionMode
    });
  }

  // No custom renderer or renderSummary === false
  if (renderSummary === false) return null;

  // Default behavior: placeholder or joined labels
  return hasSelection 
    ? (selectionMode === 'single' 
       ? selectedLabels[0] 
       : selectedLabels.join(', '))
    : placeholder;
};
```

### State Synchronization
The component maintains several state references for optimal performance:

```typescript
// Current selection state (reactive)
const latestSelectionRef = useRef({ single: null, multiple: [] });

// Selection state when popover was last closed (for sorting)
const selectionsWhenClosed = useRef({ single: null, multiple: [] });

// Cached children order during open session (prevents re-flow)
const cachedChildrenOrder = useRef(null);
```

## Styling System

### Button Integration
- **Type Variants**: `outline`, `clear`, `primary`, `secondary`, `neutral`
- **Theme Support**: `default`, `special`, validation themes
- **State Modifiers**: `placeholder`, `selected`, `loading`, `disabled`
- **Size Variants**: `small`, `medium`, `large`

### Popover Styling
- **Dialog Container**: Uses Dialog component styling system
- **FilterListBox Integration**: Passes through style props to internal FilterListBox
- **Position Awareness**: Adapts styling based on popover placement

### Trigger States
```typescript
mods={{
  placeholder: !hasSelection,    // When no selection made
  selected: hasSelection,        // When items are selected
  ...externalMods               // Additional custom modifiers
}}
```

## Interaction Patterns

### Single Selection Mode
1. **Click Trigger**: Opens popover with auto-focused search
2. **Select Item**: Closes popover immediately, updates selection
3. **Escape**: Closes popover (via FilterListBox escape handling)

### Multiple Selection Mode
1. **Click Trigger**: Opens popover with current selection sorted to top
2. **Checkbox Interaction**: Toggles selection, keeps popover open
3. **Content Click**: (Optional) Closes popover if `onOptionClick` configured
4. **Escape**: Closes popover

### Keyboard Interaction
- **Trigger Focus**: Standard button keyboard behavior
- **Popover Navigation**: Full FilterListBox keyboard support
- **Escape Chains**: FilterListBox escape → popover close

## Performance Considerations

### Sorting Optimization
- **Memoization**: Sorting is memoized based on selection state and popover state
- **Layout Stability**: Cached order prevents re-flow during fade-out animations
- **Conditional Sorting**: Only sorts when there were previous selections

### Selection Processing
- **Key Normalization**: Efficient string operations for React key handling
- **Set-Based Operations**: Uses Set for O(1) duplicate detection and toggle operations
- **Ref-Based State**: Synchronous state access via refs for event handlers

### Rendering Optimization
- **Child Processing**: Memoized children processing for large lists
- **Label Extraction**: Efficient label extraction with tracking
- **Custom Value Integration**: Seamless integration without re-processing

## Integration Patterns

### Form Integration
```typescript
// Standard form field integration
valuePropsMapper: ({ value, onChange }) => ({
  selectedKey: selectionMode === 'single' ? value : undefined,
  selectedKeys: selectionMode === 'multiple' ? value : undefined,
  onSelectionChange: onChange
})
```

### Dialog System Integration
```typescript
<DialogTrigger type="popover" placement="bottom start">
  {renderTrigger}
  {(close) => (
    <Dialog>
      <FilterListBox onEscape={close} onOptionClick={handleClick} />
    </Dialog>
  )}
</DialogTrigger>
```

### Custom Summary Examples
```typescript
// Simple count display
renderSummary={({ selectedLabels, selectionMode }) => 
  selectionMode === 'multiple' 
    ? `${selectedLabels.length} items selected`
    : selectedLabels[0]
}

// Custom component rendering
renderSummary={({ selectedLabels }) => 
  <Stack>
    {selectedLabels.map(label => <Tag key={label}>{label}</Tag>)}
  </Stack>
}
```

## Accessibility Features

### Button Accessibility
- **ARIA Label**: Inherits from `aria-label` or `label` prop
- **Button Role**: Standard button role with proper states
- **Keyboard Support**: Enter/Space to open popover

### Popover Accessibility
- **Focus Management**: Auto-focus to search input on open
- **Escape Handling**: Closes popover on escape
- **Outside Click**: Dismissible behavior

### Selection Accessibility
- **FilterListBox Integration**: Full FilterListBox accessibility features
- **State Announcements**: Selection changes announced via FilterListBox
- **Keyboard Navigation**: Complete keyboard access to all options

## Common Use Cases

1. **Multi-Select Filters**: Dashboard filters with searchable options
2. **Tag Selection**: Content tagging with custom value support
3. **Category Assignment**: Hierarchical category selection with sections
4. **User/Group Pickers**: Searchable user selection with custom display
5. **Status Selectors**: Status/priority selection with visual indicators

## Testing Considerations

### Trigger Behavior
- Button states and styling
- Popover open/close behavior
- Loading state display
- Validation state indication

### Selection Logic
- Single vs multiple selection modes
- Key normalization and deduplication
- Custom value integration
- Form integration

### Sorting Behavior
- Selected items appear at top
- Section structure preservation
- Performance with large lists
- Layout stability during animations

### Custom Rendering
- Summary function integration
- Error handling for render functions
- Fallback behavior when renderSummary returns invalid content

## Browser Compatibility

- **Dialog Support**: Modern browser popover/dialog features
- **Focus Management**: Advanced focus coordination
- **CSS Animations**: Smooth popover transitions
- **Event Handling**: Complex event delegation patterns

## Migration Notes

When upgrading or modifying:
- Custom renderSummary functions may need parameter adjustments
- Sorting behavior changes could affect layout expectations
- Key normalization changes may impact selection state handling
- Dialog integration requires testing with various popover configurations 