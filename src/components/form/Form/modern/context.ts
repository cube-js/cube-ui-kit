import { createContext, useContext } from 'react';

import type { FormController } from './controller';

export const ModernControllerContext =
  createContext<FormController<any> | null>(null);

export function useFormControllerContext<
  T extends object = Record<string, unknown>,
>(): FormController<T> {
  const controller = useContext(ModernControllerContext);
  if (!controller) {
    throw new Error(
      'Form.useControllerContext() requires a modern <Form> root. Legacy forms and FormScopeMask do not provide a modern controller.',
    );
  }
  return controller;
}
