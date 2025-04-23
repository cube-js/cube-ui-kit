import { render, RenderOptions } from '@testing-library/react';
import React from 'react';

import { CubeFormInstance, CubeFormProps, Form } from '../components/form';
import { Root } from '../components/Root';

export function renderWithRoot(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'queries' | 'wrapper'>,
) {
  return render(ui, { ...options, wrapper: Root });
}

export function renderWithForm(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'queries' | 'wrapper'> & {
    formProps?: Partial<Omit<CubeFormProps, 'form'>>;
  },
) {
  const { formProps, ...testingLibraryOptions } = options ?? {};

  let formInstance: CubeFormInstance<any>;

  return {
    ...render(ui, {
      ...testingLibraryOptions,
      wrapper: function Wrapper({ children }) {
        const [form] = Form.useForm();
        formInstance = form;

        return (
          <Root>
            <Form {...formProps} form={form}>
              {children}
            </Form>
          </Root>
        );
      },
    }),
    // @ts-expect-error TS2454
    formInstance,
  } as const;
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
