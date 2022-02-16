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
  fill: {
    '': '#white',
    'drag-hover': '#purple.16',
  },
  border: true,
  radius: true,
  cursor: 'pointer',
  overflow: 'hidden',

  Button: {
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

  Placeholder: {
    color: '#dark-02',
  },

  Value: {
    color: '#dark-02',
  },

  Input: {
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
  /**
   * The type of the input
   * @default 'file'
   */
  type?: 'file' | 'text';
}

function extractContents(element, callback) {
  const files = element?.files;

  if (files && files.length > 0) {
    const fileReader = new FileReader();

    fileReader.onload = function() {
      callback(fileReader.result);
    };

    fileReader.readAsText(files[0]);
  }
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
    isRequired,
    necessityIndicator,
    necessityLabel,
    labelStyles,
    labelProps,
    isDisabled,
    validationState,
    message,
    description,
    requiredMark,
    tooltip,
    inputStyles,
    type = 'file',
    ...otherProps
  } = useProviderProps(props);
  const [value, setValue] = useState();
  const [dragHover, setDragHover] = useState(false);
  let domRef = useRef(null);
  let defaultInputRef = useRef(null);
  inputRef = inputRef || defaultInputRef;

  let styles = extractStyles(otherProps, CONTAINER_STYLES);

  inputStyles = {
    ...DEFAULT_WRAPPER_STYLES,
    ...useContextStyles('FileInput', otherProps),
    ...inputStyles,
  };

  const onLocalChange = useCallback(
    (event) => {
      const value = event.target.value;

      if (type === 'file') {
        onChange?.(value);
      } else if (onChange) {
        extractContents(event.target, onChange);
      }

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
        'drag-hover': dragHover,
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === 'Space') {
          inputRef?.current?.click();
        }
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
        onDragEnter={() => {
          setDragHover(true);
        }}
        onDragLeave={() => {
          setDragHover(false);
        }}
        onDrop={() => {
          setDragHover(false);
        }}
      />
      <div data-element="Button">Choose file</div>
      <div data-element={!!value ? 'Value' : 'Placeholder'}>
        {value || placeholder || 'No file selected'}
      </div>
    </Action>
  );

  return (
    <FieldWrapper
      {...{
        labelPosition,
        label,
        styles,
        isRequired,
        labelStyles,
        necessityIndicator,
        necessityLabel,
        labelProps,
        isDisabled,
        validationState,
        message,
        description,
        requiredMark,
        tooltip,
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
