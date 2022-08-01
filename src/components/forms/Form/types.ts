export type FieldTypes = Record<string, unknown>;

export type CubeFieldData = {
  value?: FieldTypes[CubeFieldData['name']];
  name: keyof FieldTypes;
  errors: string[];
  touched?: boolean;
  rules?: any[];
  validating?: boolean;
};

export type Fields = Record<keyof FieldTypes, CubeFieldData>;
