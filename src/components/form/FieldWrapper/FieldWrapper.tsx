import { tasty } from '@tenphi/tasty';
import { forwardRef } from 'react';
import { VisuallyHidden } from 'react-aria';

import { useI18n } from '../../../i18n';
import { isDevEnv } from '../../../utils/is-dev-env';
import { mergeProps, wrapNodeIfPlain } from '../../../utils/react/index';
import { InfoBadge } from '../../content/InfoBadge';
import { Text } from '../../content/Text';
import { Flex } from '../../layout/Flex';
import { Space } from '../../layout/Space';
import { hasFieldContent } from '../field-chrome';
import { Label, NecessityIndicatorMark } from '../Label';
import { warnAboutLegacyTooltip } from '../legacy-tooltip';
import { getValidationMods } from '../validation/index';

import {
  getFieldDescriptionId,
  getFieldMessageId,
  useFieldTextId,
} from './field-description';
import { CubeFieldWrapperProps } from './types';

import type { Props } from '../../../props';

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
    // A sized field that its row stretches keeps its rows packed at the top,
    // so its input stays under its label, level with its neighbours'. Under
    // `fill-height` the input's `1sf` row takes the height anyway. A split
    // field has one row, which `space-between` never stretches.
    placeContent: {
      '': 'initial',
      'fill-width | fill-height': 'start normal',
      'has-split': 'space-between',
    },
    // An input's style props that size the field set `fill-width` /
    // `fill-height` (`splitFieldLayout`). Under `fill-height` the input's row
    // takes what the label and texts leave; the last explicit row is the
    // input's, beside a side or split label and under a top one.
    gridRows: {
      '': false,
      'fill-height': 'max-content 1sf',
      'fill-height & (has-sider | has-split)': '1sf',
    },
    // A field that grows in a flex column can shrink below its content. A
    // caller's `height` replaces the whole value, minimum included; the style
    // props pass `blockSize` as `height`.
    height: { '': false, 'fill-height': 'min 0' },
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

    // Sized, the input area is a one-column grid, so the input is a grid item
    // and its own CSS decides: an `auto` size stretches to the field, a fixed
    // or capped one stays. Unsized, it is a block and the input keeps its
    // natural size, as before.
    InputArea: {
      display: {
        '': 'block',
        'fill-width | fill-height': 'grid',
      },
      flow: {
        '': 'column',
        'fill-width | fill-height': 'row',
      },
      gap: '.5x',
      gridColumns: { '': false, 'fill-width | fill-height': '1sf' },
      gridRows: { '': false, 'fill-height': '1sf' },
      gridAutoRows: { '': false, 'fill-height': 'max-content' },
      gridColumn: {
        '': 'initial',
        'has-sider': 2,
        'has-split': 2,
      },
      gridRow: { '': false, 'fill-height': -2 },
      // Not `alignSelf: stretch`: the area stays in the baseline group, so a
      // side label keeps its baseline and a split label stays centred.
      height: { '': false, 'fill-height': '100%' },
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
 * A flex box, not a block: in a block an inline-level suffix such as a `Badge`
 * or a `Tag` sits in a line box whose strut adds a pixel under it, so the label
 * row grew from 20px to 21px and its field stepped down out of line. Only a
 * single element is a direct flex item; mixed content is wrapped in a `<span>`,
 * because a flex box drops the whitespace between its items.
 */
const LabelSuffixElement = tasty({
  styles: {
    display: 'flex',
    placeItems: 'center',
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
    isBare = false,
    extra,
    styles,
    isRequired,
    isOptional,
    isDisabled,
    labelStyles,
    necessityIndicator,
    labelProps,
    labelRef,
    fieldProps,
    message,
    messageStyles,
    description,
    errorMessage,
    Component,
    controlId,
    isInvalid,
    isValid,
    requiredMark = true,
    labelTooltip,
    isHidden,
    labelSuffix,
    children,
  } = props;

  const { t } = useI18n();

  warnAboutLegacyTooltip(props);

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

  const hasLabel = hasFieldContent(label);
  const labelComponent = hasLabel ? (
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
      // Before `labelProps`, so a `ref` passed there still wins.
      ref={labelRef}
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

          {labelTooltip ? <InfoBadge tooltip={labelTooltip} /> : null}

          {labelSuffix ? (
            <LabelSuffixElement>
              {wrapNodeIfPlain(labelSuffix, () => (
                <span>{labelSuffix}</span>
              ))}
            </LabelSuffixElement>
          ) : null}
        </Space>

        {extra && <Text preset="t3">{extra}</Text>}
      </Flex>
    </Label>
  ) : null;

  const displayMessage = errorMessage !== undefined ? errorMessage : message;
  const isErrorMessage = errorMessage !== undefined;
  const isMessageShown =
    !isBare && !isDisabled && hasFieldContent(displayMessage);

  // An id only on what is actually rendered, registered for the control's
  // `aria-describedby` — see `useFieldDescribedBy`.
  const descriptionId =
    controlId && !isBare && hasFieldContent(description)
      ? getFieldDescriptionId(controlId)
      : undefined;
  const messageId =
    controlId && isMessageShown ? getFieldMessageId(controlId) : undefined;

  useFieldTextId(descriptionId);
  useFieldTextId(messageId);

  if (isBare) {
    return (
      <>
        {hasLabel ? (
          <VisuallyHidden>
            <Label ref={labelRef} {...labelProps}>
              {label}
              {optionalNote ? <> {optionalNote}</> : null}
            </Label>
          </VisuallyHidden>
        ) : null}
        {Component}
        {children}
      </>
    );
  }

  // Create description component with proper styling
  const createDescriptionComponent = () => {
    if (!hasFieldContent(description)) return null;

    return (
      <DescriptionElement id={descriptionId} data-element="Description">
        {wrapNodeIfPlain(description, () => (
          <span>{description}</span>
        ))}
      </DescriptionElement>
    );
  };

  // A side or split label carries the description in its column. Without a
  // label, that column is empty and the description would read as the label,
  // so it goes under the input.
  const isDescriptionBesideInput =
    hasLabel && (labelPosition === 'side' || labelPosition === 'split');
  const descriptionForLabel = isDescriptionBesideInput
    ? createDescriptionComponent()
    : null;
  const descriptionForInput = !isDescriptionBesideInput
    ? createDescriptionComponent()
    : null;

  const mods = {
    'has-sider': hasLabel && labelPosition === 'side',
    'has-split': hasLabel && labelPosition === 'split',
    'has-description': hasFieldContent(description),
    ...getValidationMods({ isInvalid, isValid }),
  };

  // Merge fieldProps with styles to ensure both are applied
  const mergedFieldProps: Props | undefined = styles
    ? mergeProps(fieldProps, { styles })
    : fieldProps;
  // Mods merge key by key: a caller's `fieldProps.mods` (or the fill mods an
  // input's style props set) adds to the computed ones instead of replacing
  // `has-sider` and the validation state.
  const { mods: fieldMods, ...otherFieldProps } = mergedFieldProps ?? {};

  return (
    <>
      <FieldElement
        ref={ref}
        as={as ?? 'div'}
        isHidden={isHidden}
        {...otherFieldProps}
        mods={fieldMods ? { ...mods, ...fieldMods } : mods}
      >
        {labelComponent ? (
          <div data-element="LabelArea">
            {labelComponent}
            {descriptionForLabel}
          </div>
        ) : null}
        <div data-element="InputArea">
          {Component}
          {descriptionForInput}
          {isMessageShown && (
            <MessageElement
              id={messageId}
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
