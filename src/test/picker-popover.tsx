import { parseDate } from '@internationalized/date';

import { ColorInput } from '../components/fields/ColorInput/ColorInput';
import { ColorPicker } from '../components/fields/ColorPicker/ColorPicker';
import { DatePicker } from '../components/fields/DatePicker/DatePicker';
import { DateRangePicker } from '../components/fields/DatePicker/DateRangePicker';
import { DateRangeSeparatedPicker } from '../components/fields/DatePicker/DateRangeSeparatedPicker';
import { PeriodPicker } from '../components/fields/DatePicker/PeriodPicker';
import { FilterPicker } from '../components/fields/FilterPicker/FilterPicker';
import { Picker } from '../components/fields/Picker/Picker';

const date = parseDate('2026-10-09');
const range = { start: date, end: date.add({ days: 3 }) };
const items = [
  { key: 'apple', label: 'Apple' },
  { key: 'banana', label: 'Banana' },
];

export const pickerPopoverCases = [
  {
    name: 'Picker',
    render: () => (
      <Picker label="Test picker" type="primary" items={items}>
        {(item) => <Picker.Item key={item.key}>{item.label}</Picker.Item>}
      </Picker>
    ),
    triggerIndex: 0,
  },
  {
    name: 'FilterPicker',
    render: () => (
      <FilterPicker label="Test picker" type="primary" items={items}>
        {(item) => (
          <FilterPicker.Item key={item.key}>{item.label}</FilterPicker.Item>
        )}
      </FilterPicker>
    ),
    triggerIndex: 0,
  },
  {
    name: 'DatePicker',
    render: () => <DatePicker label="Test picker" defaultValue={date} />,
    triggerIndex: 0,
  },
  {
    name: 'DateRangePicker',
    render: () => <DateRangePicker label="Test picker" defaultValue={range} />,
    triggerIndex: 0,
  },
  ...[0, 1].map((triggerIndex) => ({
    name: `DateRangeSeparatedPicker ${triggerIndex ? 'end' : 'start'}`,
    render: () => (
      <DateRangeSeparatedPicker label="Test picker" defaultValue={range} />
    ),
    triggerIndex,
  })),
  {
    name: 'PeriodPicker',
    render: () => <PeriodPicker label="Test picker" defaultValue={date} />,
    triggerIndex: 0,
  },
  {
    name: 'ColorPicker',
    render: () => <ColorPicker label="Test picker" defaultValue="#ff0000" />,
    triggerIndex: 0,
  },
  {
    name: 'ColorInput',
    render: () => <ColorInput label="Test picker" defaultValue="#ff0000" />,
    triggerIndex: 0,
  },
];
