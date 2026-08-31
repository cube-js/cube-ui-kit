import { renderWithForm, renderWithRoot } from '../../test/index';
import { TextInput } from '../fields/TextInput/TextInput';

import { Field } from './Form/Field';

vi.mock('../../_internal/hooks/use-warn');

const star = (container: HTMLElement) =>
  container.querySelector('[data-qa="Label"] svg');

describe('necessity indicators', () => {
  describe('the required mark is opt-in', () => {
    it('should not mark a field that is only required by a rule', () => {
      const { container, getByRole } = renderWithForm(
        <TextInput name="email" label="Email" rules={[{ required: true }]} />,
      );

      expect(star(container)).toBeNull();
      // The rule is still what the field *is*, so it keeps announcing itself.
      expect(getByRole('textbox')).toHaveAttribute('aria-required', 'true');
    });

    it('should mark a field with an explicit isRequired', () => {
      const { container, getByRole } = renderWithForm(
        <TextInput name="email" label="Email" isRequired />,
      );

      expect(star(container)).not.toBeNull();
      expect(getByRole('textbox')).toHaveAttribute('aria-required', 'true');
    });

    it('should mark a field outside of a form', () => {
      const { container } = renderWithRoot(
        <TextInput label="Email" isRequired />,
      );

      expect(star(container)).not.toBeNull();
    });

    it('should mark a rule-required field when an indicator is asked for', () => {
      const { container } = renderWithForm(
        <TextInput
          name="email"
          label="Email"
          necessityIndicator="icon"
          rules={[{ required: true }]}
        />,
      );

      expect(star(container)).not.toBeNull();
    });

    it('should respect requiredMark={false} on the form', () => {
      const { container } = renderWithForm(
        <TextInput name="email" label="Email" isRequired />,
        { formProps: { requiredMark: false } },
      );

      expect(star(container)).toBeNull();
    });

    it('should treat an explicit isRequired={false} as opting out', () => {
      const { container, getByRole } = renderWithForm(
        <TextInput
          name="email"
          label="Email"
          isRequired={false}
          rules={[{ required: true }]}
        />,
      );

      expect(star(container)).toBeNull();
      // The rule still governs the behaviour; only the marker was declined.
      expect(getByRole('textbox')).toHaveAttribute('aria-required', 'true');
    });

    it('should render the label form of the mark', () => {
      const { container, getByText } = renderWithForm(
        <TextInput
          name="email"
          label="Email"
          isRequired
          necessityIndicator="label"
        />,
      );

      expect(star(container)).toBeNull();
      expect(getByText('(required)')).toBeInTheDocument();
    });
  });

  describe('isOptional', () => {
    it('should render an (optional) note without touching validation', () => {
      const { getByText, getByRole } = renderWithForm(
        <TextInput name="nickname" label="Nickname" isOptional />,
      );

      expect(getByText('(optional)')).toBeInTheDocument();
      expect(getByRole('textbox')).not.toHaveAttribute('aria-required');
    });

    it('should include the note in the accessible name', () => {
      const { getByRole } = renderWithForm(
        <TextInput name="nickname" label="Nickname" isOptional />,
      );

      expect(getByRole('textbox')).toHaveAccessibleName('Nickname (optional)');
    });

    it('should lose to isRequired', () => {
      const { container, queryByText } = renderWithForm(
        <TextInput name="email" label="Email" isRequired isOptional />,
      );

      expect(star(container)).not.toBeNull();
      expect(queryByText('(optional)')).not.toBeInTheDocument();
    });

    it('should not fill the gap left by requiredMark={false}', () => {
      // `requiredMark={false}` drops the marker but not the requirement, so the
      // note must not step in and call a required field optional.
      const { container, queryByText, getByRole } = renderWithForm(
        <TextInput name="email" label="Email" isRequired isOptional />,
        { formProps: { requiredMark: false } },
      );

      expect(star(container)).toBeNull();
      expect(queryByText('(optional)')).not.toBeInTheDocument();
      expect(getByRole('textbox')).toHaveAccessibleName('Email');
      expect(getByRole('textbox')).toHaveAttribute('aria-required', 'true');
    });

    it('should survive requiredMark={false} on its own', () => {
      const { getByRole, getByText } = renderWithForm(
        <TextInput name="nickname" label="Nickname" isOptional />,
        { formProps: { requiredMark: false } },
      );

      expect(getByText('(optional)')).toBeInTheDocument();
      expect(getByRole('textbox')).toHaveAccessibleName('Nickname (optional)');
    });

    it('should lose to a required rule', () => {
      const { queryByText } = renderWithForm(
        <TextInput
          name="email"
          label="Email"
          isOptional
          rules={[{ required: true }]}
        />,
      );

      expect(queryByText('(optional)')).not.toBeInTheDocument();
    });
  });

  describe('legacy <Field />', () => {
    it('should not mark a field that is only required by a rule', () => {
      const { container, getByRole } = renderWithForm(
        <Field name="email" rules={[{ required: true }]}>
          <TextInput label="Email" />
        </Field>,
      );

      expect(star(container)).toBeNull();
      expect(getByRole('textbox')).toHaveAttribute('aria-required', 'true');
    });

    it('should mark a field with an explicit isRequired', () => {
      const { container } = renderWithForm(
        <Field name="email" isRequired>
          <TextInput label="Email" />
        </Field>,
      );

      expect(star(container)).not.toBeNull();
    });

    it('should keep a mark the input asks for itself', () => {
      const { container } = renderWithForm(
        <Field name="email" rules={[{ required: true }]}>
          <TextInput label="Email" isRequired />
        </Field>,
      );

      expect(star(container)).not.toBeNull();
    });

    it('should render an (optional) note', () => {
      const { getByText } = renderWithForm(
        <Field name="nickname" isOptional>
          <TextInput label="Nickname" />
        </Field>,
      );

      expect(getByText('(optional)')).toBeInTheDocument();
    });
  });
});
