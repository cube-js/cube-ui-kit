# Form System

The rules for building form-attachable input components live in [`docs/rules/input-components.md`](../../../docs/rules/input-components.md) — hook order, the two `useFieldProps` modes, id/label wiring, `wrapWithField`, validation props and the shared validation helpers.

Read it before touching anything in this folder or in `src/components/fields/`.

The current Form engine is the **legacy backend** of the Form modernization plan. Its behaviour is frozen by the characterization suite in [`Form/legacy-contract/`](Form/legacy-contract/README.md): every `it()` there is labelled `[frozen]`, `[bug-eligible]`, `[undefined]` or `[design-input]`, and the README's contract table says what each label allows. Do not change a `[frozen]` behaviour, and do not fix a `[bug-eligible]` one without a compatibility review. `pnpm diagnostics:form` reports (but does not yet enforce) the React Hooks / Compiler findings for this folder against a committed baseline.
