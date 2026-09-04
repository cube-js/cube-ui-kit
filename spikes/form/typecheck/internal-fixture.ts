import { createFormStore } from '../internal/store';

import type { DeploymentValues } from './cloud-values';

export function build() {
  const store = createFormStore<DeploymentValues>({
    defaultValues: {},
    callbacks: {
      onSubmit: async (values) => {
        void values.name;
      },
    },
  });

  const name = store.register('name', {
    rules: [
      {
        validator: (_rule, value) =>
          String(value).length < 3 ? 'short' : undefined,
      },
    ],
  });
  const port = store.register('CUBEJS_DB_PORT');
  const thresholds = store.register('alertThresholds');
  const nested = store.register('alertThresholds[0].email');

  store.setValue('apiInstances', 2);
  store.setValue('region', 'eu-west-1');
  store.setValue('tags.env', 'prod');
  const dynamicName = 'CUBEJS_DB_' + 'HOST';
  store.setValue(dynamicName, 'db.internal');

  return {
    store,
    name,
    port,
    thresholds,
    nested,
    value: store.getValue('budgetRecipients'),
  };
}
