import { useObjectRef } from '@react-aria/utils';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
  Styles,
  tasty,
} from '@tenphi/tasty';
import { forwardRef } from 'react';

import { useI18n } from '../../i18n';
import { useProviderProps } from '../../provider';
import {
  LabelPosition,
  NecessityIndicator,
  ValidationProps,
} from '../../shared/index';
import { extractStyles } from '../../utils/styles';

import { getValidationMods } from './validation/index';

const REQUIRED_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    version="1.1"
    x="0px"
    y="0px"
    viewBox="0 0 100 125"
    style={{
      // @ts-ignore
      enableBackground: 'new 0 0 100 100',
      width: '.8em',
      height: '.8em',
      transform: 'rotate(-5deg)',
    }}
  >
    <switch>
      <g>
        <polygon
          fill="currentColor"
          points="97.5,47.5 90.5,26.1 61.3,35.6 61.3,4.8 38.7,4.8 38.7,35.6 9.5,26.1 2.5,47.5 31.8,57 13.7,82 31.9,95.2     50,70.3 68.1,95.2 86.3,82 68.2,57"
        />
      </g>
    </switch>
  </svg>
);

/**
 * The `(required)` / `(optional)` note. Deliberately quieter than the label it
 * follows: it is an aside about the field, not part of its name.
 */
const NecessityLabelElement = tasty({
  as: 'span',
  qa: 'NecessityLabel',
  styles: {
    color: '#dark-03',
    fontWeight: 400,
  },
});

export interface CubeNecessityIndicatorProps {
  /**
   * `'icon'` renders the asterisk, `'label'` the `(required)` / `(optional)`
   * text. Defaults to `'icon'`, which has no optional form and so only ever
   * marks a required field. `null` suppresses the indicator entirely.
   */
  necessityIndicator?: NecessityIndicator | null;
  /**
   * Marks the label as required. Only an `isRequired` authored on the input,
   * the label or the `Form` reaches this — a `required` validation rule drives
   * validation and `aria-required` without decorating the label.
   */
  isRequired?: boolean;
  /**
   * Marks the label as optional. Purely presentational, and ignored when the
   * field is required.
   */
  isOptional?: boolean;
  /**
   * Whether the indicator contributes to the field's accessible name. Off by
   * default because a required field already announces `aria-required`, and
   * repeating it in the name is noise.
   */
  includeNecessityIndicatorInAccessibilityName?: boolean;
}

/**
 * The `*` or `(required)` / `(optional)` marker that follows a field label.
 *
 * Its own component because two places render it and both need the same
 * strings: `Label` when it is given plain text, and `FieldWrapper`, which
 * builds a element tree around the label and therefore has to place the marker
 * beside the label text itself rather than after the whole tree.
 *
 * Both marks are opt-in: nothing renders unless the call site passed
 * `isRequired` or `isOptional`.
 */
export function NecessityIndicatorMark(props: CubeNecessityIndicatorProps) {
  const {
    isRequired,
    isOptional,
    necessityIndicator = 'icon',
    includeNecessityIndicatorInAccessibilityName = false,
  } = props;
  const { t } = useI18n();

  const requiredLabel = t('form.required', '(required)');

  // A plain space would collapse against the label text in a flex container,
  // and the zero-width space keeps the pair from being split across lines.
  const separator = ' ​';

  if (necessityIndicator === null) return null;

  if (isRequired) {
    if (necessityIndicator === 'icon') {
      return (
        <>
          {separator}
          <span
            aria-label={
              includeNecessityIndicatorInAccessibilityName
                ? requiredLabel
                : undefined
            }
          >
            {REQUIRED_ICON}
          </span>
        </>
      );
    }

    // Hidden from screen readers by default, because `aria-required` on the
    // input already announces it and repeating it in the name is noise.
    return (
      <>
        {separator}
        <NecessityLabelElement
          aria-hidden={
            !includeNecessityIndicatorInAccessibilityName ? true : undefined
          }
        >
          {requiredLabel}
        </NecessityLabelElement>
      </>
    );
  }

  // There is no icon form of "optional", so the note is rendered whichever
  // indicator was asked for. Nothing else tells a screen reader the field is
  // optional, so this one stays in the accessible name.
  if (!isOptional) return null;

  return (
    <>
      {separator}
      <NecessityLabelElement>
        {t('form.optional', '(optional)')}
      </NecessityLabelElement>
    </>
  );
}

export const INLINE_LABEL_STYLES: Styles = {
  preset: 't3',
  color: {
    '': '#dark-02',
    invalid: '#danger-text',
  },
} as const;

export const LABEL_STYLES: Styles = {
  display: 'block',
  preset: {
    '': 't3m',
    'size=small': 't4',
  },
  color: {
    '': '#dark',
    invalid: '#danger-text',
  },
  width: {
    '': 'initial',
    side: '($label-width, initial)',
    split: 'initial',
  },
};

const LabelElement = tasty({
  as: 'label',
  qa: 'Label',
  styles: LABEL_STYLES,
});

export interface CubeLabelProps
  extends BaseProps,
    ContainerStyleProps,
    ValidationProps {
  labelPosition?: LabelPosition;
  necessityIndicator?: NecessityIndicator | null;
  isRequired?: boolean;
  isOptional?: boolean;
  includeNecessityIndicatorInAccessibilityName?: boolean;
  htmlFor?: string;
  for?: string;
  size?: 'medium' | 'small';
}

function Label(props: CubeLabelProps, ref) {
  props = useProviderProps<CubeLabelProps>(props);

  const { t } = useI18n();

  let {
    as,
    qa,
    children,
    labelPosition = 'top',
    isRequired,
    isOptional,
    necessityIndicator,
    includeNecessityIndicatorInAccessibilityName = false,
    htmlFor,
    isDisabled,
    isInvalid,
    isValid,
    size = 'medium',
    for: labelFor,
    ...otherProps
  } = props;

  let domRef = useObjectRef(ref);

  const styles = extractStyles(otherProps, CONTAINER_STYLES);

  const mark = (
    <NecessityIndicatorMark
      isRequired={isRequired}
      isOptional={isOptional}
      necessityIndicator={necessityIndicator}
      includeNecessityIndicatorInAccessibilityName={
        includeNecessityIndicatorInAccessibilityName
      }
    />
  );

  return (
    <LabelElement
      {...filterBaseProps(otherProps)}
      ref={domRef}
      styles={styles}
      htmlFor={labelFor || htmlFor}
      data-size={size}
      mods={{
        side: labelPosition === 'side',
        disabled: isDisabled,
        ...getValidationMods({ isInvalid, isValid }),
      }}
    >
      {/*
        A non-string child is a tree the caller laid out \u2014 `FieldWrapper`'s
        full-width `Flex`, for one \u2014 and appending the marker after it would put
        it at the far end of that layout rather than next to the label text. So
        the marker is only appended here for plain-text labels; callers that
        build their own tree place `NecessityIndicatorMark` where it belongs.
      */}
      {typeof children !== 'string' ? (
        children
      ) : (
        <>
          {children}
          {mark}
        </>
      )}
    </LabelElement>
  );
}

let _Label = forwardRef(Label);

_Label.displayName = 'Label';

export { _Label as Label };
