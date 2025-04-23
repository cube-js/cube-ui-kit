import { useRef } from 'react';
import { DateValue, useDateSegment } from 'react-aria';
import { DateFieldState, DateSegment } from 'react-stately';

import { tasty } from '../../../tasty';

import { DateFieldBase } from './types';

interface DatePickerSegmentProps extends DateFieldBase<DateValue> {
  segment: DateSegment;
  state: DateFieldState;
}

interface LiteralSegmentProps {
  segment: DateSegment;
}

const LiteralSegmentElement = tasty({
  qa: 'LiteralSegment',
  as: 'span',
  'aria-hidden': 'true',
  styles: {},
});

const EditableSegmentElement = tasty({
  qa: 'EditableSegment',
  styles: {
    padding: '0 1bw',
    fontVariantNumeric: 'tabular-nums lining-nums',
    textAlign: 'right',
    font: 'monospace',
    color: {
      '': 'inherit',
      ':focus': '#white',
    },
    fill: {
      '': '#clear',
      ':focus': '#purple',
    },
    radius: '.25x',

    Placeholder: {
      opacity: '#disabled-opacity',
    },
  },
});

export function DatePickerSegment({
  segment,
  state,
  ...otherProps
}: DatePickerSegmentProps) {
  switch (segment.type) {
    // A separator, e.g. punctuation
    case 'literal':
      return <LiteralSegment segment={segment} />;

    // Editable segment
    default:
      return (
        <EditableSegment segment={segment} state={state} {...otherProps} />
      );
  }
}

function LiteralSegment({ segment }: LiteralSegmentProps) {
  return (
    <LiteralSegmentElement
      data-type={segment.type === 'literal' ? undefined : segment.type}
    >
      {segment.text}
    </LiteralSegmentElement>
  );
}

function EditableSegment({ segment, state }: DatePickerSegmentProps) {
  let ref = useRef(null);
  let { segmentProps } = useDateSegment(segment, state, ref);
  return (
    <EditableSegmentElement
      {...segmentProps}
      ref={ref}
      mods={{
        placeholder: segment.isPlaceholder,
        'read-only': !segment.isEditable,
      }}
      style={{
        ...segmentProps.style,
        minWidth:
          segment.maxValue != null
            ? `calc(${String(segment.maxValue).length + 'ch'})`
            : undefined,
      }}
      data-testid={segment.type}
    >
      {segment.isPlaceholder ? (
        <span data-element="Placeholder" aria-hidden="true">
          {segment.placeholder}
        </span>
      ) : (
        segment.text
      )}
    </EditableSegmentElement>
  );
}
