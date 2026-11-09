import { ContextType, createContext, ReactNode, useContext } from 'react';

import { FormBaseProps } from '../../../shared/form';

import { ModernControllerContext } from './modern/context';

/**
 * Public legacy context. Its value is the full legacy scope (presentation
 * props, the instance, `submitError`, `idPrefix`) and is part of the exported
 * contract: wrappers outside the kit read it and Radio/Checkbox groups mask it.
 */
export const FormContext = createContext({});

/**
 * Presentation and configuration that any root — legacy or modern — hands to
 * the fields below it. Backend-neutral by construction: no instance in here.
 */
export interface FormPresentationContextValue {
  labelPosition?: FormBaseProps['labelPosition'];
  labelStyles?: FormBaseProps['labelStyles'];
  orientation?: 'vertical' | 'horizontal';
  necessityIndicator?: FormBaseProps['necessityIndicator'];
  validateTrigger?: FormBaseProps['validateTrigger'];
  requiredMark?: boolean;
  showValid?: boolean;
  idPrefix?: string;
}

const EMPTY_PRESENTATION: FormPresentationContextValue = {};

export const FormPresentationContext =
  createContext<FormPresentationContextValue>(EMPTY_PRESENTATION);

/**
 * Scope the inputs below to a new form context. Radio/Checkbox groups use it
 * for their options: they see the group's validation state, but neither the
 * surrounding form's presentation props nor its instance, so a nested `name`
 * never registers as an independent field. Wrappers that used to override
 * `FormContext` directly for the same purpose should render this instead — a
 * bare `FormContext.Provider` no longer masks the presentation context.
 */
export function FormScopeMask({
  value,
  children,
}: {
  value: ContextType<typeof FormContext>;
  children?: ReactNode;
}) {
  return (
    <ModernControllerContext.Provider value={null}>
      <FormPresentationContext.Provider value={EMPTY_PRESENTATION}>
        <FormContext.Provider value={value}>{children}</FormContext.Provider>
      </FormPresentationContext.Provider>
    </ModernControllerContext.Provider>
  );
}

/**
 * Merge order: presentation context, then the legacy `FormContext`, then the
 * props. Under a legacy root the two contexts carry the same presentation
 * values, so the result is exactly `{ ...FormContext, ...props }` as before.
 */
export function useFormProps(props) {
  const presentation = useContext(FormPresentationContext);
  const ctx = useContext(FormContext);
  const modern = useContext(ModernControllerContext);

  return {
    ...presentation,
    ...(modern ? { form: modern } : {}),
    ...ctx,
    ...props,
  };
}
