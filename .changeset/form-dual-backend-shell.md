---
'@cube-dev/ui-kit': minor
---

Form: input components keep working when their binding changes after mount — gaining or losing `name`, or receiving a different `form`, rebinds the field (new id, default value as the baseline, the previous form released) instead of throwing a hook-order error; `FormScopeMask` is exported for wrappers that need to scope nested inputs the way `RadioGroup`/`CheckboxGroup` do; `<Form>` is now a facade over the legacy root and instances carry a backend brand, with no behaviour change for existing forms.
