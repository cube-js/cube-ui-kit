---
'@cube-dev/ui-kit': minor
---

Form: input components keep working when their binding changes after mount — gaining or losing `name`, or receiving a `form` later, binds the field like a first mount (`defaultValue` as the baseline, an id that follows the field name) instead of throwing a hook-order error, and `NumberInput`/`Slider` keep their label pointing at the input when the id changes; `FormScopeMask` is exported for wrappers that scope nested inputs the way `RadioGroup`/`CheckboxGroup` do — a bare `FormContext.Provider` override no longer hides the surrounding form's presentation props (`labelPosition`, id prefix), render `FormScopeMask` instead.
