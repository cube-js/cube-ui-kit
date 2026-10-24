import { tasty } from '@tenphi/tasty';
import { useRef } from 'react';
import { DateValue, useDateSegment } from 'react-aria';
import { DateFieldState, DateSegment } from 'react-stately';

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
    // Keeps neighbouring segments a device pixel apart.
    '$segment-inset': '1px',
    padding: '0 $segment-inset',
    fontVariantNumeric: 'tabular-nums lining-nums',
    textAlign: 'right',
    font: 'monospace',
    border: 0,
    outline: 0,
    color: {
      '': 'inherit',
      ':focus': '#white',
    },
    fill: {
      '': '#clear',
      ':focus': '#primary',
    },
    radius: '.25x',
    // Fits the segment's longest value, so typing doesn't resize it.
    minWidth: '$segment-min-width',

    Placeholder: {
      opacity: '$disabled-opacity',
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
  let {
    segmentProps: { style: segmentStyle, ...segmentProps },
  } = useDateSegment(segment, state, ref);
  return (
    <EditableSegmentElement
      {...segmentProps}
      ref={ref}
      mods={{
        placeholder: segment.isPlaceholder,
        'read-only': !segment.isEditable,
      }}
      tokens={
        segment.maxValue != null
          ? { '$segment-min-width': `${String(segment.maxValue).length}ch` }
          : undefined
      }
      // oxlint-disable-next-line react/forbid-component-props, tasty/no-style-prop -- React Aria's `useDateSegment` supplies the segment's style (caret and bidi)
      style={segmentStyle}
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
