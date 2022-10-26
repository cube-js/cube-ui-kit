import {
  forwardRef,
  RefObject,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { createFocusableRef } from '@react-spectrum/utils';

import { useProviderProps } from '../../../provider';
import { Action } from '../../actions/Action';
import {
  BaseProps,
  BlockStyleProps,
  CONTAINER_STYLES,
  extractStyles,
  PositionStyleProps,
  Styles,
  tasty,
} from '../../../tasty';
import { FormFieldProps } from '../../../shared';
import { FieldWrapper } from '../FieldWrapper';

import type { AriaTextFieldProps } from '@react-types/textfield';

const FileInputElement = tasty(Action, {
  styles: {
    display: 'inline-flex',
    position: 'relative',
    preset: 't3',
    padding: '.5x 1x',
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
    whiteSpace: 'nowrap',

    Button: {
      radius: true,
      border: {
        '': '#clear',
        pressed: '#purple.30',
      },
      fill: {
        '': '#purple.10',
        hovered: '#purple.16',
        pressed: '#purple.10',
        '[disabled]': '#dark.04',
      },
      color: {
        '': '#purple',
        '[disabled]': '#dark.30',
      },
      padding: '.5x (1.5x - 1px)',
      transition: 'theme',
    },

    Placeholder: {
      color: '#dark-02',
    },

    Value: {
      color: '#dark-02',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      width: 'max 100%',
      overflow: 'hidden',
    },

    Input: {
      position: 'absolute',
      top: '-50px',
      right: 0,
      bottom: 0,
      left: 0,
      radius: '@content-radius',
      opacity: 0.01,
      cursor: 'pointer',
      zIndex: 10,
    },
  },
});

export interface CubeFileInputProps
  extends BaseProps,
    PositionStyleProps,
    BlockStyleProps,
    AriaTextFieldProps,
    FormFieldProps {
  /**
   * The size of the input
   * @default default
   */
  size?: 'small' | 'default' | 'large' | string;
  /** The input ref */
  inputRef?: RefObject<HTMLInputElement>;
  /** Style map for the input */
  inputStyles?: Styles;
  /**
   * The type of the input
   * @default file
   */
  type?: 'file' | 'text';
}

function extractContents(element, callback) {
  const files = element?.files;

  if (files && files.length > 0) {
    const fileReader = new FileReader();

    fileReader.onload = function () {
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
    extra,
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
    isHidden,
    inputStyles,
    labelSuffix,
    type = 'file',
    ...otherProps
  } = useProviderProps(props);
  const [value, setValue] = useState();
  const [dragHover, setDragHover] = useState(false);
  let domRef = useRef(null);
  let defaultInputRef = useRef(null);
  inputRef = inputRef || defaultInputRef;

  let styles = extractStyles(otherProps, CONTAINER_STYLES);

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
    <FileInputElement
      ref={domRef}
      qa={qa || 'FileInput'}
      styles={inputStyles}
      isDisabled={isDisabled}
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
        ref={inputRef}
        id={id}
        name={name}
        data-element="Input"
        type="file"
        tabIndex={-1}
        onChange={onLocalChange}
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
    </FileInputElement>
  );

  return (
    <FieldWrapper
      {...{
        labelPosition,
        label,
        extra,
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
        isHidden,
        labelSuffix,
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
