import { cloneElement, ReactElement } from 'react';

import { Provider, useProviderProps } from './provider';
import { FIELD_INPUTS } from './test/form-attachable-inputs';
import { renderHook, renderWithForm, renderWithRoot } from './test/index';

import { TextInput } from './index';

/**
 * These leave no trace of a read-only state in the DOM, so the read-only cases
 * can't tell inherited from not inherited on them and skip them. A
 * `CheckboxGroup` shows one only on its options, which read the group's state
 * from the provider it renders around them.
 */
const NO_READ_ONLY_TRACE = new Set([
  'FileInput',
  'FilterListBox',
  'FilterPicker',
  'HueSlider',
  'ListBox',
  'Picker',
  'RangeSlider',
  'Select',
  'Slider',
  'TextInputMapper',
]);

/**
 * Every disabled and read-only attribute in the tree, element by element, so
 * two renders compare equal only when they agree on the field's state. An
 * `aria-disabled="false"` says what a missing attribute says, so it is left out.
 */
function stateSignature(container: HTMLElement) {
  return Array.from(container.querySelectorAll('*'), (element) =>
    [
      element.tagName,
      ...Array.from(element.attributes)
        .filter(
          ({ name, value }) =>
            /disabled|readonly/i.test(name) && value !== 'false',
        )
        .map(({ name, value }) => `${name}=${value}`)
        .sort(),
    ].join(' '),
  );
}

describe('useProviderProps', () => {
  it('keeps the provider value for a prop set to undefined', () => {
    const { result } = renderHook(
      () =>
        useProviderProps({
          isDisabled: undefined,
          isReadOnly: false,
          isRequired: true,
        }),
      {
        wrapper: ({ children }) => (
          <Provider isDisabled isReadOnly>
            {children}
          </Provider>
        ),
      },
    );

    expect(result.current).toMatchObject({
      isDisabled: true,
      isReadOnly: false,
      isRequired: true,
    });
  });
});

describe.each(['isDisabled', 'isReadOnly'] as const)(
  'a field inside <Provider %s>',
  (prop) => {
    function signatureOf(
      input: ReactElement<any>,
      props: object,
      inside = true,
    ) {
      const field = cloneElement(input, props);
      const { container, unmount } = renderWithRoot(
        inside ? <Provider {...{ [prop]: true }}>{field}</Provider> : field,
      );
      const signature = stateSignature(container);

      unmount();

      return signature;
    }

    const inputs = FIELD_INPUTS.filter(
      ([name]) => prop !== 'isReadOnly' || !NO_READ_ONLY_TRACE.has(name),
    );

    it.each(inputs)(
      '%s keeps the inherited state when the prop is explicitly undefined',
      (_, input) => {
        const inherited = signatureOf(input, {});

        // The provider must show on the field, or the comparison proves nothing.
        expect(inherited).not.toEqual(signatureOf(input, {}, false));
        expect(signatureOf(input, { [prop]: undefined })).toEqual(inherited);
      },
    );

    it.each(inputs)(
      '%s overrides the provider with false',
      (_, input) => {
        expect(signatureOf(input, { [prop]: false })).toEqual(
          signatureOf(input, {}, false),
        );
      },
    );
  },
);

describe('a wrapper passing an optional isDisabled through', () => {
  function NameField({ isDisabled }: { isDisabled?: boolean }) {
    return <TextInput label="Name" isDisabled={isDisabled} />;
  }

  it('leaves the field disabled with its disabled Form', () => {
    const { getByRole } = renderWithForm(<NameField />, {
      formProps: { isDisabled: true },
    });

    expect(getByRole('textbox')).toBeDisabled();
  });

  it('enables the field when it passes false', () => {
    const { getByRole } = renderWithForm(<NameField isDisabled={false} />, {
      formProps: { isDisabled: true },
    });

    expect(getByRole('textbox')).not.toBeDisabled();
  });
});
