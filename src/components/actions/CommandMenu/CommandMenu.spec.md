# CommandMenu Component Specification

## Overview

The CommandMenu component is a searchable menu interface that combines the functionality of Menu and ListBox components. It provides a command-line-like experience for users to quickly find and execute actions through a searchable interface.

## Component Features

### Core Functionality
- **Search-first interface**: Always includes a search input at the top for filtering options
- **Flexible usage**: Can be used standalone or within a popover/modal
- **Multiple trigger methods**: Can be opened via MenuTrigger or programmatically like a Dialog
- **Virtual focus**: Uses virtual focus for keyboard navigation while keeping search input focused
- **Header/Footer support**: Configurable header and footer sections
- **Accessibility**: Full keyboard navigation and screen reader support
- **Loading states**: Built-in loading indicator and state management
- **Force mount items**: Always render certain items regardless of search filter
- **Enhanced search**: Keywords-based matching and custom value support

### Key Behaviors
- When CommandMenu gains focus, the search input is automatically focused
- Arrow keys navigate through filtered options while search input retains focus
- Enter key selects the currently highlighted option
- Escape key clears search or closes the palette
- Supports both single and multiple selection modes
- Real-time filtering as user types

- **Loading state**: Shows loading indicator while async operations are in progress
- **Force mount**: Certain items always visible regardless of search filter
- **Keywords matching**: Items can be found by additional keywords beyond display text

## Required Files

### Core Component Files
1. **CommandMenu.tsx** - Main component implementation
2. **styled.tsx** - Styled components using tasty
3. **index.ts** - Export barrel (includes CommandMenu.Trigger alias)

### Documentation & Testing
4. **CommandMenu.docs.mdx** - Component documentation
5. **CommandMenu.stories.tsx** - Storybook stories
6. **CommandMenu.test.tsx** - Unit tests (10-15 comprehensive tests)

### Integration Files
7. **Update src/components/actions/index.ts** - Export new components
8. **Update src/index.ts** - Export new components

## Implementation Approach

The CommandMenu will **reuse the existing Menu component** and add search functionality on top. This approach ensures we inherit all Menu features (sections, descriptions, tooltips, hotkeys) while adding search-specific capabilities. The implementation will follow the React Aria command palette example pattern, wrapping Menu with search input and filtering logic.

### Key Technical Insights

1. **Reuse Menu component**: CommandMenu will wrap the existing Menu component to inherit all features (sections, descriptions, tooltips, hotkeys)
2. **Filter-based search**: Use React Stately's `filter` prop (like ListBox) to implement search functionality
3. **Virtual focus pattern**: Follow ListBox's search pattern - search input stays focused while arrow keys navigate menu items
4. **Reuse existing patterns**: Use `useDialogContainer(CommandMenu)` for programmatic usage - no need for a separate hook

## Implementation Plan

### Phase 1: Core Component Structure (CommandMenu.tsx)
1. **Setup component interface**
   - Extend Menu props with search-specific additions
   - Add `searchPlaceholder`, `emptyLabel`, `filter` props
   - Add `searchInputStyles` for search input styling
   - Add advanced features: `isLoading`, `shouldFilter`
   - Support enhanced item structure with `keywords`, `value`, `forceMount`
   - Reuse all existing Menu props (header, footer, itemStyles, etc.)

2. **Implement search wrapper around Menu**
   - Create search input similar to ListBox's searchable mode
   - Implement filtering logic using React Stately's filter capability
   - Add keywords-based search matching for enhanced findability
   - Support force mount items that always appear regardless of filter
   - Handle manual filtering mode (`shouldFilter={false}`)
   - Pass filtered collection to Menu component
   - Handle search state management

3. **Setup keyboard navigation**
   - Follow ListBox pattern for virtual focus
   - Keep search input focused while navigating options
   - Handle Enter/Space for selection, Escape for clearing/closing

   - Use `shouldUseVirtualFocus` for proper accessibility

4. **Render structure**
   - Header section (optional, from Menu)
   - Search input (always present)
   - Loading indicator (when `isLoading={true}`)
   - Menu component with filtered items
   - Footer section (optional, from Menu)
   - Empty state when no results

### Phase 2: MenuTrigger Integration and Alias
1. **Create CommandMenu.Trigger alias**
   - Export MenuTrigger as CommandMenu.Trigger in index.ts
   - Ensure CommandMenu works seamlessly with MenuTrigger
   - Test compatibility with existing MenuTrigger features

2. **Update documentation**
   - Show usage with MenuTrigger
   - Demonstrate the alias usage pattern
   - Provide examples of both approaches

### Phase 3: Styling (styled.tsx)
1. **Create styled components using tasty**
   - CommandMenuWrapper: Main container
   - SearchSection: Search input area
   - LoadingSection: Loading indicator area
   - ContentSection: Options list area
   - HeaderSection: Optional header
   - FooterSection: Optional footer
   - EmptyState: No results message

2. **Implement responsive design**
   - Mobile-friendly layout
   - Proper spacing and typography
   - Theme integration

