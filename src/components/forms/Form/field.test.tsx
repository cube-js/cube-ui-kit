import { useState } from 'react';

import { renderWithForm, userEvent, act } from '../../../test';
import { Radio } from '../RadioGroup/Radio';
import { TextInput } from '../TextInput/TextInput';

import { Field } from './Field';

jest.mock('../../../_internal/hooks/use-warn');

describe('Legacy <Field />', () => {
  it('should set default value as value', () => {
    const { getByRole, formInstance } = renderWithForm(
      <Field name="test" defaultValue="Hello, World!">
        <TextInput label="test" />
      </Field>,
    );

    const input = getByRole('textbox');

    expect(input).toHaveValue('Hello, World!');
    expect(formInstance.getFieldValue('test')).toBe('Hello, World!');
  });

  it('should update default value', () => {
    const { rerender, formInstance } = renderWithForm(
      <Field name="test" defaultValue="Hello, World!">
        <TextInput label="test" />
      </Field>,
    );

    expect(formInstance.getFieldValue('test')).toBe('Hello, World!');

    rerender(
      <Field name="test" defaultValue="World!">
        <TextInput label="test" />
      </Field>,
    );

    expect(formInstance.getFieldValue('test')).toBe('World!');
  });

  it('should not update default value if field is touched', async () => {
    const { rerender, formInstance, getByRole } = renderWithForm(
      <Field name="test" defaultValue="Hello, World!">
        <TextInput label="test" />
      </Field>,
    );

    expect(formInstance.getFieldValue('test')).toBe('Hello, World!');

    const input = getByRole('textbox');

    await act(async () => {
      await userEvent.clear(input);
      await userEvent.type(input, 'Test!');
    });

    rerender(
      <Field name="test" defaultValue="World!">
        <TextInput label="test" />
      </Field>,
    );

    expect(formInstance.getFieldValue('test')).toBe('Test!');
  });

  it('should not replace changed value with default value', async () => {
    const { rerender, formInstance, getByRole } = renderWithForm(
      <Field name="test" defaultValue="Hello, World!">
        <TextInput label="test" />
      </Field>,
    );

    const input = getByRole('textbox');

    await act(async () => {
      await userEvent.clear(input);
      await userEvent.type(input, 'Hello!');
    });

    rerender(
      <Field name="test" defaultValue="World!">
        <TextInput label="test" />
      </Field>,
    );

    expect(formInstance.getFieldValue('test')).toBe('Hello!');
  });

  it('should change value', async () => {
    const { getByRole, formInstance } = renderWithForm(
      <Field name="test" defaultValue="Hello">
        <TextInput label="test" />
      </Field>,
    );

    const input = getByRole('textbox');

    await act(async () => {
      await userEvent.type(input, ', World!');
    });

    expect(input).toHaveValue('Hello, World!');
    expect(formInstance.getFieldValue('test')).toBe('Hello, World!');
  });

  it('should infer default value from <Form />', () => {
    const { getByRole, formInstance } = renderWithForm(
      <Field name="test">
        <TextInput label="test" />
      </Field>,
      {
        formProps: {
          defaultValues: {
            test: 'Hello, World!',
          },
        },
      },
    );

    const input = getByRole('textbox');

    expect(formInstance.getFieldValue('test')).toBe('Hello, World!');
    expect(input).toHaveValue('Hello, World!');
  });

  it('should work without <Field /> in controlled mode, when name is null', async () => {
    function Content() {
      const [deployMode, setDeployMode] = useState('cli');

      return (
        <Radio.Group
          label="Deploy mode"
          value={deployMode}
          onChange={(v) => setDeployMode(v)}
        >
          <Radio value="cli">Deploy with CLI</Radio>
          <Radio value="git">Deploy with GIT</Radio>
        </Radio.Group>
      );
    }
    const { getByRole } = renderWithForm(<Content />);

    const cliRadio = getByRole('radio', { name: 'Deploy with CLI' });
    const gitRadio = getByRole('radio', { name: 'Deploy with GIT' });

    expect(cliRadio).toBeChecked();

    await act(async () => {
      await userEvent.click(gitRadio);
    });

    expect(gitRadio).toBeChecked();
  });

  it('should ignore value in form-controlled mode, when name != null', async () => {
    function Content() {
      const [deployMode] = useState('git');

      return (
        <Radio.Group
          defaultValue="cli"
          label="Deploy mode"
          name="test"
          value={deployMode}
        >
          <Radio value="cli">Deploy with CLI</Radio>
          <Radio value="git">Deploy with GIT</Radio>
        </Radio.Group>
      );
    }
    const { getByRole, formInstance } = renderWithForm(<Content />);

    const cliRadio = getByRole('radio', { name: 'Deploy with CLI' });
    const gitRadio = getByRole('radio', { name: 'Deploy with GIT' });

    expect(cliRadio).toBeChecked();

    await act(async () => {
      await userEvent.click(gitRadio);
    });

    expect(formInstance.getFieldValue('test')).toBe('git');
    expect(gitRadio).toBeChecked();
  });

  it("shouldn't override onChange in component", async () => {
    const onChange = jest.fn();

    const { getByRole, formInstance } = renderWithForm(
      <Radio.Group label="Deploy mode" name="test" onChange={onChange}>
        <Radio value="cli">Deploy with CLI</Radio>
        <Radio value="git">Deploy with GIT</Radio>
      </Radio.Group>,
    );

    const cliRadio = getByRole('radio', { name: 'Deploy with CLI' });

    await act(async () => await userEvent.click(cliRadio));

    expect(formInstance.getFieldValue('test')).toBe('cli');
    expect(onChange).toHaveBeenCalled();
  });

  it('should work if children == null', () => {
    expect(() =>
      renderWithForm(
        <Field name="test">
          {/* @ts-expect-error */}
          {null}
        </Field>,
      ),
    ).not.toThrow();
  });
});
