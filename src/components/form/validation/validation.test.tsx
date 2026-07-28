import { TextInput } from '../../../index';
import { act, renderWithForm, renderWithRoot } from '../../../test/index';

import {
  getValidationMods,
  getValidationTheme,
  resolveValidationProps,
} from './resolve-validation-props';

describe('resolveValidationProps', () => {
  it('leaves both flags undefined when nothing is provided', () => {
    expect(resolveValidationProps({})).toEqual({
      isInvalid: undefined,
      isValid: undefined,
    });
  });

  it('maps the deprecated validationState onto booleans', () => {
    expect(resolveValidationProps({ validationState: 'invalid' })).toEqual({
      isInvalid: true,
      isValid: false,
    });
    expect(resolveValidationProps({ validationState: 'valid' })).toEqual({
      isInvalid: false,
      isValid: true,
    });
  });

  it('lets isInvalid/isValid win over validationState', () => {
    expect(
      resolveValidationProps({ isInvalid: false, validationState: 'invalid' }),
    ).toEqual({ isInvalid: false, isValid: false });
    expect(
      resolveValidationProps({ isValid: true, validationState: 'invalid' }),
    ).toEqual({ isInvalid: true, isValid: false });
  });

  it('gives isInvalid precedence over isValid', () => {
    expect(resolveValidationProps({ isInvalid: true, isValid: true })).toEqual({
      isInvalid: true,
      isValid: false,
    });
  });

  it('pins both flags as soon as one of them is provided', () => {
    expect(resolveValidationProps({ isValid: true })).toEqual({
      isInvalid: false,
      isValid: true,
    });
  });
});

describe('getValidationMods', () => {
  it('maps the resolved state onto tasty mods', () => {
    expect(getValidationMods({})).toEqual({ invalid: false, valid: false });
    expect(getValidationMods({ isInvalid: true })).toEqual({
      invalid: true,
      valid: false,
    });
    expect(getValidationMods({ isValid: true })).toEqual({
      invalid: false,
      valid: true,
    });
    expect(getValidationMods({ isInvalid: true, isValid: true })).toEqual({
      invalid: true,
      valid: false,
    });
  });
});

describe('getValidationTheme', () => {
  it('only maps the invalid state by default', () => {
    expect(getValidationTheme('default', { isInvalid: true })).toBe('danger');
    expect(getValidationTheme('default', { isValid: true })).toBe('default');
    expect(getValidationTheme(undefined, {})).toBeUndefined();
  });

  it('maps the valid state when includeValid is set', () => {
    expect(
      getValidationTheme('default', { isValid: true }, { includeValid: true }),
    ).toBe('success');
    expect(
      getValidationTheme(
        'default',
        { isInvalid: true },
        { includeValid: true },
      ),
    ).toBe('danger');
  });
});

describe('validation props on inputs', () => {
  it('applies the invalid mod for isInvalid', () => {
    const { getByRole } = renderWithRoot(<TextInput label="Name" isInvalid />);

    expect(getByRole('textbox').closest('[data-invalid]')).not.toBe(null);
  });

  it('applies the valid mod for isValid', () => {
    const { getByRole } = renderWithRoot(<TextInput label="Name" isValid />);

    const input = getByRole('textbox');

    expect(input.closest('[data-valid]')).not.toBe(null);
    expect(input.closest('[data-invalid]')).toBe(null);
  });

  // `useWarn` only fires once per session, so the styling and the deprecation notice are asserted
  // together in a single test.
  it('still supports the deprecated validationState and warns about it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { getByRole } = renderWithRoot(
      <TextInput label="Name" validationState="invalid" />,
    );

    expect(getByRole('textbox').closest('[data-invalid]')).not.toBe(null);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('CubeUIKit'),
      expect.stringContaining('"validationState" property is deprecated'),
    );

    warn.mockRestore();
  });

  it('lets an explicit isValid win over the form-derived invalid state', async () => {
    const { getByRole, formInstance } = renderWithForm(
      <TextInput
        label="Name"
        name="name"
        rules={[{ required: true, message: 'Name is required' }]}
        isValid
      />,
    );

    await act(async () => {
      await formInstance.validateFields().catch(() => {});
    });

    const input = getByRole('textbox');

    expect(input.closest('[data-valid]')).not.toBe(null);
    expect(input.closest('[data-invalid]')).toBe(null);
  });
});
