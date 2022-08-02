export type FieldTypes = {
  [key: string]: any;
};

export type CubeFieldData<Name extends string | number | symbol, Value> = {
  value?: Value;
  name: Name;
  errors: string[];
  touched?: boolean;
  rules?: any[];
  validating?: boolean;
};

export type Fields = Record<keyof FieldTypes, CubeFieldData<string, any>>;
