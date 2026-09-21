import { createFocusableRef } from '@react-spectrum/utils';
import { useControlledState } from '@react-stately/utils';
import {
  BaseProps,
  BlockStyleProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  PositionStyleProps,
  Styles,
  tasty,
} from '@tenphi/tasty';
import {
  forwardRef,
  RefObject,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { useEvent } from '../../../_internal/hooks/use-event';
import { useI18n } from '../../../i18n';
import { FieldBaseProps } from '../../../shared';
import { useCombinedRefs } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';
import { Action } from '../../actions';
import {
  getValidationMods,
  useFieldProps,
  ValidationIndicator,
  wrapWithField,
} from '../../form';

import type { ChangeEvent } from 'react';
import type { AriaTextFieldProps } from 'react-aria';
import type { Props } from '../../../props';

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
      '': '#surface',
      'drag-hover': '#primary.16',
      ':hover': '#primary.08',
      disabled: '#disabled-surface',
    },
    border: {
      '': true,
      valid: '#success-text.50',
      invalid: '#danger-text.50',
      ':focus-within & :focus-visible': '#primary-text',
    },
    radius: true,
    cursor: '$pointer',
    overflow: 'hidden',
    whiteSpace: 'nowrap',

    Button: {
      radius: true,
      border: {
        '': '#clear',
        pressed: '#primary.30',
      },
      fill: '#primary.12',
      color: {
        '': '#primary',
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

    State: {
      display: 'flex',
      placeItems: 'center',
    },

    ValidationIcon: {
      $: '> State >',
      display: 'grid',
      placeItems: 'center',
      width: 'min 2x',
      fontSize: '$icon-size',
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
    FieldBaseProps<string | null | undefined> {
  /** The form instance; redeclared for the same reason as in `Checkbox`. */
  form?: FieldBaseProps['form'];
  /** Field name; modern forms also accept nested tuple paths. */
  name?: FieldBaseProps['name'];
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
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

function extractFileNameFromValue(value?: string) {
  return typeof value === 'string'
    ? (value as string).split('\\')?.pop()
    : undefined;
}

function FileInput(allProps: CubeFileInputProps, ref) {
  const { t } = useI18n();

  const props = useFieldProps(allProps, {
    defaultValidationTrigger: 'onChange',
  });

  let {
    id,
    name,
    qa,
    value,
    onChange,
    placeholder,
    inputRef,
    isDisabled,
    isInvalid,
    isValid,
    inputStyles,
    type = 'file',
    inputProps,
    accept,
    form,
    ...otherProps
  } = props;

  const [dragHover, setDragHover] = useState(false);
  const [currentValue, setValue] = useControlledState(
    value,
    props.defaultValue ?? '',
    onChange,
  );
  const [selection, setSelection] = useState<{
    value: string;
    name: string;
  }>();
  const fileName =
    type === 'file'
      ? extractFileNameFromValue(currentValue)
      : currentValue === selection?.value
        ? selection?.name
        : undefined;
  const reader = useRef<FileReader | null>(null);

  let domRef = useRef(null);

  inputRef = useCombinedRefs(inputRef);

  useEffect(() => {
    // Browsers only allow clearing a file input programmatically. A reset or
    // external value replacement must also release the old native selection.
    if (inputRef.current && currentValue !== selection?.value) {
      inputRef.current.value = '';
    }
  }, [currentValue, selection, inputRef]);
  useEffect(() => () => reader.current?.abort(), [type]);

  const onLocalChange = useEvent((event: ChangeEvent<HTMLInputElement>) => {
    reader.current?.abort();
    const file = event.target.files?.[0];
    const name = file?.name ?? '';
    const commit = (next: string) => {
      setSelection({ value: next, name });
      setValue(next);
    };
    if (type === 'file') {
      commit(event.target.value);
    } else if (file) {
      const nextReader = new FileReader();
      reader.current = nextReader;
      nextReader.onload = () => commit(String(nextReader.result ?? ''));
      nextReader.readAsText(file);
    } else {
      commit('');
    }
  });

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
        selected: !!fileName,
        'drag-hover': dragHover,
        ...getValidationMods({ isInvalid, isValid }),
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
      <div data-element="Button">
        {t('fileInput.chooseFile', 'Choose file')}
      </div>
      <div data-element={fileName ? 'Value' : 'Placeholder'}>
        {fileName ||
          placeholder ||
          t('fileInput.noFileSelected', 'No file selected')}
      </div>
      <ValidationIndicator isInvalid={isInvalid} isValid={isValid} />
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
