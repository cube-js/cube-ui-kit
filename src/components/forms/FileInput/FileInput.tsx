import {
  forwardRef,
  RefObject,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useProviderProps } from '../../../provider';
import { Action } from '../../actions/Action';
import { Styles } from '../../../styles/types';
import { BaseProps, BlockStyleProps, PositionStyleProps } from '../../types';
import { AriaTextFieldProps } from '@react-types/textfield';
import { FormFieldProps } from '../../../shared';
import { createFocusableRef } from '@react-spectrum/utils';
import { FieldWrapper } from '../FieldWrapper';
import { extractStyles } from '../../../utils/styles';
import { CONTAINER_STYLES } from '../../../styles/list';
import { useContextStyles } from '../../../providers/StylesProvider';

const DEFAULT_WRAPPER_STYLES: Styles = {
  display: 'inline-flex',
  position: 'relative',
  preset: 't3',
  padding: '.75x 1x',
  gap: '1x',
  flow: 'row',
  placeItems: 'center start',
  fill: '#white',
  border: true,
  radius: true,
  cursor: 'pointer',
  overflow: 'hidden',
  '[Button]': {
    radius: 'round',
    fill: {
      '': '#light',
      'hovered | focused | pressed': '#purple-04',
      disabled: '#light',
    },
    color: '#dark',
    padding: '.5x 1x',
    transition: 'fill',
  },
  '[Placeholder]': {
    color: '#dark-02',
  },
  '[Input]': {
    position: 'absolute',
    top: '-50px',
    right: 0,
    bottom: 0,
    left: 0,
    radius: '@content-radius',
    // opacity: 0,
    cursor: 'pointer',
    zIndex: 10,
  },
};

export interface CubeFileInputProps
  extends BaseProps,
    PositionStyleProps,
    BlockStyleProps,
    AriaTextFieldProps,
    FormFieldProps {
  size?: 'small' | 'default' | 'large' | string;
  /** The input ref */
  inputRef?: RefObject<HTMLInputElement>;
  /** Style map for the input */
  inputStyles?: Styles;
}

function FileInput(props: CubeFileInputProps, ref) {
  let {
    id,
    name,
    qa,
    qaVal,
    onChange,
    placeholder,
    inputRef,
    label,
    labelPosition,
    insideForm,
    isRequired,
    necessityIndicator,
    necessityLabel,
    labelStyles,
    labelProps,
    isDisabled,
    validationState,
    message,
    requiredMark,
    styles,
    inputStyles,
    ...otherProps
  } = useProviderProps(props);
  const [value, setValue] = useState();
  let domRef = useRef(null);
  let defaultInputRef = useRef(null);
  inputRef = inputRef || defaultInputRef;

  styles = extractStyles(otherProps, CONTAINER_STYLES);

  inputStyles = {
    ...DEFAULT_WRAPPER_STYLES,
    ...useContextStyles('FileInput', otherProps),
    ...inputStyles,
  };

  const onLocalChange = useCallback(
    (event) => {
      const value = event.target.value;

      onChange?.(value);

      setValue(value);
    },
    [onChange],
  );

  // Expose imperative interface for ref
  useImperativeHandle(ref, () => ({
    ...createFocusableRef(domRef, inputRef),
    select() {
      if (inputRef?.current) {
        inputRef.current.select();
      }
    },
    getInputElement() {
      return inputRef?.current;
    },
  }));

  const fileInput = (
    <Action
      qa={qa || 'FileInput'}
      styles={inputStyles}
      isDisabled={isDisabled}
      ref={domRef}
      mods={{
        selected: !!value,
      }}
    >
      <input
        id={id}
        name={name}
        ref={inputRef}
        onChange={onLocalChange}
        data-element="Input"
        type="file"
        tabIndex={-1}
      />
      <div data-element="Button">Choose file</div>
      <div data-element="Placeholder">
        {value || placeholder || 'No file selected'}
      </div>
    </Action>
  );

  return (
    <FieldWrapper
      {...{
        labelPosition,
        label,
        insideForm,
        styles,
        isRequired,
        labelStyles,
        necessityIndicator,
        necessityLabel,
        labelProps,
        isDisabled,
        validationState,
        message,
        requiredMark,
        Component: fileInput,
        ref: domRef,
      }}
    />
  );
}

/**
 * FileInputs are file inputs that allow users to select local files to
 * upload them to the server.
 */
const _FileInput = forwardRef(FileInput);
export { _FileInput as FileInput };
