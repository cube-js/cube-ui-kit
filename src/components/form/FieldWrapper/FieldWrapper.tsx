import { forwardRef } from 'react';

import { InfoCircleIcon } from '../../../icons/index';
import { tasty } from '../../../tasty/index';
import { mergeProps, wrapNodeIfPlain } from '../../../utils/react/index';
import { Text } from '../../content/Text';
import { Flex } from '../../layout/Flex';
import { Space } from '../../layout/Space';
import { TooltipProvider } from '../../overlays/Tooltip/TooltipProvider';
import { Label } from '../Label';

import { CubeFieldWrapperProps } from './types';

const FieldElement = tasty({
  qa: 'Field',
  styles: {
    display: 'grid',
    width: 'auto',
    gridColumns: {
      '': 'minmax(0, 1fr)',
      'has-sider': '($full-label-width, auto) minmax(0, 1fr)',
      'has-split': 'auto auto',
    },
    gap: 0,
    placeItems: {
      '': 'baseline stretch',
      'has-split': 'center',
    },
    placeContent: {
      '': 'initial',
      'has-split': 'space-between',
    },
    '$full-label-width': '($label-width + 1x)',

    LabelArea: {
      display: 'block',
      width: {
        '': 'initial',
        'has-sider': '$label-width',
      },
      margin: {
        '': '1x bottom',
        'has-sider': '1x right',
        'has-split': '1x right',
        ':empty': '0',
      },
    },

    InputArea: {
      display: 'block',
      flow: 'column',
      gap: '.5x',
      gridColumn: {
        '': 'initial',
        'has-sider': 2,
        'has-split': 2,
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
    preset: 't4',
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

const DescriptionElement = tasty({
  qa: 'Field_Description',
  styles: {
    preset: 't4',
    color: '#dark-03',
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
    errorMessage,
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
        <Space placeItems="center" gap="0.75x">
          <div>{label}</div>

          {tooltip ? (
            <TooltipProvider
              activeWrap
              title={tooltip}
              width="initial max-content 40x"
            >
              <InfoCircleIcon color="#purple-text" />
            </TooltipProvider>
          ) : null}

          {labelSuffix ? <div>{labelSuffix}</div> : null}
        </Space>

        {extra && <Text preset="t3">{extra}</Text>}
      </Flex>
    </Label>
  ) : null;

  // Create description component with proper styling
  const createDescriptionComponent = () => {
    if (!description) return null;

    return (
      <DescriptionElement data-element="Description">
        {wrapNodeIfPlain(description, () => (
          <span>{description}</span>
        ))}
      </DescriptionElement>
    );
  };

  // Description positioning based on label position
  const descriptionForLabel =
    labelPosition === 'side' || labelPosition === 'split'
      ? createDescriptionComponent()
      : null;
  const descriptionForInput =
    labelPosition === 'top' ? createDescriptionComponent() : null;

  const mods = {
    'has-sider': labelPosition === 'side',
    'has-split': labelPosition === 'split',
    'has-description': !!description,
    invalid: validationState === 'invalid',
    valid: validationState === 'valid',
  };

  // Determine which message to display (errorMessage takes precedence, then message for backward compatibility)
  const displayMessage = errorMessage || message;
  const isErrorMessage = !!errorMessage;

  // Merge fieldProps with styles to ensure both are applied
  const mergedFieldProps = styles
    ? mergeProps(fieldProps, { styles })
    : fieldProps;

  return (
    <>
      <FieldElement
        ref={ref}
        as={as ?? 'div'}
        mods={mods}
        isHidden={isHidden}
        {...mergedFieldProps}
      >
        {labelComponent || descriptionForLabel ? (
          <div data-element="LabelArea">
            {labelComponent}
            {descriptionForLabel}
          </div>
        ) : null}
        <div data-element="InputArea">
          {Component}
          {descriptionForInput}
          {displayMessage && !isDisabled && (
            <MessageElement
              mods={{
                ...mods,
                // Force invalid state for errorMessage regardless of validationState
                invalid: isErrorMessage || validationState === 'invalid',
              }}
              styles={messageStyles}
              role={
                isErrorMessage || validationState === 'invalid'
                  ? 'alert'
                  : undefined
              }
            >
              {displayMessage}
            </MessageElement>
          )}
        </div>
      </FieldElement>
      {children}
    </>
  );
});
