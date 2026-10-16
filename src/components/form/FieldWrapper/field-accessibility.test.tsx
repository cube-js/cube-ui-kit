import { cloneElement } from 'react';

import { FORM_ATTACHABLE_INPUTS } from '../../../test/form-attachable-inputs';
import {
  act,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test/index';
import {
  readWithScreenReader,
  startScreenReader,
} from '../../../test/screen-reader';
import { FileInput } from '../../fields/FileInput/FileInput';
import { TagInput } from '../../fields/TagInput/TagInput';
import { TextInput } from '../../fields/TextInput/TextInput';
import { TextInputMapper } from '../../fields/TextInputMapper/TextInputMapper';

/**
 * Inputs whose control ARIA gives no invalid state — a button, or a group
 * around one — so their error message is the only thing that says it.
 * `PasswordInput` does set `aria-invalid`, but its input has no role, and the
 * simulator reads no states without one.
 */
const NO_INVALID_STATE = new Set([
  'ColorPicker',
  'FileInput',
  'FilterPicker',
  'MonthPicker',
  'PasswordInput',
  'PeriodPicker',
  'Picker',
  'QuarterPicker',
  'Select',
  'TextInputMapper',
  'WeekPicker',
  'YearPicker',
]);

/** A `group` can't be invalid, so its checkboxes say it instead. */
const INVALID_ON_MEMBERS = new Set(['CheckboxGroup']);

/**
 * Inputs whose first tab stop is one of their members, named on its own; the
 * group around the members carries the field's name.
 */
const GROUPS = new Set([
  'CheckboxGroup',
  'ColorSwatchGroup',
  'RadioGroup',
  'RadioGroup (buttons)',
  'TextInputMapper',
]);

/** Mounts the input; its description and message ids are linked after layout. */
async function mount(element: Parameters<typeof renderWithRoot>[0]) {
  renderWithRoot(element);
  await act(async () => {});
}

const labelledOnly = (element: (typeof FORM_ATTACHABLE_INPUTS)[number][1]) =>
  cloneElement(element, { label: undefined, 'aria-label': 'Billing name' });

describe('every form-attachable input, read by a screen reader', () => {
  it.each(FORM_ATTACHABLE_INPUTS)(
    '%s says its description, error and invalid state, and shows no bare graphic',
    async (name, element) => {
      await mount(
        cloneElement(element, {
          description: 'Used on invoices',
          errorMessage: 'Too short',
          isInvalid: true,
          isRequired: true,
        }),
      );

      const phrases = await readWithScreenReader();
      const described = phrases.filter((phrase) =>
        phrase.includes(', Used on invoices Too short'),
      );

      // The control, or the group around it, is named by the label and
      // described by both texts — not merely followed by them on the page.
      expect(described).toContainEqual(
        expect.stringMatching(new RegExp(`\\b${name.split(' ')[0]}\\b`)),
      );

      // And that same control says it is invalid, not only a list beside it.
      if (!NO_INVALID_STATE.has(name)) {
        expect(
          INVALID_ON_MEMBERS.has(name) ? phrases : described,
        ).toContainEqual(expect.stringMatching(/, invalid\b/));
      }

      // An `<svg>` a screen reader can reach — the required mark, a check
      // mark — is read out as an unnamed graphic.
      expect(phrases).not.toContainEqual(
        expect.stringContaining('graphics-document'),
      );
    },
  );

  // A field without a label used to render the bare control, so both texts
  // were dropped while the control still said "invalid".
  it.each(FORM_ATTACHABLE_INPUTS)(
    '%s says its description and error without a label',
    async (_, element) => {
      await mount(
        cloneElement(labelledOnly(element), {
          description: 'Used on invoices',
          errorMessage: 'Too short',
          isInvalid: true,
        }),
      );

      expect(await readWithScreenReader()).toContainEqual(
        expect.stringMatching(/Billing name.*, Used on invoices Too short/),
      );
    },
  );

  it.each(FORM_ATTACHABLE_INPUTS)(
    '%s retains its supplied accessible label when rendered bare',
    async (name, element) => {
      const label = `${name.split(' ')[0]} billing`;
      await mount(
        cloneElement(element, {
          isBare: true,
          label: <strong>{label}</strong>,
          description: 'Not rendered help',
          errorMessage: 'Not rendered error',
        }),
      );

      expect(screen.queryByTestId('Field')).not.toBeInTheDocument();
      expect(screen.queryByTestId('FieldDescription')).not.toBeInTheDocument();
      expect(screen.queryByTestId('FieldMessage')).not.toBeInTheDocument();
      const phrases = await readWithScreenReader();

      // A password input has no implicit role. Its DOM association and spoken
      // name still matter even though the simulator cannot add a role prefix.
      if (name === 'PasswordInput') {
        expect(screen.getByLabelText(label)).toHaveAttribute(
          'type',
          'password',
        );
        expect(phrases).toContainEqual(expect.stringContaining(label));
        return;
      }

      const controls = phrases.filter((phrase) =>
        /^(textbox|combobox|button|group|radiogroup|listbox|slider|checkbox|switch), /.test(
          phrase,
        ),
      );
      expect(controls).toContainEqual(expect.stringContaining(label));
    },
  );

  it.each([
    ['plain text', 'Region'],
    ['ReactNode', <strong key="region">Region</strong>],
  ])(
    'keeps the optional note in a bare %s label and leaves adornments out',
    async (_, label) => {
      await mount(
        <TextInput
          isBare
          label={label}
          isOptional
          labelProps={{ id: 'bare-region-label' }}
          labelTooltip="Choose the nearest region"
          labelSuffix={<button>Manage regions</button>}
          extra={<button>View guide</button>}
        />,
      );

      expect(document.getElementById('bare-region-label')).toHaveTextContent(
        'Region',
      );
      expect(
        screen.getByRole('textbox', { name: /^Region .*\(optional\)$/ }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Manage regions' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'View guide' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Choose the nearest region'),
      ).not.toBeInTheDocument();
    },
  );

  it('announces a bare TagInput refusal without adding an invisible error description', async () => {
    await mount(<TagInput isBare aria-label="Tags" defaultValue={['alpha']} />);
    const input = screen.getByRole('textbox', { name: 'Tags' });
    const reader = await startScreenReader();
    await reader.clearSpokenPhraseLog();

    await userEvent.type(input, 'alpha{Enter}');

    await waitFor(async () =>
      expect(await reader.spokenPhraseLog()).toContain(
        'polite: "alpha" is already added',
      ),
    );
    expect(screen.queryByTestId('FieldMessage')).not.toBeInTheDocument();
    expect(input).not.toHaveAccessibleDescription(/already added/);
  });

  it.each(FORM_ATTACHABLE_INPUTS.filter(([name]) => !GROUPS.has(name)))(
    '%s is named by aria-label alone where Tab lands',
    async (_, element) => {
      await mount(labelledOnly(element));
      const reader = await startScreenReader();

      // The name has to be on the control a user reaches, not on a list or a
      // group beside it.
      await reader.press('Tab');
      await waitFor(async () =>
        expect(await reader.lastSpokenPhrase()).toContain('Billing name'),
      );
    },
  );

  it.each(FORM_ATTACHABLE_INPUTS.filter(([name]) => GROUPS.has(name)))(
    '%s is a group named by aria-label alone',
    async (_, element) => {
      await mount(labelledOnly(element));

      expect(await readWithScreenReader()).toContainEqual(
        expect.stringMatching(/^(radio)?group, Billing name/),
      );
    },
  );

  it.each([
    [
      'FileInput',
      <FileInput label="Contract" labelProps={{ id: 'own' }} />,
      'button',
    ],
    [
      'TextInputMapper',
      <TextInputMapper label="Contract" labelProps={{ id: 'own' }} />,
      'group',
    ],
    [
      'bare FileInput',
      <FileInput isBare label="Contract" labelProps={{ id: 'own' }} />,
      'button',
    ],
    [
      'bare TextInputMapper',
      <TextInputMapper isBare label="Contract" labelProps={{ id: 'own' }} />,
      'group',
    ],
  ])(
    '%s keeps a label id the caller set, and is named by it',
    async (_, element, role) => {
      await mount(element);

      expect(document.getElementById('own')).toHaveTextContent('Contract');
      expect(screen.getByRole(role, { name: /^Contract/ })).toBeInTheDocument();
    },
  );
});
