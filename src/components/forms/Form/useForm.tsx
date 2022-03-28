import { useRef, useState } from 'react';
import { dotize } from '../../../utils/dotize';
import { applyRules } from './validation';

export type CubeFormData = { [key: string]: any };
export type CubeFieldData = {
  value?: any;
  name: string;
  errors: string[];
  touched?: boolean;
  rules?: any[];
  validating?: boolean;
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

export class CubeFormInstance {
  public forceReRender: () => void = () => {};
  private initialFields = {};
  private fields: { [key: string]: CubeFieldData } = {};
  public ref = {};
  public isSubmitting = false;
  public onValuesChange: (CubeFormData) => void | Promise<any> = () => {};
  public onSubmit: (CubeFormData) => void | Promise<any> = () => {};

  constructor(forceReRender?: () => void) {
    this.forceReRender = forceReRender || (() => {});
    this.initialFields = {};
    this.fields = {};

    this.getFieldValue = this.getFieldValue.bind(this);
    this.getFieldsValue = this.getFieldsValue.bind(this);
    this.setFieldsValue = this.setFieldsValue.bind(this);
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
    if (this.onSubmit) {
      return this.onSubmit(this.getFormData());
    }
  }

  setFieldsValue(
    newData: { [key: string]: any },
    touched?: boolean,
    skipRender?: boolean,
    createFields = false,
  ) {
    let flag = false;

    Object.keys(newData).forEach((name) => {
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

      field.value = newData[name];

      if (touched === true) {
        field.touched = touched;
      } else if (touched === false) {
        field.touched = false;
        field.errors = [];
      }
    });

    if (flag && !skipRender) {
      this.forceReRender();

      if (touched) {
        this.onValuesChange && this.onValuesChange(this.getFormData());
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

  /**
   * Similar to getFieldsValue() but respects '.' notation and creates nested objects.
   */
  getFormData(): CubeFormData {
    const fieldsValue = this.getFieldsValue();

    return Object.keys(fieldsValue).reduce((map, field) => {
      setValue(map, field, fieldsValue[field]);

      if (field.includes('.')) {
        delete map[field];
      }

      return map;
    }, {});
  }

  setFieldValue(
    name: string,
    value: any,
    touched = false,
    skipRender?: boolean,
  ) {
    const field = this.fields[name];

    if (!field || isEqual(value, field.value)) return;

    field.value = value;

    if (touched) {
      field.touched = touched;
    }

    if (!skipRender) {
      this.forceReRender();
    }

    if (touched) {
      this.onValuesChange && this.onValuesChange(this.getFormData());
    }
  }

  getFieldInstance(name: string): CubeFieldData {
    return this.fields[name];
  }

  setInitialFieldsValue(values: { [key: string]: any }): void {
    this.initialFields = dotize.convert(values) || {};
  }

  resetFields(names?: string[], skipRender?: boolean): void {
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
    const errorList: { name: string; errors: string[] }[] = [];

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

  createField(name: string, skipRender?: boolean) {
    if (!this.fields[name]) {
      this.fields[name] = this._createField(name);
    }

    if (!skipRender) {
      this.forceReRender();
    }
  }

  removeField(name: string, skipRender?: boolean) {
    if (this.fields[name]) {
      delete this.fields[name];
    }

    if (!skipRender) {
      this.forceReRender();
    }

    this.validateFields().catch(() => {});
  }

  setFields(newFields: CubeFieldData[]) {
    newFields.forEach(({ name, value, errors }) => {
      this.fields[name] = this._createField(name, {
        value,
        errors,
      });
    });

    this.forceReRender();
  }

  setSubmitting(isSubmitting: boolean) {
    this.isSubmitting = isSubmitting;
    this.forceReRender();
  }

  _createField(name, data?: Partial<CubeFieldData>): CubeFieldData {
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
  form?: CubeFormInstance,
  ref?,
  options: {
    onSubmit?: CubeFormInstance['onSubmit'];
    onValuesChange?: CubeFormInstance['onValuesChange'];
  } = {},
): [CubeFormInstance] {
  const { onSubmit, onValuesChange } = options;
  const formRef = useRef<CubeFormInstance>();
  const [, forceUpdate] = useState({});

  if (!formRef.current) {
    if (form) {
      formRef.current = form;
    } else {
      // Create a new FormInstance if not provided
      const forceReRender = () => {
        forceUpdate({});
      };

      form = formRef.current = new CubeFormInstance(forceReRender);
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
