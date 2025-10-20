# Form System Essential Knowledge

## ID Generation and Field Connection

### useFieldProps Behavior

`useFieldProps` handles ID generation and label-input connection automatically. It has **two distinct modes**:

#### 1. Form-Connected Fields (with `name` prop)
- Calls `useField` for full form integration
- Generates unique IDs using the `createId` mechanism based on field name
- Manages form state, validation, onChange/onBlur handlers
- Example: `<TextInput name="email" />` inside a `<Form>`

#### 2. Standalone Fields (no `name` prop)
- **Does NOT call `useField`** to avoid interference with controlled component behavior
- Uses React's `useId()` to generate IDs directly
- Preserves original props including `value` and `onChange` handlers
- Example: `<RadioGroup value={state} onChange={setState} />` without `name`

### Critical Rule: Don't Call useField for Standalone Fields

**Why**: Calling `useField` for standalone fields creates state management and side effects that interfere with controlled component behavior. This breaks components like RadioGroup in controlled mode.

### Label-Input Connection

`useFieldProps` automatically sets `labelProps.for` to match the field's ID when an ID exists. This ensures proper accessibility and label clicking behavior.

**Components should NOT manually set**:
- `labelProps.for` 
- Generate their own IDs using `useId()`

This is handled centrally by `useFieldProps`.

## Field Component Pattern

```tsx
function MyField(props) {
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, { defaultValidationTrigger: 'onBlur' });
  
  // Now props.id is set (if needed) and props.labelProps.for matches it
  // Just use props.id directly, don't generate your own
  
  return <input id={props.id} {...otherProps} />;
}
```

## ID Generation Examples

- Form field: `username` → `username`, `username_1`, `username_2` (incremental)
- Standalone: `undefined` → `react-aria-123` (React's useId format)
- Explicit ID: Always preserved as-is

