import { useRef, useState } from 'react';
import { applyRules } from './validation';

export type CubeFormData = { [key: string]: any };
export type CubeField = {
  value?: any;
  name: string;
  errors: string[];
  touched?: boolean;
  rules?: any[];
  validating?: boolean;
};

function isEqual(v1, v2) {
  return JSON.stringify(v1) === JSON.stringify(v2);
}

export class FormStore {
  public forceReRender: () => void = () => {};
  private initialFields = {};
  private fields: { [key: string]: CubeField } = {};
  public ref = {};
  public onValuesChange: (CubeFormData) => void | Promise<any> = () => {};
  public onSubmit: (CubeFormData) => void | Promise<any> = () => {};

  constructor(forceReRender?: () => void) {
    this.forceReRender = forceReRender || (() => {});
    this.initialFields = {};
    this.fields = {};

    this.setFieldValues = this.setFieldValues.bind(this);
    this.getFieldValue = this.getFieldValue.bind(this);
    this.getFieldsValue = this.getFieldsValue.bind(this);
    this.setFieldValue = this.setFieldValue.bind(this);
    this.getFieldInstance = this.getFieldInstance.bind(this);
    this.setInitialFieldValues = this.setInitialFieldValues.bind(this);
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
    if (this.onSubmit) {
      return this.onSubmit(this.getFieldsValue());
    }
  }

  setFieldValues(newData: { [key: string]: any }, touched = false) {
    let flag = false;

    Object.keys(newData).forEach((name) => {
      const field = this.fields[name];

      if (!field || isEqual(field.value, newData[name])) return;

      flag = true;

      field.value = newData[name];

      if (touched) {
        field.touched = touched;
      }
    });

    if (flag) {
      this.forceReRender();

      if (touched) {
        this.onValuesChange && this.onValuesChange(this.getFieldsValue());
      }
    }
  }

  getFieldValue(name): any {
    return this.fields[name] && this.fields[name].value;
  }

  getFieldsValue(): CubeFormData {
    const data: CubeFormData = {};

    return Object.values(this.fields).reduce((map, field) => {
      map[field.name] = field.value;

      return map;
    }, data);
  }

  setFieldValue(name: string, value: any, touched = false) {
    const field = this.fields[name];

    if (!field || isEqual(value, field.value)) return;

    field.value = value;

    if (touched) {
      field.touched = touched;
    }

    this.forceReRender();

    if (touched) {
      this.onValuesChange && this.onValuesChange(this.getFieldsValue());
    }
  }

  getFieldInstance(name: string): CubeField {
    return this.fields[name];
  }

  setInitialFieldValues(values: { [key: string]: any }): void {
    this.initialFields = values || {};
  }

  resetFields(): void {
    this.setFieldValues(this.initialFields);
  }

  async validateField(name: string): Promise<any> {
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
        if (!field.errors || !isEqual(field.errors, [err])) {
          field.errors = [err];

          this.forceReRender();
        }

        return Promise.reject([err]);
      });
  }

  validateFields(list?: string[]): Promise<any> {
    const fieldsList = list || Object.keys(this.fields);
    const errMap = {};

    return Promise.all(
      fieldsList.map((name) => {
        return this.validateField(name).catch((err) => {
          errMap[name] = err;

          return Promise.reject();
        });
      }),
    ).catch(() => Promise.reject(errMap));
  }

  isFieldValid(name: string): boolean {
    const field = this.getFieldInstance(name);

    if (!field) return true;

    return !field.errors.length;
  }

  isFieldInvalid(name: string): boolean {
    const field = this.getFieldInstance(name);

    if (!field) return false;

    return !!field.errors.length;
  }

  isFieldTouched(name: string): boolean {
    const field = this.getFieldInstance(name);

    if (!field) return false;

    return !!field.touched;
  }

  getFieldError(name: string) {
    const field = this.getFieldInstance(name);

    if (!field) return [];

    return field.errors || [];
  }

  createField(name: string) {
    if (!this.fields[name]) {
      this.fields[name] = this._createField(name);
    }

    this.forceReRender();
  }

  setFields(newFields: CubeField[]) {
    newFields.forEach(({ name, value, errors }) => {
      this.fields[name] = this._createField(name, {
        value,
        errors,
      });
    });

    this.forceReRender();
  }

  _createField(name, data?: Partial<CubeField>): CubeField {
    return {
      name,
      value: undefined,
      validating: false,
      touched: false,
      errors: [],
      ...data,
    };
  }
}

export function useForm(
  form?: FormStore,
  ref?,
  options: {
    onSubmit?: FormStore['onSubmit'];
    onValuesChange?: FormStore['onValuesChange'];
  } = {},
): [FormStore] {
  const { onSubmit, onValuesChange } = options;
  const formRef = useRef<FormStore>();
  const [, forceUpdate] = useState({});

  if (!formRef.current) {
    if (form) {
      formRef.current = form;
    } else {
      // Create a new FormStore if not provided
      const forceReRender = () => {
        forceUpdate({});
      };

      form = formRef.current = new FormStore(forceReRender);
    }

    form.ref = ref;

    if (onSubmit) {
      form.onSubmit = onSubmit;
    }

    if (onValuesChange) {
      form.onValuesChange = onValuesChange;
    }
  }

  return [formRef.current];
}
