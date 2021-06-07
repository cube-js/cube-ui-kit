import { useDOMRef } from '@react-spectrum/utils';
import React from 'react';
import { useProviderProps } from '../provider';
import { extractStyles } from '../utils/styles';
import { CONTAINER_STYLES } from '../styles/list';
import { Base } from './Base';
import { useContextStyles } from '../providers/Styles';
import { filterBaseProps } from '../utils/filterBaseProps';

const INTL_MESSAGES = {
  '(required)': '(required)',
  '(optional)': '(optional)',
};

export const INLINE_LABEL_STYLES = {
  fontWeight: 400,
  size: 'md',
  color: {
    '': '#dark.85',
    invalid: '#danger-text',
    disabled: '#dark.30',
  },
  whiteSpace: 'nowrap',
};

export const LABEL_STYLES = {
  fontWeight: 600,
  size: 'md',
  padding: {
    '': '1x 0 0 0',
    side: '(1x - 1bw) 0',
  },
  color: {
    '': '#dark',
    invalid: '#danger-text',
    disabled: '#dark.30',
  },
  whiteSpace: 'nowrap',
};

function Label(props, ref) {
  props = useProviderProps(props);

  let {
    as,
    qa,
    children,
    labelPosition = 'top',
    labelAlign = labelPosition === 'side' ? 'start' : null,
    isRequired,
    necessityIndicator = isRequired != null ? 'icon' : null,
    includeNecessityIndicatorInAccessibilityName = false,
    htmlFor,
    for: labelFor,
    onClick,
    ...otherProps
  } = props;

  let domRef = useDOMRef(ref);

  const contextStyles = useContextStyles('Label', otherProps);

  const styles = extractStyles(otherProps, CONTAINER_STYLES, {
    ...LABEL_STYLES,
    ...contextStyles,
  });

  let formatMessage = (message) => INTL_MESSAGES[message];
  let necessityLabel = isRequired
    ? formatMessage('(required)')
    : formatMessage('(optional)');
  let icon = (
    <div
      aria-label={
        includeNecessityIndicatorInAccessibilityName
          ? formatMessage('(required)')
          : undefined
      }
    >
      *
    </div>
  );

  return (
    <Base
      as={as || 'label'}
      qa={qa || 'Label'}
      {...filterBaseProps(otherProps)}
      onClick={onClick}
      ref={domRef}
      styles={styles}
      htmlFor={labelFor || htmlFor}
      data-is-side={labelPosition === 'left' ? '' : null}
    >
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
    </Base>
  );
}

let _Label = React.forwardRef(Label);
export { _Label as Label };
