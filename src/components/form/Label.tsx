import { useDOMRef } from '@react-spectrum/utils';
import { forwardRef } from 'react';

import { useProviderProps } from '../../provider';
import {
  LabelPosition,
  NecessityIndicator,
  ValidationState,
} from '../../shared/index';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  filterBaseProps,
  Styles,
  tasty,
} from '../../tasty/index';

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

const INTL_MESSAGES = {
  '(required)': '(required)',
  '(optional)': '(optional)',
};

export const INLINE_LABEL_STYLES: Styles = {
  preset: 't3',
  color: {
    '': '#dark-02',
    invalid: '#danger-text',
  },
  whiteSpace: 'nowrap',
} as const;

export const LABEL_STYLES: Styles = {
  display: 'block',
  preset: 'h6',
  color: {
    '': '#dark',
    invalid: '#danger-text',
  },
  whiteSpace: 'nowrap',
  width: {
    '': 'initial',
    side: '@(label-width, initial)',
  },
};

const LabelElement = tasty({
  as: 'label',
  qa: 'Label',
  styles: LABEL_STYLES,
});

export interface CubeLabelProps extends BaseProps, ContainerStyleProps {
  labelPosition?: LabelPosition;
  necessityIndicator?: NecessityIndicator;
  isRequired?: boolean;
  includeNecessityIndicatorInAccessibilityName?: boolean;
  htmlFor?: string;
  for?: string;
  validationState?: ValidationState;
}

function Label(props: CubeLabelProps, ref) {
  props = useProviderProps<CubeLabelProps>(props);

  let {
    as,
    qa,
    children,
    labelPosition = 'top',
    isRequired,
    necessityIndicator = isRequired != null ? 'icon' : null,
    includeNecessityIndicatorInAccessibilityName = false,
    htmlFor,
    isDisabled,
    validationState,
    for: labelFor,
    ...otherProps
  } = props;

  let domRef = useDOMRef(ref);

  const styles = extractStyles(otherProps, CONTAINER_STYLES);

  let formatMessage = (message) => INTL_MESSAGES[message];
  let necessityLabel = isRequired
    ? formatMessage('(required)')
    : formatMessage('(optional)');
  let icon = (
    <span
      aria-label={
        includeNecessityIndicatorInAccessibilityName
          ? formatMessage('(required)')
          : undefined
      }
    >
      {REQUIRED_ICON}
    </span>
  );

  return (
    <LabelElement
      {...filterBaseProps(otherProps)}
      ref={domRef}
      styles={styles}
      htmlFor={labelFor || htmlFor}
      mods={{
        side: labelPosition === 'side',
        disabled: isDisabled,
        invalid: validationState === 'invalid',
        valid: validationState === 'valid',
      }}
    >
      {typeof children !== 'string' ? (
        children
      ) : (
        <>
          {children}
          {(necessityIndicator === 'label' ||
            (necessityIndicator === 'icon' && isRequired)) &&
            ' \u200b'}
          {/* necessityLabel is hidden to screen readers if the field is required because
           * aria-required is set on the field in that case. That will already be announced,
           * so no need to duplicate it here. If optional, we do want it to be announced here. */}
          {necessityIndicator === 'label' && (
            <span
              aria-hidden={
                !includeNecessityIndicatorInAccessibilityName
                  ? isRequired
                  : undefined
              }
            >
              {necessityLabel}
            </span>
          )}
          {necessityIndicator === 'icon' && isRequired && icon}
        </>
      )}
    </LabelElement>
  );
}

let _Label = forwardRef(Label);

_Label.displayName = 'Label';

export { _Label as Label };
