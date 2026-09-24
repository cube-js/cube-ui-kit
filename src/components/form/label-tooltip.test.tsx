import {
  hoverWithPointer,
  renderWithForm,
  renderWithRoot,
  screen,
  waitFor,
} from '../../test/index';
import { Select } from '../fields/Select/Select';
import { TextInput } from '../fields/TextInput/TextInput';

import { FieldWrapper } from './FieldWrapper/FieldWrapper';
import { Field } from './Form/Field';
import { warnAboutLegacyTooltip } from './legacy-tooltip';

// Spy on the real implementation, so the one-time warning still behaves.
vi.mock('./legacy-tooltip', { spy: true });

/**
 * The info badge next to a field's label is `labelTooltip`. It used to be
 * `tooltip`, which on a component that is a field AND a trigger meant two
 * things at once: a labelled `Select` rendered its `tooltip` on the trigger
 * and again as a badge, and `Radio` had to omit the field's `tooltip` to keep
 * its own.
 */
describe('labelTooltip', () => {
  const badge = () => screen.queryByTestId('InfoBadge');

  it('renders an info badge next to the label', async () => {
    renderWithRoot(<TextInput label="Email" labelTooltip="Where we write" />);

    expect(screen.getByTestId('Label')).toContainElement(badge());

    await hoverWithPointer(badge()!);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('Where we write');
    });
  });

  it('renders no badge without a label', () => {
    renderWithRoot(<TextInput aria-label="Email" labelTooltip="Unseen" />);

    expect(badge()).toBeNull();
  });

  it('is forwarded to its input by the legacy Field', () => {
    renderWithForm(
      <Field name="email" label="Email" labelTooltip="Where we write">
        <TextInput />
      </Field>,
    );

    expect(screen.getByTestId('Label')).toContainElement(badge());
  });

  describe('on a Select, which has a tooltip of its own', () => {
    const items = [<Select.Item key="a">Alpha</Select.Item>];

    it('keeps `tooltip` on the trigger, out of the label', () => {
      renderWithRoot(
        <Select label="Letter" tooltip="Pick one">
          {items}
        </Select>,
      );

      expect(badge()).toBeNull();
    });

    it('renders `labelTooltip` as the label badge', () => {
      renderWithRoot(
        <Select label="Letter" labelTooltip="Why it matters">
          {items}
        </Select>,
      );

      expect(screen.getByTestId('Label')).toContainElement(badge());
    });
  });

  describe('the legacy `tooltip` spelling', () => {
    it('renders no badge and says so, once', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Cast: TypeScript already rejects the old spelling. The warning is for
      // the callers it cannot see — JS, loose spreads, index signatures.
      const legacy = { tooltip: 'Where we write' } as object;

      renderWithRoot(
        <>
          <TextInput label="Email" {...legacy} />
          <TextInput label="Name" {...legacy} />
        </>,
      );

      expect(badge()).toBeNull();

      const calls = spy.mock.calls.filter((args) =>
        String(args[1]).includes('labelTooltip'),
      );

      expect(calls).toHaveLength(1);

      spy.mockRestore();
    });

    // Neither goes through `wrapWithField`: the legacy `Field` hands its child
    // a curated prop set, and `FieldWrapper` can be rendered directly.
    it('is caught on a legacy Field and on a bare FieldWrapper', () => {
      const legacy = { tooltip: 'Where we write' } as object;

      renderWithForm(
        <>
          <Field name="email" label="Email" {...legacy}>
            <TextInput />
          </Field>
          <FieldWrapper label="Name" Component={<input />} {...legacy} />
        </>,
      );

      expect(badge()).toBeNull();
      expect(warnAboutLegacyTooltip).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Email', tooltip: 'Where we write' }),
      );
      expect(warnAboutLegacyTooltip).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Name', tooltip: 'Where we write' }),
      );
    });
  });
});
