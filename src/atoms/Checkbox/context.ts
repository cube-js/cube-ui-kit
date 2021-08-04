import { createContext } from 'react';
import { CheckboxGroupState } from '@react-stately/checkbox';

export const CheckboxGroupContext = createContext<CheckboxGroupState | null>(
  null,
);
