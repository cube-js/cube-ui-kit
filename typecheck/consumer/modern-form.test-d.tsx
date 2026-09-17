import { Form } from '@cube-dev/ui-kit';

import type { FormController, ModernFormState } from '@cube-dev/ui-kit';

interface Values {
  amount: number;
  name: string;
}

export function Consumer() {
  const form: FormController<Values> = Form.useController<Values>({
    defaultValues: { amount: 1 },
  });
  const amount: number | undefined = Form.useSelector(
    form,
    (state) => state.values.amount,
  );
  const state: ModernFormState<Values> = form.getSnapshot();
  const modern = (
    <Form form={form}>
      <Form.Subscribe form={form} selector={(value) => value.values.amount}>
        {(value) => <span>{value?.toFixed(2)}</span>}
      </Form.Subscribe>
    </Form>
  );
  // @ts-expect-error modern defaults must be seeded on the controller
  const defaults = <Form form={form} defaultValues={{ amount: 2 }} />;
  // @ts-expect-error legacy creator cannot adopt modern controllers
  Form.useForm(form);
  return (
    <>
      {modern}
      {defaults}
      {amount}
      {String(state.isDirty)}
    </>
  );
}
