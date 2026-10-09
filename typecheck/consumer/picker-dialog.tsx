import {
  ColorInput,
  ColorPicker,
  DatePicker,
  DateRangePicker,
  DateRangeSeparatedPicker,
  FilterPicker,
  MonthPicker,
  PeriodPicker,
  Picker,
} from '@cube-dev/ui-kit';
import { parseDate } from '@internationalized/date';

const presentation = {
  dialogType: 'popover',
  dialogMobileType: 'tray',
} as const;
const items = [{ key: 'apple', label: 'Apple', count: 1 }];
const date = parseDate('2026-10-09');

<Picker {...presentation} type="primary" items={items}>
  {(item) => (
    <Picker.Item key={item.key}>
      {item.label} ({item.count})
    </Picker.Item>
  )}
</Picker>;
<FilterPicker {...presentation} type="outline" items={items}>
  {(item) => (
    <FilterPicker.Item key={item.key}>
      {item.label} ({item.count})
    </FilterPicker.Item>
  )}
</FilterPicker>;
<DatePicker
  {...presentation}
  value={date}
  onChange={(value) => value?.add({ days: 1 })}
/>;
<DateRangePicker
  {...presentation}
  value={{ start: date, end: date }}
  onChange={(value) => value?.start.add({ days: 1 })}
/>;
<DateRangeSeparatedPicker
  {...presentation}
  value={{ start: date, end: date }}
  onChange={(value) => value?.end.add({ days: 1 })}
/>;
<PeriodPicker {...presentation} />;
<MonthPicker {...presentation} />;
<ColorPicker
  {...presentation}
  type="primary"
  onChange={(value) => value?.toUpperCase()}
/>;
<ColorInput {...presentation} onChange={(value) => value?.toUpperCase()} />;

// @ts-expect-error Unknown presentations are rejected by the DialogTrigger contract.
<Picker dialogType="sheet" />;
// @ts-expect-error Trigger styling stays independent from overlay presentation.
<ColorPicker type="tray" />;
