import {
  ForwardedRef,
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';
import { useControlledState } from '@react-stately/utils';
import { useTextField } from 'react-aria';

import { useEvent } from '../../../_internal/index';
import { CubeTextInputBaseProps, TextInputBase } from '../TextInput';
import { useProviderProps } from '../../../provider';
import {
  castNullableStringValue,
  WithNullableValue,
} from '../../../utils/react/nullableValue';
import { chain } from '../../../utils/react';
import { useFieldProps } from '../../form';

export interface CubeTextAreaProps extends CubeTextInputBaseProps {
  /** Whether the textarea should change its size depends on the content */
  autoSize?: boolean;
  /** Max number of visible rows when autoSize is `true`. Defaults to 10  */
  maxRows?: number;
  /** The `rows` attribute in HTML is used to specify the number of visible text lines for the
   * control i.e. the number of rows to display. Defaults to 3 */
  rows?: number;
}

function TextArea(
  props: WithNullableValue<CubeTextAreaProps>,
  ref: ForwardedRef<HTMLElement>,
) {
  props = castNullableStringValue(props);
  props = useProviderProps(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onBlur',
    valuePropsMapper: ({ value, onChange }) => ({
      onChange,
      value: value?.toString() ?? '',
    }),
  });
  let {
    autoSize = false,
    isDisabled = false,
    isReadOnly = false,
    isRequired = false,
    onChange,
    maxRows = 10,
    rows = 3,
    ...otherProps
  } = props;

  rows = Math.max(rows, 1);
  maxRows = Math.max(maxRows, rows);

  let [inputValue, setInputValue] = useControlledState<string>(
    props.value,
    props.defaultValue,
    () => {},
  );
  let localInputRef = useRef<HTMLTextAreaElement>(null);
  let inputRef = props.inputRef ?? localInputRef;

  let { labelProps, inputProps } = useTextField(
    {
      ...props,
      onChange: chain(onChange, setInputValue),
      inputElementType: 'textarea',
    },
    inputRef,
  );

  const adjustHeight = useEvent(() => {
    const textarea = inputRef.current;

    if (!textarea || !autoSize) return;

    // Reset height to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Get computed styles to account for padding
    const computedStyle = getComputedStyle(textarea);
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
    const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
    const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;

    // Calculate line height (approximately)
    const lineHeight = parseInt(computedStyle.lineHeight) || 20;

    // Calculate content height (excluding padding and border)
    const contentHeight = textarea.scrollHeight - paddingTop - paddingBottom;

    // Calculate rows based on content height
    const computedRows = Math.ceil(contentHeight / lineHeight);

    // Apply min/max constraints
    const targetRows = Math.max(Math.min(computedRows, maxRows), rows);

    // Set the height including padding and border
    const totalHeight =
      targetRows * lineHeight +
      paddingTop +
      paddingBottom +
      borderTop +
      borderBottom;

    textarea.style.height = `${totalHeight}px`;
  });

  const useEnvironmentalEffect =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  // Call adjustHeight on content change
  useEnvironmentalEffect(() => {
    adjustHeight();
  }, [inputValue]);

  // Also call it on element resize as that can affect wrapping
  useEnvironmentalEffect(() => {
    if (!autoSize || !inputRef.current) return;

    adjustHeight();

    const resizeObserver = new ResizeObserver(adjustHeight);

    resizeObserver.observe(inputRef?.current);

    return () => resizeObserver.disconnect();
  }, [autoSize, inputRef?.current]);

  return (
    <TextInputBase
      ref={ref}
      {...otherProps}
      multiLine
      inputRef={inputRef}
      labelProps={labelProps}
      inputProps={inputProps}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      rows={rows}
    />
  );
}

/**
 * TextInputs are text inputs that allow users to input custom text entries
 * with a keyboard. Various decorations can be displayed around the field to
 * communicate the entry requirements.
 */
const _TextArea = forwardRef(TextArea);

(_TextArea as any).cubeInputType = 'Text';
_TextArea.displayName = 'TextArea';

export { _TextArea as TextArea };
