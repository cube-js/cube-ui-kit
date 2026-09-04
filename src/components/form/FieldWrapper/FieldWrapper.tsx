import { tasty } from '@tenphi/tasty';
import { forwardRef } from 'react';

import { useI18n } from '../../../i18n';
import { isDevEnv } from '../../../utils/is-dev-env';
import { mergeProps, wrapNodeIfPlain } from '../../../utils/react/index';
import { InfoBadge } from '../../content/InfoBadge';
import { Text } from '../../content/Text';
import { Flex } from '../../layout/Flex';
import { Space } from '../../layout/Space';
import { Label, NecessityIndicatorMark } from '../Label';
import { getValidationMods } from '../validation/index';

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

if (isDevEnv()) {
  FieldElement.displayName = 'FieldWrapperElement';
}

const MessageElement = tasty({
  qa: 'FieldMessage',
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
  qa: 'FieldDescription',
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
    isOptional,
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
    isInvalid,
    isValid,
    requiredMark = true,
    tooltip,
    isHidden,
    labelSuffix,
    children,
  } = props;

  const { t } = useI18n();

  // `requiredMark={false}` drops the required marker, but the field is still
  // required — so the optional note has to keep losing to it rather than
  // stepping into the gap and labelling a required field optional.
  const showRequiredMark = !!requiredMark && !!isRequired;
  const showOptionalNote = !isRequired && !!isOptional;

  // The `aria-label` below is what the input is named by, so it shadows the
  // label's own content — including the `(optional)` note, which is the only
  // thing saying the field is optional. A required field needs no such help:
  // `aria-required` on the input already announces it.
  const optionalNote = showOptionalNote
    ? t('form.optional', '(optional)')
    : null;

  const labelComponent = label ? (
    <Label
      as={as === 'label' ? 'div' : 'label'}
      styles={labelStyles}
      labelPosition={labelPosition}
      isRequired={showRequiredMark}
      isOptional={showOptionalNote}
      isDisabled={isDisabled}
      necessityIndicator={necessityIndicator}
      isInvalid={isInvalid}
      isValid={isValid}
      aria-label={
        typeof label === 'string'
          ? optionalNote
            ? `${label} ${optionalNote}`
            : label
          : undefined
      }
      {...labelProps}
    >
      <Flex placeContent="baseline space-between" width="100%">
        <Space placeItems="center" gap="0.75x">
          <div>
            {label}
            {/*
              `Label` can only append the marker itself when its child is plain
              text, and the tree below is not — so it is placed here, against
              the label text, rather than after the full-width `Flex`.
            */}
            <NecessityIndicatorMark
              isRequired={showRequiredMark}
              isOptional={showOptionalNote}
              necessityIndicator={necessityIndicator}
            />
          </div>

          {tooltip ? <InfoBadge tooltip={tooltip} /> : null}

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
    ...getValidationMods({ isInvalid, isValid }),
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
                // Force invalid state for errorMessage regardless of the validation state
                invalid: isErrorMessage || !!isInvalid,
              }}
              styles={messageStyles}
              role={isErrorMessage || isInvalid ? 'alert' : undefined}
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
