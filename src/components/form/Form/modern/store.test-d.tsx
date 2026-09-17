import { expectTypeOf } from 'vitest';

import { createFormStore } from './store';

import type { ModernFormBrand } from '../backend';

const form = createFormStore<{ amount: number; title: string }>();
expectTypeOf(form).toExtend<ModernFormBrand>();
expectTypeOf(form.getValue('amount')).toEqualTypeOf<number | undefined>();
expectTypeOf(form.getValue(['dynamic', 'path'])).toEqualTypeOf<unknown>();
form.subscribeSelector(
  (state) => state.values.amount,
  (value) => {
    expectTypeOf(value).toEqualTypeOf<number | undefined>();
  },
);
// @ts-expect-error snapshots are readonly
form.getSnapshot().values.amount = 1;
// @ts-expect-error state cannot be mutated through field snapshots
form.getFieldSnapshot('amount')!.touched = true;
// @ts-expect-error membership cannot be mutated
form.getSnapshot().dirtyFields.add('amount');
// @ts-expect-error baseline follows the values type
form.setDefaultValues({ amount: 'wrong' });
