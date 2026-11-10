import { createFocusableRef, unwrapDOMRef } from '@react-spectrum/utils';
import { useControlledState } from '@react-stately/utils';
import { BaseProps, mergeStyles, Styles, tasty } from '@tenphi/tasty';
import {
  forwardRef,
  RefObject,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { useEvent } from '../../../_internal/hooks/use-event';
import { useI18n } from '../../../i18n/useI18n';
import { FieldBaseProps } from '../../../shared/form';
import { mergeProps } from '../../../utils/react/mergeProps';
import { useCombinedRefs } from '../../../utils/react/useCombinedRefs';
import { Action } from '../../actions/Action/Action';
import {
  FieldLayoutStyleProps,
  splitFieldLayout,
} from '../../form/field-layout';
import { useFieldProps } from '../../form/Form/use-field/use-field-props';
import { getValidationMods } from '../../form/validation/resolve-validation-props';
import {
  hasValidationIndicator,
  ValidationIndicator,
} from '../../form/validation/ValidationIndicator';
import { wrapWithField } from '../../form/wrapper';
import { INPUT_WRAPPER_STYLES } from '../TextInput/TextInputBase';

import type { AriaLabelingProps, FocusableRefValue } from '@react-types/shared';
import type { ChangeEvent } from 'react';
import type { AriaTextFieldProps } from 'react-aria';
import type { Props } from '../../../props';

// The input box is the one every text field draws (`INPUT_WRAPPER_STYLES`):
// its fill, border, radius and `$size` height per `size`, so the field lines
// up with the inputs around it. The box itself is the button that opens the
// file dialog, so it holds a "Choose file" chip, the file name and the state.
const FileInputElement = tasty(Action, {
  qa: 'FileInputWrapper',
  styles: mergeStyles(INPUT_WRAPPER_STYLES, {
    display: 'flex',
    flow: 'row',
    placeItems: 'center start',
    gap: '1x',
    // A button sizes to its content even as a flex box, so it is told to
    // fill the field, as the other inputs do.
    width: '100%',
    textAlign: 'start',
    // The chip sits as far from the left edge as from the top and bottom. The
    // validation icon (`suffix`) takes a text input's cell at the right edge.
    padding: {
      '': '0 (1x - 1bw) 0 (($size - 3x) / 2)',
      suffix: '0 0 0 (($size - 3x) / 2)',
    },
    // The shared box clips its fill to the content box, which the padding
    // would leave unpainted.
    backgroundClip: 'padding-box',
    cursor: {
      '': '$pointer',
      disabled: 'default',
    },
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    // A file dragged over the box marks it as the drop target, over its
    // validation color.
    border: {
      'drag-hover': '#primary-accent-text',
    },

    Button: {
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0,
      // The tallest an action gets inside a field (`$action-size`), at every
      // size, so the label's line fits in a small box too.
      height: '(3x - 2bw)',
      padding: '0 1x',
      preset: 't3m',
      radius: '(1r - 1bw)',
      fill: {
        '': '#primary-accent-surface.12',
        'hovered | drag-hover': '#primary-accent-surface.18',
        pressed: '#primary-accent-surface.24',
      },
      // The accent text token, not the accent fill: it keeps AA contrast on
      // the tinted chip in every scheme.
      color: {
        '': '#primary-accent-text',
        disabled: '#primary-accent-disabled-text',
      },
      transition: 'theme',
    },

    // Both take the room left beside the chip, on one line that ends in an
    // ellipsis. The placeholder is softer than a file name, and still AA.
    Placeholder: {
      flexGrow: 1,
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      color: {
        '': '#surface-text-soft-2',
        disabled: '#disabled-surface-text',
      },
    },

    Value: {
      flexGrow: 1,
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      color: {
        '': '#surface-text-soft',
        disabled: '#disabled-surface-text',
      },
    },

    State: {
      $: '>',
      display: 'flex',
      placeItems: 'center',
    },

    ValidationIcon: {
      $: '> State >',
    },

    Input: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      opacity: 0.01,
      cursor: {
        '': '$pointer',
        disabled: 'default',
      },
      zIndex: 10,

      // The browser's own button sits over the chip and keeps its arrow.
      '&::file-selector-button': {
        cursor: 'inherit',
      },
    },
  }),
});

