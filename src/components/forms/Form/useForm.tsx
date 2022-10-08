import { ReactNode, useRef, useState } from 'react';

import { dotize } from '../../../tasty';

import { applyRules } from './validation';
import { CubeFieldData, FieldTypes, SetFieldsArrType } from './types';

export type CubeFormData<T extends FieldTypes> = {
  [K in keyof T]?: CubeFieldData<K, T[K]>;
};

function setValue(obj, path, value) {
  let a = path.split('.');
  let o = obj;

  while (a.length - 1) {
    let n = a.shift();
    if (!(n in o)) o[n] = {};
    o = o[n];
  }
  o[a[0]] = value;
}

function isEqual(v1, v2) {
  return JSON.stringify(v1) === JSON.stringify(v2);
}

export class CubeFormInstance<
  T extends FieldTypes,
  TFormData extends CubeFormData<T> = CubeFormData<T>,
> {
  public forceReRender: () => void = () => {};
  private initialFields: Partial<T> = {};
  private fields: TFormData = {} as TFormData;
  public ref = {};
  public isSubmitting = false;
  public submitError: ReactNode = null;

  public onValuesChange: (data: T) => void | Promise<void> = () => {};
  public onSubmit: (data: T) => void | Promise<void> = () => {};

  constructor(forceReRender: () => void = () => {}) {
    this.forceReRender = forceReRender;

    this.getFieldValue = this.getFieldValue.bind(this);
    this.getFieldsValue = this.getFieldsValue.bind(this);
    this.setFieldValue = this.setFieldValue.bind(this);
    this.getFieldError = this.getFieldError.bind(this);
    this.getFieldInstance = this.getFieldInstance.bind(this);
    this.setInitialFieldsValue = this.setInitialFieldsValue.bind(this);
    this.resetFields = this.resetFields.bind(this);
    this.validateField = this.validateField.bind(this);
    this.validateFields = this.validateFields.bind(this);
    this.isFieldValid = this.isFieldValid.bind(this);
    this.createField = this.createField.bind(this);
    this.isFieldInvalid = this.isFieldInvalid.bind(this);
    this.isFieldTouched = this.isFieldTouched.bind(this);
    this.setFields = this.setFields.bind(this);
  }

  async submit() {
    return this.onSubmit?.(this.getFormData());
  }

  setFieldsValue = (
    newData: Partial<T>,
    touched?: boolean,
    skipRender?: boolean,
    createFields = false,
    inputOnly = false,
  ) => {
    let flag = false;

    Object.keys(newData).forEach((name: keyof T) => {
      let field = this.fields[name];

      if (!field && createFields) {
        this.createField(name, skipRender);
        field = this.fields[name];
      }

      if (!field || isEqual(field.value, newData[name])) {
        if (field && touched === false) {
          field.errors = [];
        }

        return;
      }

      flag = true;

      if (!inputOnly) {
        field.value = newData[name];
      }

      field.inputValue = newData[name];

      if (touched === true) {
        field.touched = touched;
      } else if (touched === false) {
        field.touched = false;
        field.errors = [];
      }
    });

    if (flag && !skipRender) {
      this.forceReRender();

      if (touched && !inputOnly) {
        this.onValuesChange && this.onValuesChange(this.getFormData());
      }
    }
  };

  getFieldValue<Name extends keyof T>(name: Name): T[Name] | undefined {
    return this.fields[name]?.value;
  }

  getFieldsValue(): Partial<T> {
    return Object.values(this.fields).reduce((map, field) => {
      map[field.name] = field.value;

      return map;
    }, {} as T);
  }

  /**
   * Similar to getFieldsValue() but respects '.' notation and creates nested objects.
   */
  getFormData(): T {
    const fieldsValue = this.getFieldsValue();

    return Object.keys(fieldsValue).reduce((map, field) => {
      setValue(map, field, fieldsValue[field]);

      if (field.includes('.')) {
        delete map[field];
      }

      return map;
    }, {} as T);
  }

  setFieldValue<Name extends keyof T>(
    name: Name,
    value: T[Name],
    touched = false,
    skipRender = false,
    inputOnly = false,
  ) {
    const field = this.fields[name];

    if (!field || isEqual(value, inputOnly ? field.inputValue : field.value)) {
      return;
    }

    if (!inputOnly) {
      field.value = value;
    }

    field.inputValue = value;

    if (touched) {
      field.touched = touched;
    }

    if (!skipRender) {
      field.errors = [];

      this.forceReRender();
    }

    if (touched && !inputOnly) {
      this.onValuesChange && this.onValuesChange(this.getFormData());
    }
  }

  getFieldInstance<Name extends keyof T>(name: Name): TFormData[Name] {
    return this.fields[name];
  }

  setInitialFieldsValue(values: Partial<T>): void {
    this.initialFields = dotize.convert(values) ?? {};
  }

  resetFields(names?: (keyof T)[], skipRender?: boolean): void {
    const fieldsValue = this.getFieldsValue();
    const fieldNames = Object.keys({ ...fieldsValue, ...this.initialFields });
    const filteredFieldNames = names
      ? fieldNames.filter((name) => names.includes(name))
      : fieldNames;

    const values = filteredFieldNames.reduce((map, name) => {
      if (name in this.initialFields) {
        map[name] = this.initialFields[name];
      } else {
        map[name] = undefined;
      }

      return map;
    }, {});

    this.setFieldsValue(values, false, skipRender, true);
  }

  async validateField<Name extends keyof T>(name: Name): Promise<any> {
    const field = this.getFieldInstance(name);

    if (!field || !field.rules) return Promise.resolve();

    return applyRules(field.value, field.rules, this)
      .then(() => {
        if (!field.errors || field.errors.length) {
          field.errors = [];

          this.forceReRender();
        }
      })
      .catch((err) => {
        field.errors = [err];

        this.forceReRender();

        return Promise.reject([err]);
      });
  }

  validateFields<Names extends (keyof T)[]>(names?: Names): Promise<any> {
    const fieldsList = names || Object.keys(this.fields);
    const errorList: { name: string; errors: ReactNode[] }[] = [];

    return Promise.allSettled(
      fieldsList.map((name) => {
        return this.validateField(name).catch((errors) => {
          errorList.push({ name, errors });

          return Promise.reject();
        });
      }),
    ).then(() => {
      if (errorList.length) {
        return Promise.reject(errorList);
      }

      return this.getFormData();
    });
  }

  isFieldValid<Name extends keyof T>(name: Name): boolean {
    const field = this.getFieldInstance(name);

    if (!field) return true;

    return !field.errors.length;
  }

  isFieldInvalid<Name extends keyof T>(name: Name): boolean {
    const field = this.getFieldInstance(name);

    if (!field) return false;

    return !!field.errors.length;
  }

  isFieldTouched<Name extends keyof T>(name: Name): boolean {
    const field = this.getFieldInstance(name);

    if (!field) return false;

    return !!field.touched;
  }

  getFieldError<Name extends keyof T>(name: Name): ReactNode[] {
    const field = this.getFieldInstance(name);

    if (!field) return [];

    return field.errors || [];
  }

  createField<Name extends keyof T>(name: Name, skipRender?: boolean) {
    if (!this.fields[name]) {
      this.fields[name] = this._createField(name);
    }

    if (!skipRender) {
      this.forceReRender();
    }
  }

  removeField<Name extends keyof T>(name: Name, skipRender?: boolean) {
    if (this.fields[name]) {
      delete this.fields[name];
    }

    if (!skipRender) {
      this.forceReRender();
    }
  }

  setFields<Names extends keyof T>(newFields: SetFieldsArrType<T, Names>[]) {
    newFields.forEach(({ name, value, errors }) => {
      this.fields[name] = this._createField(name, {
        value,
        errors,
      } as TFormData[Names]);
    });

    this.forceReRender();
  }

  setSubmitting(isSubmitting: boolean) {
    this.isSubmitting = isSubmitting;
    this.forceReRender();
  }

  _createField<Name extends keyof T, Data extends TFormData[Name]>(
    name: Name,
    data?: Data,
  ): Data {
    let obj = {
      name,
      validating: false,
      touched: false,
      errors: [],
      ...data,
    } as unknown as Data;

    if (obj) {
      // condition is here to avoid typing issues
      obj.inputValue = obj.value;
    }

    return obj;
  }
}

export function useForm<TSourceType extends FieldTypes>(
  form?: CubeFormInstance<TSourceType, CubeFormData<TSourceType>>,
  ref?,
  options: {
    onSubmit?: CubeFormInstance<TSourceType>['onSubmit'];
    onValuesChange?: CubeFormInstance<TSourceType>['onValuesChange'];
  } = {},
): [CubeFormInstance<TSourceType>] {
  const { onSubmit, onValuesChange } = options;
  const formRef = useRef<CubeFormInstance<TSourceType>>();
  const [, forceUpdate] = useState({});

  if (!formRef.current) {
    if (form) {
      formRef.current = form;
    } else {
      // Create a new FormInstance if not provided
      const forceReRender = () => {
        forceUpdate({});
      };

      form = formRef.current = new CubeFormInstance<TSourceType>(forceReRender);
    }

    form.ref = ref;
  }

  if (onSubmit) {
    formRef.current.onSubmit = onSubmit;
  }

  if (onValuesChange) {
    formRef.current.onValuesChange = onValuesChange;
  }

  return [formRef.current];
}
