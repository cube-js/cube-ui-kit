import React from 'react';
import { applyRules } from './validation';

function isEqual(v1, v2) {
  return JSON.stringify(v1) === JSON.stringify(v2);
}

class FormStore {
  constructor(forceReRender) {
    this.forceReRender = forceReRender;
    this.initialFields = {};
    this.fields = {};

    this.setFieldValues = this.setFieldValues.bind(this);
    this.getFieldValue = this.getFieldValue.bind(this);
    this.getFieldValues = this.getFieldValues.bind(this);
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
      return this.onSubmit();
    }
  }

  setFieldValues(newData, touched = false) {
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
        this.onValuesChange && this.onValuesChange(this.getFieldValues());
      }
    }
  }

  getFieldValue(name) {
    return this.fields[name] && this.fields[name].value;
  }

  getFieldValues() {
    return Object.values(this.fields).reduce((map, field) => {
      map[field.name] = field.value;

      return map;
    }, {});
  }

  setFieldValue(name, value, touched = false) {
    const field = this.fields[name];

    if (!field || isEqual(value, field.value)) return;

    field.value = value;

    if (touched) {
      field.touched = touched;
    }

    this.forceReRender();

    if (touched) {
      this.onValuesChange && this.onValuesChange(this.getFieldValues());
    }
  }

  getFieldInstance(name) {
    return this.fields[name];
  }

  setInitialFieldValues(values) {
    this.initialFields = values || {};
  }

  resetFields() {
    this.setFieldValues(this.initialFields);
  }

  async validateField(name) {
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

  validateFields(list) {
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

  isFieldValid(name) {
    const field = this.getFieldInstance(name);

    if (!field) return true;

    return !field.invalid;
  }

  isFieldInvalid(name) {
    const field = this.getFieldInstance(name);

    if (!field) return false;

    return field.invalid;
  }

  isFieldTouched(name) {
    const field = this.getFieldInstance(name);

    if (!field) return false;

    return field.touched;
  }

  getFieldError(name) {
    const field = this.getFieldInstance(name);

    if (!field) return [];

    return field.errors || [];
  }

  createField(name) {
    if (!this.fields[name]) {
      this.fields[name] = this._createField(name);
    }

    this.forceReRender();
  }

  setFields(newFields) {
    newFields.forEach(({ name, value, errors }) => {
      this.fields[name] = this._createField(name, {
        value,
        errors,
      });
    });

    this.forceReRender();
  }

  _createField(name, data) {
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

function useForm(form, ref, { onSubmit, onValuesChange } = {}) {
  const formRef = React.useRef();
  const [, forceUpdate] = React.useState({});

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
    form.onSubmit = onSubmit;
    form.onValuesChange = onValuesChange;
  }

  return [formRef.current];
}

export default useForm;
