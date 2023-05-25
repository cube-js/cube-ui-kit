import { ReactNode } from 'react';

export type FieldTypes = {
  [key: string]: any;
};

export type CubeFieldData<Name extends string, Value> = {
  readonly name: Name;
  errors: ReactNode[];
  value?: Value;
  inputValue?: Value;
  touched?: boolean;
  rules?: any[];
  validating?: boolean;
  validationId: number;
  status?: 'valid' | 'invalid';
};

export type Fields = Record<keyof FieldTypes, CubeFieldData<string, any>>;

export type SetFieldsArrType<
  T extends FieldTypes,
  Name extends keyof T & string,
> = CubeFieldData<Name, T[Name]>;