### Phase 4: Documentation (CommandMenu.docs.mdx)
1. **Follow documentation guidelines**
   - Component overview and when to use
   - Complete props documentation
   - Accessibility section with keyboard shortcuts
   - Best practices and examples
   - Integration patterns

2. **Include comprehensive examples**
   - Basic usage
   - With header/footer
   - Programmatic usage with `useDialogContainer(CommandMenu)`
   - With MenuTrigger (using CommandMenu.Trigger alias)
   - Custom filtering and keywords
   - Multiple selection
   - Loading states
   - Force mount items

### Phase 5: Stories (CommandMenu.stories.tsx)
1. **Create comprehensive stories**
   - Default usage
   - With header and footer
   - Programmatic usage with `useDialogContainer(CommandMenu)`
   - With MenuTrigger (CommandMenu.Trigger)
   - Custom filtering and keywords
   - Loading states
   - Empty states
   - Force mount items
   - Complex example with multiple sections

2. **Add play functions**
   - Auto-open for trigger-based stories
   - Demonstrate keyboard navigation
   - Show filtering behavior

### Phase 6: Testing (CommandMenu.test.tsx)
1. **Functional tests (10-15 tests)**
   - Basic rendering and props
   - Search functionality and filtering
   - Keywords-based search matching
   - Keyboard navigation (arrow keys, enter, escape)
   - Selection handling (single/multiple)
   - Header/footer rendering
   - Empty state display
   - Loading state display
   - Force mount items behavior
   - Accessibility attributes
   - Focus management
   - MenuTrigger integration
   - Programmatic usage with `useDialogContainer`
   - Custom filtering (`shouldFilter={false}`)
   - Disabled states
   - Event handlers

2. **Accessibility tests**
   - ARIA attributes
   - Keyboard navigation
   - Screen reader compatibility
   - Focus management

## Technical Specifications

### Props Interface
```typescript
interface CommandMenuProps<T> extends CubeMenuProps<T> {
  // Search-specific props
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filter?: (textValue: string, inputValue: string) => boolean;
  emptyLabel?: ReactNode;
  searchInputStyles?: Styles;
  
  // Advanced search features
  isLoading?: boolean;
  shouldFilter?: boolean;
  
  // Inherited from Menu: all Menu props are supported
  // - header, footer (content props)
  // - styles, itemStyles, sectionStyles, sectionHeadingStyles (styling)
  // - selectionIcon, shouldFocusWrap, autoFocus (behavior)
  // - onAction, onSelectionChange (handlers)
  // - All React Aria menu props (isDisabled, disabledKeys, etc.)
}

interface CommandMenuItem {
  // Standard item props
  id: string;
  textValue: string;
  
  // Enhanced search features
  keywords?: string[];
  value?: string;
  forceMount?: boolean;
  
  // Standard Menu item props
  // ... (all existing Menu item props)
}
```

### React Aria Hooks Usage
- **Reused from Menu**: `useTreeState`, `useMenu` (via Menu component)
- **Search-specific**: `useFilter` - For search filtering functionality
- **Navigation**: `useKeyboard` - For search input keyboard navigation
- **Trigger-based**: `useMenuTrigger`, `useMenuTriggerState` (via MenuTrigger)
- **Positioning**: `useOverlayPosition` (via MenuTrigger/Dialog)

### Accessibility Requirements
- Full keyboard navigation support
- Screen reader announcements for state changes
- Proper ARIA labeling and relationships
- Focus management with virtual focus
- Support for aria-activedescendant
- Proper role assignments

### Performance Considerations
- Efficient filtering with debouncing if needed
- Virtual scrolling for large datasets (future enhancement)
- Memoization of filtered results
- Optimized re-renders

## Integration Points

### With Menu Component
- **Direct reuse**: CommandMenu wraps Menu component completely
- **Inherit all features**: Sections, descriptions, tooltips, hotkeys, selection icons
- **Consistent API**: All Menu props work the same way
- **Styling compatibility**: All Menu styling props are supported

### With ListBox Component
- **Search pattern**: Reuse ListBox's search input implementation and styling
- **Filtering logic**: Share the same collection filtering approach
- **Virtual focus**: Use the same keyboard navigation pattern

### With Modal System
- **MenuTrigger integration**: Works seamlessly with existing MenuTrigger
- **Dialog integration**: Compatible with useDialogContainer pattern
- **Focus management**: Leverages existing overlay focus management

## Success Criteria

1. **Functionality**: All core features work as specified
2. **Accessibility**: Meets WCAG 2.1 AA standards
3. **Performance**: Smooth interaction with large datasets
4. **Documentation**: Complete and clear documentation
5. **Testing**: All tests pass with good coverage
6. **Integration**: Works seamlessly with existing components
7. **Consistency**: Follows established patterns and conventions

## Future Enhancements

1. **Virtual scrolling** for large datasets
2. **Nested command groups** with hierarchical navigation
3. **Recent commands** history
4. **useCommandState hook** for accessing internal state
5. **Custom renderers** for complex command items
6. **Async loading** with search suggestions
7. **Command categories** with visual grouping
8. **Fuzzy search** improvements