# Form System

The rules for building form-attachable input components live in [`docs/rules/input-components.md`](../../../docs/rules/input-components.md) — hook order, the `useFieldProps` modes, id/label wiring, `wrapWithField`, validation props and the shared validation helpers.

Read it before touching anything in this folder or in `src/components/fields/`.

The current Form engine is the **legacy backend** of the Form modernization plan. Its behaviour is frozen by the characterization suite in [`Form/legacy-contract/`](Form/legacy-contract/README.md): every `it()` there is labelled `[frozen]`, `[bug-eligible]`, `[undefined]` or `[design-input]`, and the README's contract table says what each label allows. Do not change a `[frozen]` behaviour, and do not fix a `[bug-eligible]` one without a compatibility review. `pnpm diagnostics:form` reports (but does not yet enforce) the React Hooks / Compiler findings for this folder against a committed baseline.

The dual-backend shell (plan Phase 3) is in place. File map: `Form/backend.ts` (the `FORM_BACKEND` brand and the modern-controller guard), `Form/Form.tsx` (the `<Form>` facade, `LegacyFormRoot`, the public `FormContext` plus the backend-neutral `FormPresentationContext`, the exported `FormScopeMask`), `Form/ModernFormRoot.tsx` (a boundary that throws until the modern backend lands), `Form/use-field/use-field.ts` (the legacy adapter, keyed on `(form, name)`, run `unbound` for standalone inputs). Behaviour rules live in `docs/rules/input-components.md`; the shell's own tests are `Form/dual-backend-shell.test.tsx`, and the public type contracts are `Form/form-types.test-d.tsx`, compiled by `pnpm test:types` (a CI step, not part of `pnpm test`).
