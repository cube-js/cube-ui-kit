import { forwardRef, ReactNode } from 'react';
import { Text } from '../content/Text';
import { Label } from './Label';
import { Grid } from '../layout/Grid';
import { Paragraph } from '../content/Paragraph';
import {
  LabelPosition,
  NecessityIndicator,
  ValidationState,
} from '../../shared';
import { Props, Styles, tasty } from '../../tasty';
import { TooltipProvider } from '../overlays/Tooltip/TooltipProvider';
import { InfoCircleOutlined } from '@ant-design/icons';
import { wrapNodeIfPlain } from '../../utils/react';
import { Space } from '../layout/Space';

const FieldElement = tasty({
  qa: 'Field',
  styles: {
    display: 'grid',
    gridColumns: {
      '': '1fr',
      'has-sider': '@(label-width, auto) 1fr',
    },
    gap: {
      '': '1x',
      'has-sider': '@(column-gap, 1x)',
    },
    placeItems: 'start stretch',

    LabelArea: {
      display: 'block',
      width: {
        '': 'initial',
        'has-sider': '@label-width',
      },
      padding: {
        '': 'initial',
        'has-sider': '1.25x top',
      },
    },

    InputArea: {
      display: 'block',
      flow: 'column',
      gridColumn: {
        '': 'initial',
        'has-sider': 2,
      },
    },
  },
});

const MessageElement = tasty({
  qa: 'Field_Message',
  styles: {
    preset: 'default',
    color: {
      '': '#dark.75',
      invalid: '#danger-text',
      valid: '#success-text',
      disabled: '#dark.40',
    },
    fontWeight: 400,
    textAlign: 'left',
    userSelect: 'none',
  },
});

export type CubeFieldWrapperProps = {
  as?: string;
  labelPosition?: LabelPosition;
  label?: ReactNode;
  labelSuffix?: ReactNode;
  labelPrefix?: ReactNode;
  labelStyles?: Styles;
  styles?: Styles;
  /** Whether the input is required */
  isRequired?: boolean;
  /** Whether the input is disabled */
  isDisabled?: boolean;
  necessityIndicator?: NecessityIndicator;
  labelProps?: Props;
  fieldProps?: Props;
  /** Custom message for the field. It will be placed below the label and the input */
  message?: string | ReactNode;
  /** Styles for the message */
  messageStyles?: Styles;
  /** The description for the field. It will be placed below the label */
  description?: ReactNode;
  Component?: JSX.Element;
  validationState?: ValidationState;
  requiredMark?: boolean;
  tooltip?: ReactNode;
  extra?: ReactNode;
  isHidden?: boolean;
  necessityLabel?: ReactNode;
};

function FieldWrapper(props: CubeFieldWrapperProps, ref) {
  const {
    as,
    labelPosition = 'top',
    label,
    extra,
    styles,
    isRequired,
    isDisabled,
    labelStyles,
    necessityIndicator,
    labelProps,
    fieldProps,
    message,
    messageStyles,
    description,
    Component,
    validationState,
    requiredMark = true,
    tooltip,
    isHidden,
    labelPrefix,
    labelSuffix,
  } = props;

  const labelComponent = label ? (
    <Label
      as={as === 'label' ? 'div' : 'label'}
      styles={labelStyles}
      labelPosition={labelPosition}
      isRequired={requiredMark ? isRequired : false}
      isDisabled={isDisabled}
      necessityIndicator={necessityIndicator}
      validationState={validationState}
      aria-label={label}
      {...labelProps}
    >
      <Grid placeContent="baseline space-between" flow="column" width="100%">
        <Space placeItems="baseline" gap="0.5x">
          {labelPrefix && <div>{labelPrefix}</div>}
          {label && <div>{label}</div>}
          {tooltip ? (
            <>
              <TooltipProvider
                title={tooltip}
                activeWrap
                width="initial max-content 40x"
              >
                <InfoCircleOutlined style={{ color: 'var(--primary-color)' }} />
              </TooltipProvider>
            </>
          ) : null}
          {labelSuffix && <div>{labelSuffix}</div>}
        </Space>

        {extra && <Text preset="t3">{extra}</Text>}
      </Grid>
    </Label>
  ) : null;

  let descriptionComponent = description ? (
    <div data-element="Description">
      {wrapNodeIfPlain(description, () => (
        <Paragraph>{description}</Paragraph>
      ))}
    </div>
  ) : null;

  const mods = {
    'has-sider': labelPosition === 'side',
    'has-description': !!description,
    invalid: validationState === 'invalid',
    valid: validationState === 'valid',
  };

  return (
    <FieldElement
      as={as || 'div'}
      ref={ref}
      mods={mods}
      isHidden={isHidden}
      styles={styles}
      {...fieldProps}
    >
      {labelComponent || descriptionComponent ? (
        <div data-element="LabelArea">
          {labelComponent}
          {descriptionComponent}
        </div>
      ) : null}
      <div data-element="InputArea">
        {Component}
        {message && !isDisabled && (
          <MessageElement
            mods={mods}
            styles={messageStyles}
            role={validationState === 'invalid' ? 'alert' : undefined}
          >
            {message}
          </MessageElement>
        )}
      </div>
    </FieldElement>
  );
}

/**
 * A wrapper for form fields to provide additional decoration for inputs.
 */
const _FieldWrapper = forwardRef(FieldWrapper);
export { _FieldWrapper as FieldWrapper };
