import React from 'react';
import { useDOMRef } from '@react-spectrum/utils';
import { Label, LABEL_STYLES } from '../../components/Label';
import { Provider, useProviderProps } from '../../provider';
import { useRadioGroup } from '@react-aria/radio';
import { useRadioGroupState } from '@react-stately/radio';
import { useFormProps } from '../Form/Form';
import { RadioContext } from './context';
import { extractStyles } from '../../utils/styles';
import { BLOCK_STYLES, OUTER_STYLES } from '../../styles/list';
import { Base } from '../../components/Base';
import { modAttrs } from '../../utils/react/modAttrs';
import { useContextStyles } from '../../providers/Styles';

const STYLES = {
  display: 'grid',
  columns: {
    '': '1fr',
    'has-sider': 'max-content 1fr',
  },
  gap: {
    '': '0',
    'has-sider': '1x',
  },
  items: 'baseline start',
};

const GROUP_STYLES = {
  display: 'grid',
  flow: {
    '': 'row',
    horizontal: 'column',
  },
  gap: {
    '': '1x',
    horizontal: '2x',
  },
  padding: '(1x - 1bw) 0',
};

function RadioGroup(props, ref) {
  props = useProviderProps(props);
  props = useFormProps(props);

  let {
    isDisabled,
    isEmphasized,
    isRequired,
    necessityIndicator,
    label,
    labelPosition = 'top',
    labelAlign,
    validationState,
    children,
    orientation = 'vertical',
    labelStyles,
    ...otherProps
  } = props;
  let domRef = useDOMRef(ref);

  let wrapperContextStyles = useContextStyles('RadioGroup_Wrapper', props);
  let groupContextStyles = useContextStyles('RadioGroup', props);
  let labelContextStyles = useContextStyles('RadioGroup_Label', props);

  let styles = extractStyles(otherProps, OUTER_STYLES, {
    ...STYLES,
    ...wrapperContextStyles,
  });
  let groupStyles = extractStyles(otherProps, BLOCK_STYLES, {
    ...GROUP_STYLES,
    ...groupContextStyles,
  });

  labelStyles = {
    ...LABEL_STYLES,
    ...labelContextStyles,
    ...labelStyles,
  };

  let state = useRadioGroupState(props);
  let { radioGroupProps, labelProps } = useRadioGroup(props, state);

  return (
    <Base
      qa="RadioGroup_Wrapper"
      styles={styles}
      {...radioGroupProps}
      {...modAttrs({
        'has-sider': labelPosition === 'side',
      })}
      ref={domRef}
    >
      <Provider
        isDisabled={isDisabled}
        validationState={validationState}
        isEmphasized={isEmphasized}
        isRequired={isRequired}
      >
        {label && (
          <Label
            qa="RadioGroup_Label"
            {...labelProps}
            as="span"
            labelPosition={labelPosition}
            labelAlign={labelAlign}
            isRequired={isRequired}
            necessityIndicator={necessityIndicator}
            styles={labelStyles}
            {...modAttrs({
              disabled: isDisabled,
              invalid: validationState === 'invalid',
              valid: (validationState = 'valid'),
            })}
          >
            {label}
          </Label>
        )}
        <Base
          qa="RadioGroup"
          styles={groupStyles}
          {...modAttrs({
            horizontal: orientation === 'horizontal',
          })}
        >
          <RadioContext.Provider
            value={{
              isRequired,
              state,
            }}
          >
            {children}
          </RadioContext.Provider>
        </Base>
      </Provider>
    </Base>
  );
}

/**
 * Radio groups allow users to select a single option from a list of mutually exclusive options.
 * All possible options are exposed up front for users to compare.
 */
const _RadioGroup = React.forwardRef(RadioGroup);
export { _RadioGroup as RadioGroup };
