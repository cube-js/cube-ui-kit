import { parseDate } from '@internationalized/date';

import { ColorInput } from '../components/fields/ColorInput/ColorInput';
import { ColorPicker } from '../components/fields/ColorPicker/ColorPicker';
import { DatePicker } from '../components/fields/DatePicker/DatePicker';
import { DateRangePicker } from '../components/fields/DatePicker/DateRangePicker';
import { DateRangeSeparatedPicker } from '../components/fields/DatePicker/DateRangeSeparatedPicker';
import { PeriodPicker } from '../components/fields/DatePicker/PeriodPicker';
import { FilterPicker } from '../components/fields/FilterPicker/FilterPicker';
import { Picker } from '../components/fields/Picker/Picker';

import type { CubeDialogTriggerProps } from '../components/overlays/Dialog/DialogTrigger';

export interface PresentationProps {
  dialogType?: CubeDialogTriggerProps['type'];
  dialogMobileType?: CubeDialogTriggerProps['mobileType'];
}

const date = parseDate('2026-10-09');
const range = { start: date, end: date.add({ days: 3 }) };
const items = [
  { key: 'apple', label: 'Apple' },
  { key: 'banana', label: 'Banana' },
];

export const pickerDialogCases = [
  {
    name: 'Picker',
    render: (props: PresentationProps) => (
      <Picker label="Test picker" items={items} {...props}>
        {(item) => <Picker.Item key={item.key}>{item.label}</Picker.Item>}
      </Picker>
    ),
    triggerIndex: 0,
  },
  {
    name: 'FilterPicker',
    render: (props: PresentationProps) => (
      <FilterPicker label="Test picker" items={items} {...props}>
        {(item) => (
          <FilterPicker.Item key={item.key}>{item.label}</FilterPicker.Item>
        )}
      </FilterPicker>
    ),
    triggerIndex: 0,
  },
  {
    name: 'DatePicker',
    render: (props: PresentationProps) => (
      <DatePicker label="Test picker" defaultValue={date} {...props} />
    ),
    triggerIndex: 0,
  },
  {
    name: 'DateRangePicker',
    render: (props: PresentationProps) => (
      <DateRangePicker label="Test picker" defaultValue={range} {...props} />
    ),
    triggerIndex: 0,
  },
  ...[0, 1].map((triggerIndex) => ({
    name: `DateRangeSeparatedPicker ${triggerIndex ? 'end' : 'start'}`,
    render: (props: PresentationProps) => (
      <DateRangeSeparatedPicker
        label="Test picker"
        defaultValue={range}
        {...props}
      />
    ),
    triggerIndex,
  })),
  {
    name: 'PeriodPicker',
    render: (props: PresentationProps) => (
      <PeriodPicker label="Test picker" defaultValue={date} {...props} />
    ),
    triggerIndex: 0,
  },
  {
    name: 'ColorPicker',
    render: (props: PresentationProps) => (
      <ColorPicker label="Test picker" defaultValue="#ff0000" {...props} />
    ),
    triggerIndex: 0,
  },
  {
    name: 'ColorInput',
    render: (props: PresentationProps) => (
      <ColorInput label="Test picker" defaultValue="#ff0000" {...props} />
    ),
    triggerIndex: 0,
  },
];
