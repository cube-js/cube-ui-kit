import { CalendarDate, Time } from '@internationalized/date';

import { act, renderWithForm, renderWithRoot } from '../../../test';

import { DateInput } from './DateInput';
import { DatePicker } from './DatePicker';
import { DateRangePicker } from './DateRangePicker';
import { TimeInput } from './TimeInput';

const value = new CalendarDate(2024, 1, 15);

describe('DatePicker family validation chrome', () => {
  describe.each([
    ['DateInput', (props: any) => <DateInput value={value} {...props} />],
    ['DatePicker', (props: any) => <DatePicker value={value} {...props} />],
    [
      'DateRangePicker',
      (props: any) => (
        <DateRangePicker value={{ start: value, end: value }} {...props} />
      ),
    ],
    [
      'TimeInput',
      (props: any) => <TimeInput value={new Time(10, 30)} {...props} />,
    ],
  ])('%s', (_name, render) => {
    it('should show the valid indicator and mod for isValid', () => {
      const { container } = renderWithRoot(render({ isValid: true }));

      expect(
        container.querySelector('[data-element="ValidationIcon"]'),
      ).not.toBeNull();
      expect(container.querySelector('[data-valid]')).not.toBeNull();
    });

    it('should show the invalid mod for isInvalid', () => {
      const { container } = renderWithRoot(render({ isInvalid: true }));

      expect(container.querySelector('[data-invalid]')).not.toBeNull();
      expect(container.querySelector('[data-valid]')).toBeNull();
    });

    it('should prefer the invalid state when both are passed', () => {
      const { container } = renderWithRoot(
        render({ isInvalid: true, isValid: true }),
      );

      expect(container.querySelector('[data-invalid]')).not.toBeNull();
      expect(container.querySelector('[data-valid]')).toBeNull();
    });

    it('should show no validation chrome by default', () => {
      const { container } = renderWithRoot(render({}));

      expect(
        container.querySelector('[data-element="ValidationIcon"]'),
      ).toBeNull();
      expect(container.querySelector('[data-valid]')).toBeNull();
      expect(container.querySelector('[data-invalid]')).toBeNull();
    });
  });

  it('should surface the form-derived valid state on DateInput', async () => {
    const { container, formInstance } = renderWithForm(
      <DateInput
        name="date"
        label="Date"
        showValid
        rules={[{ required: true }]}
      />,
      { formProps: { defaultValues: { date: value } } },
    );

    expect(container.querySelector('[data-valid]')).toBeNull();

    await act(async () => {
      await formInstance.validateField('date');
    });

    expect(container.querySelector('[data-valid]')).not.toBeNull();
    expect(
      container.querySelector('[data-element="ValidationIcon"]'),
    ).not.toBeNull();
  });
});
