# Form Field Rules Documentation

## How Rules Work

### Rule Processing Flow

1. **Field receives `rules` prop** - Array of validation rules, e.g., `[{ required: true, type: 'email' }]`
2. **`useFieldProps`** (`use-field-props.tsx`) - Validates that `rules` requires a `name` prop (field must be form-connected)
3. **`useField`** (`use-field.ts`) - Processes rules:
   - Line 66-68: **MUTATES** rules array if `validationDelay` is set: `rules.unshift(delayValidationRule(validationDelay))`
   - Line 100-102: Assigns rules to field instance: `field.rules = rules`
   - Line 104: **Calculates `isRequired`** from rules: `rules && !!rules.find((rule) => rule.required)`
   - Line 196: Returns `isRequired` in the field return value (conditionally)

### Key Logic Points

```66:68:src/components/form/Form/use-field/use-field.ts
  if (rules && rules.length && validationDelay) {
    rules.unshift(delayValidationRule(validationDelay));
  }
```

```100:104:src/components/form/Form/use-field/use-field.ts
  if (field) {
    field.rules = rules;
  }

  let isRequired = rules && !!rules.find((rule) => rule.required);
```

## Potential Bugs

### Bug 1: Rules Array Mutation

**Issue**: Line 67 in `use-field.ts` mutates the `rules` array directly with `.unshift()`.

**Impact**:
- If users share the same rules array reference between fields, changes affect all fields
- When combined with `validationDelay`, the delay rule gets added multiple times
- This is a side effect that happens on every render when `validationDelay` changes

```typescript
// DANGEROUS: Shared reference
const sharedRules = [{ required: true }];

<TextInput name="field1" rules={sharedRules} validationDelay={500} />
<TextInput name="field2" rules={sharedRules} />
// field2 will get the delay rule too!
```

**Solution**: Clone the array before mutation:
```typescript
if (rules && rules.length && validationDelay) {
  rules = [delayValidationRule(validationDelay), ...rules];
}
```

### Bug 2: isRequired Propagation (Needs Investigation)

**User Report**: "When they make a single field required then all fields become required"

**Hypothesis**: The bug might be related to:
1. Shared rules array references (see Bug 1)
2. Field instance `field.rules` assignment creating shared references
3. Form re-render triggering all fields to recalculate with stale/shared state
4. `isRequired` from `useProviderProps` context overriding field-specific calculation

**Investigation needed**:
- Check if `field.rules` assignment at line 101 creates shared state
- Verify `isRequired` doesn't come from Provider context (Form has `isRequired` prop that passes to Provider)
- Check useMemo dependencies for `isRequired` (line 221) - could cause stale closures
- Test if `form.forceReRender()` at line 110 causes cross-field pollution

### Bug 3: Conditional `isRequired` Return

Line 196 uses conditional spread:
```typescript
...(isRequired && { isRequired }),
```

This means `isRequired` is only added to return value if truthy. If a field previously had `isRequired: true` and then it becomes `false`, the prop won't be removed - the component will keep the old value.

