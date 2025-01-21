import { forwardRef } from 'react';

import { Paragraph } from '../../content/Paragraph';
import { tasty } from '../../../tasty/index';
import { TooltipProvider } from '../../overlays/Tooltip/TooltipProvider';
import { Text } from '../../content/Text';
import { wrapNodeIfPlain } from '../../../utils/react/index';
import { Space } from '../../layout/Space';
import { Flex } from '../../layout/Flex';
import { Label } from '../Label';
import { InfoCircleIcon } from '../../../icons/index';

import { CubeFieldWrapperProps } from './types';

const FieldElement = tasty({
  qa: 'Field',
  styles: {
    display: 'grid',
    width: 'auto',
    gridColumns: {
      '': 'minmax(0, 1fr)',
      'has-sider': '@(full-label-width, auto) minmax(0, 1fr)',
    },
    gap: 0,
    placeItems: 'baseline stretch',
    '@full-label-width': '(@label-width + 1x)',

    LabelArea: {
      display: 'block',
      width: {
        '': 'initial',
        'has-sider': '@label-width',
      },
      margin: {
        '': '1x bottom',
        'has-sider': '1x right',
        ':empty': '0',
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

if (process.env.NODE_ENV === 'development') {
  FieldElement.displayName = 'FieldWrapperElement';
}

const MessageElement = tasty({
  qa: 'Field_Message',
  styles: {
    preset: 't3',
    color: {
      '': '#dark-02',
      invalid: '#danger-text',
      valid: '#success-text',
      disabled: '#dark.40',
    },
    textAlign: 'left',
    userSelect: 'none',
  },
});

/**
 * A wrapper for form fields to provide additional decoration for inputs.
 * @internal Do not use this component directly.
 */
export const FieldWrapper = forwardRef(function FieldWrapper(
  props: CubeFieldWrapperProps,
  ref,
) {
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
    children,
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
      aria-label={typeof label === 'string' ? label : undefined}
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
              <InfoCircleIcon
                style={{
                  color: 'var(--purple-text-color)',
                  margin: '0 4px',
                }}
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
    <>
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
      {children}
    </>
  );
});
