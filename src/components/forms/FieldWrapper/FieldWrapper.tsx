import { forwardRef } from 'react';
import { InfoCircleOutlined } from '@ant-design/icons';

import { Paragraph } from '../../content/Paragraph';
import { tasty } from '../../../tasty';
import { TooltipProvider } from '../../overlays/Tooltip/TooltipProvider';
import { Text } from '../../content/Text';
import { wrapNodeIfPlain } from '../../../utils/react';
import { Space } from '../../layout/Space';
import { Flex } from '../../layout/Flex';
import { Label } from '../Label';

import { CubeFieldWrapperProps } from './types';

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
    preset: 't3',
    color: {
      '': '#dark.75',
      invalid: '#danger-text',
      valid: '#success-text',
      disabled: '#dark.40',
    },
    textAlign: 'left',
    userSelect: 'none',
  },
});

/**
 * @internal Do not use this component directly.
 */
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
      <Flex placeContent="baseline space-between" width="100%">
        <Space placeItems="center" gap="0.25x">
          <div>{label}</div>

          {tooltip ? (
            <TooltipProvider
              activeWrap
              title={tooltip}
              width="initial max-content 40x"
            >
              <InfoCircleOutlined
                style={{ color: 'var(--primary-color)', margin: '0 4px' }}
              />
            </TooltipProvider>
          ) : null}

          <div>{labelSuffix}</div>
        </Space>

        {extra && <Text preset="t3">{extra}</Text>}
      </Flex>
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
      ref={ref}
      as={as ?? 'div'}
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