export interface CubeFileInputProps
  extends
    BaseProps,
    FieldLayoutStyleProps,
    Omit<AriaTextFieldProps, 'form' | 'name' | 'errorMessage'>,
    FieldBaseProps<string | null | undefined> {
  /**
   * The size of the input
   * @default default
   */
  size?: 'small' | 'default' | 'large' | string;
  /** The input ref */
  inputRef?: RefObject<HTMLInputElement | null>;
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
    inputRef: inputRefProp,
    isDisabled,
    isInvalid,
    isValid,
    inputStyles,
    type = 'file',
    inputProps,
    accept,
    form,
    size = 'default',
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

  // `Action` hands its ref a focusable handle, not the element.
  const actionRef = useRef<FocusableRefValue<HTMLElement>>(null);

  const inputRef = useCombinedRefs(inputRefProp);

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

  // The button is the root, so `inputStyles` styles the same element and wins
  // over `styles`, as `wrapperStyles` does on the date pickers.
  const { styles, field } = splitFieldLayout(props, {
    overStyles: inputStyles,
  });

  // The button is the control: the label points at the hidden native input so
  // that clicking it opens the file dialog, but the button is what takes focus.
  // So it names itself — the label, or its own `aria-label`, then what it says
  // — and takes the field's description and message.
  const {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
  } = props as AriaLabelingProps;
  // A caller's own label id is kept: the trigger refers to whichever it is.
  const labelId = props.labelProps?.id ?? `${id}-label`;
  const triggerId = `${id}-trigger`;
  const chooseFileId = `${id}-choose-file`;
  const fileNameId = `${id}-file-name`;
  const nameSource =
    ariaLabelledBy ?? (props.label ? labelId : ariaLabel ? triggerId : null);

  // Expose imperative interface for ref
  useImperativeHandle(ref, () => ({
    ...createFocusableRef(unwrapDOMRef(actionRef), inputRef),
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
      ref={actionRef}
      id={triggerId}
      aria-label={ariaLabel}
      aria-labelledby={[nameSource, chooseFileId, fileNameId]
        .filter(Boolean)
        .join(' ')}
      aria-describedby={ariaDescribedBy}
      styles={styles}
      isDisabled={isDisabled}
      mods={{
        size,
        selected: !!fileName,
        // A disabled input takes no drop.
        'drag-hover': dragHover && !isDisabled,
        suffix: hasValidationIndicator({ isInvalid, isValid }),
        ...getValidationMods({ isInvalid, isValid }),
      }}
      onKeyDown={(e) => {
        // The button's own click doesn't reach the input inside it. A held
        // key opens the dialog once.
        if (!e.repeat && (e.key === 'Enter' || e.key === ' ')) {
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
      <div id={chooseFileId} data-element="Button">
        {t('fileInput.chooseFile', 'Choose file')}
      </div>
      <div id={fileNameId} data-element={fileName ? 'Value' : 'Placeholder'}>
        {fileName ||
          placeholder ||
          t('fileInput.noFileSelected', 'No file selected')}
      </div>
      <ValidationIndicator isInvalid={isInvalid} isValid={isValid} />
    </FileInputElement>
  );

  return wrapWithField(fileInput, {
    ...props,
    ...field,
    labelProps: mergeProps(props.labelProps, { id: labelId }),
  });
}

/**
 * FileInputs are file inputs that allow users to select local files to
 * upload them to the server.
 */
const _FileInput = forwardRef(FileInput);

_FileInput.displayName = 'FileInput';

export { _FileInput as FileInput };
