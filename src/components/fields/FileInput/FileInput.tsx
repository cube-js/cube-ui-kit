import { createFocusableRef } from '@react-spectrum/utils';
import {
  forwardRef,
  RefObject,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useProviderProps } from '../../../provider';
import { FieldBaseProps } from '../../../shared';
import {
  BaseProps,
  BlockStyleProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  extractStyles,
  PositionStyleProps,
  Props,
  Styles,
  tasty,
} from '../../../tasty';
import { useCombinedRefs } from '../../../utils/react';
import { Action } from '../../actions';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';

import type { AriaTextFieldProps } from 'react-aria';

const FileInputElement = tasty(Action, {
  qa: 'FileInputWrapper',
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
      ':hover': '#purple.08',
      disabled: '#dark.04',
    },
    border: {
      '': true,
      ':focus-within & :focus-visible': '#purple-text',
    },
    radius: true,
    cursor: '$pointer',
    overflow: 'hidden',
    whiteSpace: 'nowrap',

    Button: {
      radius: true,
      border: {
        '': '#clear',
        pressed: '#purple.30',
      },
      fill: '#purple.12',
      color: {
        '': '#purple',
        disabled: '#dark.30',
      },
      padding: '.5x (1.5x - 1px)',
      transition: 'theme',
    },

    Placeholder: {
      color: '#dark-02',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      width: 'max 100%',
      overflow: 'hidden',
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
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      radius: '$content-radius',
      opacity: 0.01,
      cursor: '$pointer',
      zIndex: 10,
    },
  },
});

export interface CubeFileInputProps
  extends BaseProps,
    PositionStyleProps,
    ContainerStyleProps,
    BlockStyleProps,
    AriaTextFieldProps,
    FieldBaseProps {
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
  /** Direct input props */
  inputProps?: Props;
  /** The file types that the input should accept */
  accept?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
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

function extractFileNameFromValue(value?: string) {
  return typeof value === 'string'
    ? (value as string).split('\\')?.pop()
    : undefined;
}

function FileInput(props: CubeFileInputProps, ref) {
  props = useProviderProps(props);
  props = useFormProps(props);
  props = useFieldProps(
    { ...props },
    {
      defaultValidationTrigger: 'onChange',
      valuePropsMapper: ({ value, onChange }) => ({
        onChange,
        value: props.type === 'file' || !props.type ? value : undefined,
      }),
    },
  );

  let {
    id,
    name,
    qa,
    value,
    onChange,
    placeholder,
    inputRef,
    isDisabled,
    inputStyles,
    type = 'file',
    inputProps,
    accept,
    form,
    ...otherProps
  } = props;

  const [dragHover, setDragHover] = useState(false);
  const defaultValue = useMemo(
    () => (type === 'file' ? value : undefined),
    [type, value],
  );
  const defaultFileName = useMemo(
    () => extractFileNameFromValue(defaultValue),
    [],
  );
  const [fileName, setFileName] = useState<string | undefined>(defaultFileName);

  let domRef = useRef(null);

  inputRef = useCombinedRefs(inputRef);

  const onLocalChange = useCallback(
    (event: any) => {
      const value = event.target.value;

      setFileName(extractFileNameFromValue(value));

      if (type === 'file') {
        onChange?.(value);
      } else {
        extractContents(event.target, onChange);
      }
    },
    [onChange],
  );

  let styles = extractStyles(otherProps, CONTAINER_STYLES);

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
        accept={accept}
        data-qa={qa || 'FileInput'}
        data-input-type="fileinput"
        data-element="Input"
        disabled={isDisabled}
        type="file"
        multiple={false}
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
        {...inputProps}
      />
      <div data-element="Button">Choose file</div>
      <div data-element={fileName ? 'Value' : 'Placeholder'}>
        {fileName || placeholder || 'No file selected'}
      </div>
    </FileInputElement>
  );

  return wrapWithField(fileInput, domRef, {
    ...props,
  });
}

/**
 * FileInputs are file inputs that allow users to select local files to
 * upload them to the server.
 */
const _FileInput = forwardRef(FileInput);

_FileInput.displayName = 'FileInput';

export { _FileInput as FileInput };
