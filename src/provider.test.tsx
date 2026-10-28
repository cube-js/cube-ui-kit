import { cloneElement, ReactElement } from 'react';

import { Provider, useProviderProps } from './provider';
import { FORM_ATTACHABLE_INPUTS } from './test/form-attachable-inputs';
import { renderHook, renderWithForm, renderWithRoot } from './test/index';

import { SearchComboBox, SearchInput, TextInput } from './index';

const INPUTS: [string, ReactElement<any>][] = [
  ...FORM_ATTACHABLE_INPUTS,
  ['SearchInput', <SearchInput label="SearchInput" />],
  [
    'SearchComboBox',
    <SearchComboBox label="SearchComboBox">
      <SearchComboBox.Item key="one">One</SearchComboBox.Item>
    </SearchComboBox>,
  ],
];

/**
 * A `false` on these does not reach every control inside them. A group's
 * options each read the provider themselves, so the provider's state wins over
 * the group's; `Slider` and `RangeSlider` drop `isDisabled` before
 * `SliderBase`, which reads only the provider.
 */
const FALSE_STAYS_ON_THE_ROOT = new Set([
  'CheckboxGroup',
  'RadioGroup',
  'RadioGroup (buttons)',
  'Slider',
  'RangeSlider',
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

    it.each(INPUTS)(
      '%s keeps the inherited state when the prop is explicitly undefined',
      (_, input) => {
        const inherited = signatureOf(input, {});

        if (prop === 'isDisabled') {
          // The provider must show on the field, or the comparison proves nothing.
          expect(inherited).not.toEqual(signatureOf(input, {}, false));
        }

        expect(signatureOf(input, { [prop]: undefined })).toEqual(inherited);
      },
    );

    it.each(INPUTS.filter(([name]) => !FALSE_STAYS_ON_THE_ROOT.has(name)))(
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
