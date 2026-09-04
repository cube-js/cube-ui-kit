import { FieldApi, FormApi } from '@tanstack/form-core';

import type { DeploymentValues } from './cloud-values';

export function build() {
  const form = new FormApi({
    defaultValues: {} as DeploymentValues,
    onSubmit: async ({ value }) => {
      void value.name;
    },
  });

  const name = new FieldApi({
    form,
    name: 'name',
    validators: {
      onChangeAsync: async ({ value }) =>
        value.length < 3 ? 'short' : undefined,
    },
  });
  const port = new FieldApi({ form, name: 'CUBEJS_DB_PORT' });
  const thresholds = new FieldApi({ form, name: 'alertThresholds' });
  const nested = new FieldApi({ form, name: 'alertThresholds[0].email' });

  form.setFieldValue('apiInstances', 2);
  form.setFieldValue('region', 'eu-west-1');
  form.setFieldValue('tags.env', 'prod');
  const dynamicName = ('CUBEJS_DB_' + 'HOST') as keyof DeploymentValues;
  form.setFieldValue(dynamicName, 'db.internal');

  return {
    form,
    name,
    port,
    thresholds,
    nested,
    value: form.getFieldValue('budgetRecipients'),
  };
}
