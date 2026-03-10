# Field Properties

All input components in UI Kit (`TextInput`, `Select`, `ComboBox`, `Checkbox`, `RadioGroup`, `NumberInput`, `Switch`, `DatePicker`, `Slider`, `FileInput`, etc.) share a common set of field properties. These properties are provided by the `FieldBaseProps` interface and enable form integration, validation, labeling, and state management.

When used inside a [Form](./components/form/Form.md), these properties are automatically inherited from the form context and can be overridden at the field level.

## Identity & Form Integration

- **`name`** `string` — Field name for form data binding. Required when used within a Form.
- **`form`** `CubeFormInstance` — Form instance. Automatically provided when inside a Form context.
- **`defaultValue`** `any` — Default value for the field in uncontrolled mode.
- **`id`** `string` — Unique ID for the field element.
- **`idPrefix`** `string` — ID prefix to avoid collisions between multiple forms.

## Labels & Description

- **`label`** `ReactNode` — Label text displayed above or beside the input.
- **`labelPosition`** `'top' | 'side' | 'split'` (default: `top`) — Position of the label relative to the input.
- **`description`** `ReactNode` — Description text placed below the label.
- **`extra`** `ReactNode` — Additional content displayed next to the label.
- **`tooltip`** `ReactNode` — Tooltip shown inside the label.
- **`labelSuffix`** `ReactNode` — Content displayed after the label text.
- **`labelProps`** `object` — Additional HTML props passed to the label element.
- **`labelStyles`** `Styles` — Tasty styles for the label element.

## Necessity Indicators

- **`isRequired`** `boolean` (default: `false`) — Whether user input is required before form submission.
- **`necessityIndicator`** `'icon' | 'label'` — Type of necessity indicator shown next to the label.
- **`necessityLabel`** `ReactNode` — Custom text for the necessity indicator (e.g., "Required" or "Optional").

## State

- **`isDisabled`** `boolean` (default: `false`) — Whether the field is disabled and non-interactive.
- **`isReadOnly`** `boolean` (default: `false`) — Whether the field can be focused but not changed.
- **`isLoading`** `boolean` (default: `false`) — Whether to show a loading spinner and disable interactions.
- **`isHidden`** `boolean` (default: `false`) — Whether the field is hidden.
- **`validationState`** `'valid' | 'invalid'` — Visual validation state of the field.
- **`autoFocus`** `boolean` (default: `false`) — Whether the field should receive focus on render.

## Validation

- **`rules`** `ValidationRule[]` — Array of validation rules for the field.
- **`validateTrigger`** `'onBlur' | 'onChange' | 'onSubmit'` — When to trigger validation.
- **`validationDelay`** `number` — Debounce delay in milliseconds before running validation.
- **`showValid`** `boolean` — Whether to show the valid state icon after successful validation.
- **`errorMessage`** `ReactNode` — Error message always displayed in danger state, regardless of validation state.
- **`message`** `ReactNode` — _(deprecated)_ Use `errorMessage` for errors and `description` for help text.

## Styling

- **`fieldStyles`** `Styles` — Tasty styles for the field wrapper.
- **`messageStyles`** `Styles` — Tasty styles for the message/error text.

## Validation Rules

The `rules` prop accepts an array of rule objects. Built-in validators include:

- **`required`** `boolean` — Field must have a value.
- **`type`** `string` — Validates data type (`email`, `url`, `number`, etc.).
- **`pattern`** `RegExp` — Value must match the regular expression.
- **`min`** / **`max`** `number` — Minimum/maximum length or value constraints.
- **`enum`** `any[]` — Value must be one of the allowed values.
- **`whitespace`** `boolean` — Value must contain non-whitespace characters.
- **`message`** `string` — Custom error message for the rule.
- **`validator`** `(rule, value) => Promise<string | void>` — Custom async validation function.

```jsx
<TextInput
  name="email"
  label="Email Address"
  isRequired
  rules={[
    { required: true, message: 'Email is required' },
    { type: 'email', message: 'Enter a valid email' },
  ]}
/>
```

## Usage Example

```jsx
import { Form, TextInput, Select } from '@cube-dev/ui-kit';

function ExampleForm() {
  return (
    <Form defaultValues={{ name: '', role: undefined }}>
      <TextInput
        name="name"
        label="Full Name"
        description="As it appears on your ID"
        isRequired
        rules={[{ required: true, min: 2 }]}
      />

      <Select
        name="role"
        label="Role"
        tooltip="Your primary role in the organization"
        necessityIndicator="label"
        isRequired
      >
        <Select.Item key="admin">Admin</Select.Item>
        <Select.Item key="member">Member</Select.Item>
      </Select>

      <Form.Submit>Save</Form.Submit>
    </Form>
  );
}
```

## Related

- [Base Properties](./BaseProperties.md) — Common styling and layout properties
- [Form](./components/form/Form.md) — Form container with validation and state management
- [Field](./components/form/Field.md) — Legacy field wrapper (for custom components only)
