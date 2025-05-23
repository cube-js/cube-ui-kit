import { ReactNode, useRef, useState } from 'react';

import { dotize } from '../../../tasty/index';

import { CubeFieldData, FieldTypes, SetFieldsArrType } from './types';
import { applyRules } from './validation';

type PartialString<T> = {
  [P in keyof T & string]?: T[P];
};

export type CubeFormData<T extends FieldTypes> = {
  [K in keyof T & string]?: CubeFieldData<K, T[K]>;
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
  private defaultValues: PartialString<T> = {};
  private fields: TFormData = {} as TFormData;
  public ref = {};
  public isSubmitting = false;
  public submitError: unknown = null;

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
    newData: PartialString<T>,
    touched?: boolean,
    skipRender?: boolean,
  ) => {
    let flag = false;

    newData = { ...newData, ...dotize.convert(newData) };

    Object.keys(newData).forEach((name: keyof T & string) => {
      let field = this.fields[name];

      if (!field) {
        return;
      }

      if (!field || isEqual(field.value, newData[name])) {
        if (field) {
          field.errors = [];
          field.status = undefined;
        }

        return;
      }

      flag = true;

      field.value = newData[name];

      field.errors = [];
      field.status = undefined;

      if (touched === true) {
        field.touched = touched;
      } else if (touched === false) {
        field.touched = false;
      }
    });

    if (flag && !skipRender) {
      if (touched) {
        this.onValuesChange && this.onValuesChange(this.getFormData());
        this.submitError = null;
      }

      this.forceReRender();
    }
  };

  getFieldValue<Name extends keyof T & string>(
    name: Name,
  ): T[Name] | undefined {
    return this.fields[name]?.value;
  }

  getFieldsValue(): PartialString<T> {
    return Object.values(this.fields).reduce((map, field) => {
      if (field && map) {
        map[field.name as keyof T & string] = field.value;
      }

      return map;
    }, {} as PartialString<T>);
  }

  /**
   * Similar to getFieldsValue() but respects '.' notation and creates nested objects.
   */
  getFormData(): T {
    const fieldsValue = this.getFieldsValue();

    return Object.keys(fieldsValue)
      .sort()
      .reduce((map, field) => {
        setValue(map, field, fieldsValue[field]);

        if (field.includes('.')) {
          delete map[field];
        }

        return map;
      }, {} as T);
  }

  setFieldValue<Name extends keyof T & string>(
    name: Name,
    value: T[Name],
    isTouched = false,
    skipRender = false,
  ) {
    const field = this.fields[name];

    if (!field || isEqual(value, field.value)) {
      return;
    }

    field.value = value;

    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.keys(this.fields)
        .filter((key) => key.startsWith(`${name}.`))
        .forEach((key) => {
          const objKey = key.replace(`${name}.`, '');

          this.setFieldValue(key, value[objKey] ?? null, isTouched, false);
        });
    }

    field.errors = [];
    field.status = undefined; // reset validation status

    if (isTouched) {
      field.touched = isTouched;
    }

    if (isTouched) {
      this.onValuesChange && this.onValuesChange(this.getFormData());
      this.submitError = null;
    }

    if (!skipRender) {
      this.forceReRender();
    }
  }

  getFieldInstance<Name extends keyof T & string>(name: Name): TFormData[Name] {
    return this.fields[name];
  }

  setInitialFieldsValue(values: PartialString<T>): void {
    this.defaultValues = { ...values, ...dotize.convert(values) };
  }

  updateInitialFieldsValue(values: FieldTypes): void {
    this.defaultValues = {
      ...this.defaultValues,
      ...values,
      ...dotize.convert(values),
    };
  }

  resetFields(names?: (keyof T & string)[], skipRender?: boolean): void {
    names = names ?? Object.keys(this.fields);

    names.forEach((fieldName) => {
      const field = this.fields[fieldName];

      if (!field) {
        return;
      }

      const defaultValue = this.defaultValues[fieldName] ?? undefined;

      field.value = defaultValue;
      field.touched = false;
      field.errors = [];
      field.status = undefined;
      field.validationId = (field.validationId ?? 0) + 1;
    });

    if (!skipRender) {
      this.forceReRender();
    }
  }

  async validateField<Name extends keyof T & string>(name: Name): Promise<any> {
    const field = this.getFieldInstance(name);

    if (
      // if there are no rules for such field
      !field ||
      !field.rules ||
      // or field is already validated and valid
      field.status === 'valid'
    ) {
      return Promise.resolve();
      // or field is already validated and invalid
    } else if (field.status === 'invalid') {
      return Promise.reject(field.errors[0]);
    }

    field.validating = true;
    field.status = undefined;

    field.validationId = (field.validationId ?? 0) + 1;

    const validationId = field.validationId;

    // store validation to make sure there is no race condition.
    return applyRules(field, this, validationId)
      .then(() => {
        if (field.validationId !== validationId) return;

        field.validating = false;

        if (!field.errors || field.errors.length) {
          field.errors = [];
        }

        field.status = 'valid';

        this.forceReRender();
      })
      .catch((err) => {
        if (field.validationId === validationId) {
          field.errors = [err];
          field.validating = false;
          field.status = 'invalid';

          this.forceReRender();
        }

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

  isFieldValid<Name extends keyof T & string>(name: Name): boolean {
    const field = this.getFieldInstance(name);

    if (!field) return true;

    return !field.errors.length;
  }

  isFieldInvalid<Name extends keyof T & string>(name: Name): boolean {
    const field = this.getFieldInstance(name);

    if (!field) return false;

    return !!field.errors.length;
  }

  isFieldTouched<Name extends keyof T & string>(name: Name): boolean {
    const field = this.getFieldInstance(name);

    if (!field) return false;

    return !!field.touched;
  }

  get isTouched(): boolean {
    return Object.values(this.fields).some((field) => field?.touched);
  }

  get isDirty(): boolean {
    return Object.values(this.fields).some((field) => {
      return field && field.name
        ? JSON.stringify(field?.value) !==
            JSON.stringify(this.defaultValues[field?.name])
        : false;
    });
  }

  /**
   * True if all fields are verified and valid
   * IMPORTANT: This is not the same as `!isInvalid`, because it also checks if all fields are verified.
   */
  get isValid(): boolean {
    return Object.values(this.fields).every((field) => {
      return field?.status === 'valid';
    });
  }

  /**
   * True if at least one field is verified and invalid.
   * IMPORTANT: This is not the same as `!isValid`, because it only checks that at least
   * one field is verified and invalid.
   */
  get isInvalid(): boolean {
    return Object.values(this.fields).some((field) => {
      return field?.status === 'invalid';
    });
  }

  getFieldError<Name extends keyof T & string>(name: Name): ReactNode[] {
    const field = this.getFieldInstance(name);

    if (!field) return [];

    return field.errors || [];
  }

  /**
   * @deprecated This field is not supposed to be used directly.
   */
  createField<Name extends keyof T & string>(name: Name, skipRender?: boolean) {
    // passing an empty name is incorrect, but we have to return a valid object to avoid inconsistency
    if (!name) {
      return this._createField(name);
    }

    if (!this.fields[name]) {
      this.fields[name] = this._createField(name);
    }

    if (!skipRender) {
      this.forceReRender();
    }

    return this.fields[name];
  }

  /**
   * @deprecated This field is not supposed to be used directly.
   */
  removeField<Name extends keyof T & string>(name: Name, skipRender?: boolean) {
    if (this.fields[name]) {
      delete this.fields[name];
    }

    if (!skipRender) {
      this.forceReRender();
    }
  }

  /**
   * @deprecated This method is not recommended. Use other ways to alter fields.
   * Use `setFieldValue` to change the value of a field.
   * Use `verifyField` to validate a field.
   * Use `setFieldError` to set an error for a field.
   * Use `clearFieldsValidation` to clear all errors for a field.
   */
  setFields<Names extends keyof T & string>(
    newFields: SetFieldsArrType<T, Names>[],
  ) {
    newFields.forEach(({ name, value, errors }) => {
      this.fields[name] = this._createField(name, {
        value,
        errors,
      } as TFormData[Names]);
    });

    this.forceReRender();
  }

  resetFieldsValidation(names?: (keyof T & string)[], skipRender?: boolean) {
    (names || Object.keys(this.fields)).forEach((name) => {
      const field = this.getFieldInstance(name);

      if (!field) return;

      field.errors = [];
      field.status = undefined;
      field.validationId = (field.validationId ?? 0) + 1;
    });

    if (!skipRender) {
      this.forceReRender();
    }
  }

  setFieldError(
    name: keyof T & string,
    error: ReactNode,
    skipRender?: boolean,
  ) {
    const field = this.getFieldInstance(name);

    if (!field || !error) return;

    field.errors = [error];
    field.status = 'invalid';
    field.validationId = (field.validationId ?? 0) + 1;

    if (!skipRender) {
      this.forceReRender();
    }
  }

  setSubmitting(isSubmitting: boolean) {
    if (this.isSubmitting === isSubmitting) return;

    this.isSubmitting = isSubmitting;
    this.forceReRender();
  }

  _createField<Name extends keyof T & string, Data extends TFormData[Name]>(
    name: Name,
    data?: Data,
  ): Data {
    let obj = {
      name,
      validating: false,
      touched: false,
      errors: [],
      validationId: 0,
      value: this.defaultValues[name],
      ...data,
      // it should be impossible to define or override status value
      status: data?.errors?.length ? 'invalid' : undefined,
    } as unknown as Data;

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
