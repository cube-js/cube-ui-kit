import { createContext } from 'react';
import { CheckboxGroupState } from 'react-stately';

export const CheckboxGroupContext = createContext<CheckboxGroupState | null>(
  null,
);
