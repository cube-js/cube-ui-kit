import { forwardRef, ReactElement, useRef } from 'react';
import { AriaDatePickerProps, DateValue } from '@react-types/datepicker';
import { FocusableRef } from '@react-types/shared';
import { useDatePicker } from '@react-aria/datepicker';
import { useDatePickerState } from '@react-stately/datepicker';
import { CalendarOutlined } from '@ant-design/icons';

import { useProviderProps } from '../../../provider';
import { wrapWithField } from '../wrapper';
import {
  BaseProps,
  BlockStyleProps,
  DimensionStyleProps,
  PositionStyleProps,
  Styles,
} from '../../../tasty';
import { FieldBaseProps, ValidationState } from '../../../shared';
import { mergeProps } from '../../../utils/react';
import { useFieldProps, useFormProps } from '../Form';
import { Space } from '../../layout/Space';
import { Block } from '../../Block';
import { Dialog, DialogTrigger } from '../../overlays/Dialog';
import { Button } from '../../actions';
import { Calendar } from '../../other/Calendar/Calendar';

import { DateInput } from './DateInput';

export interface CubeDatePickerProps<T extends DateValue = DateValue>
  extends AriaDatePickerProps<T>,
    BaseProps,
    PositionStyleProps,
    DimensionStyleProps,
    BlockStyleProps,
    FieldBaseProps {
  wrapperStyles?: Styles;
  inputStyles?: Styles;
  styles?: Styles;
  size?: 'small' | 'medium' | 'large' | (string & {});
  validationState?: ValidationState;
}

function DatePicker<T extends DateValue>(
  props: CubeDatePickerProps<T>,
  ref: FocusableRef<HTMLElement>,
) {
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onBlur',
  });

  let state = useDatePickerState(props);
  let domRef = useRef(null);
  let {
    groupProps,
    labelProps,
    fieldProps,
    buttonProps,
    dialogProps,
    calendarProps,
  } = useDatePicker(props, state, domRef);

  const component = (
    <Block>
      <Space gap=".5x">
        <DateInput {...fieldProps} />
        <Button {...buttonProps}>
          <CalendarOutlined />
        </Button>
      </Space>
      {state.isOpen && (
        <DialogTrigger state={state} triggerRef={ref} placement="bottom">
          <Dialog {...dialogProps}>
            <Calendar {...calendarProps} />
          </Dialog>
        </DialogTrigger>
      )}
    </Block>
  );

  return wrapWithField(component, domRef, {
    ...props,
    ...mergeProps(props.labelProps, labelProps),
    fieldProps: groupProps,
  });
}

const _DatePicker = forwardRef(DatePicker) as <T extends DateValue>(
  props: CubeDatePickerProps<T> & { ref?: FocusableRef<HTMLElement> },
) => ReactElement;
export { _DatePicker as DatePicker };
