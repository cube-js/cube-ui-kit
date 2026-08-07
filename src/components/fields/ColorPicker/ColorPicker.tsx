import {
  BaseProps,
  BaseStyleProps,
  BlockStyleProps,
  ColorStyleProps,
  OuterStyleProps,
  Styles,
  tasty,
} from '@tenphi/tasty';
import {
  FocusEvent,
  ForwardedRef,
  forwardRef,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTextField } from 'react-aria';

import { useEvent } from '../../../_internal';
import { PipetteIcon } from '../../../icons';
import { FieldBaseProps } from '../../../shared';
import { mergeProps } from '../../../utils/react';
import { ItemAction } from '../../actions';
import { useFieldProps } from '../../form';
import { Dialog, DialogTrigger } from '../../overlays/Dialog';
import { TextInputBase } from '../TextInput/TextInputBase';

import { ColorSpace } from './channels';
import {
  ColorFormat,
  ColorValue,
  detectFormat,
  formatColor,
  parseColor,
  toHex,
} from './color';
import { ColorPickerPanel } from './ColorPickerPanel';

/**
 * How the text in the input relates to the committed value.
 *
 * - `forced` — the text is rewritten in `format` whenever it is not mid-edit,
 *   and the value is always written in `format`.
 * - `derive` — the user's own notation is left alone, and the value is
 *   normalized in whichever notation the text is written in.
 * - `free` — the text *is* the value, verbatim. It is still verified, so an
 *   unparsable entry falls back to the last valid one.
 */
export type ColorPickerFormatMode = 'forced' | 'derive' | 'free';

/** What the popover starts from when there is no color to edit yet. */
const FALLBACK_COLOR: ColorValue = { h: 264, s: 0.8, l: 0.6 };

const SwatchElement = tasty({
  qa: 'ColorSwatch',
  styles: {
    display: 'block',
    width: '2.5x',
    height: '2.5x',
    radius: '1r',
    fill: {
      '': '(#color-picker, #clear)',
      empty: '#clear',
    },
    shadow: 'inset 0 0 0 1bw #dark.15',
    // A single diagonal stroke is the conventional "no color" swatch.
    image: {
      '': false,
      empty:
        'linear-gradient(to bottom right, #clear 46%, #danger 46%, #danger 54%, #clear 54%)',
    },
  },
});

const ColorPickerButton = tasty(ItemAction, {
  qa: 'ColorPickerButton',
  icon: <PipetteIcon />,
});

export interface CubeColorPickerProps
  extends BaseProps,
    BaseStyleProps,
    OuterStyleProps,
    BlockStyleProps,
    ColorStyleProps,
    FieldBaseProps {
  /** The selected color, as a color string. */
  value?: string | null;
  /** The initial color of an uncontrolled picker. */
  defaultValue?: string | null;
  /** Called with the normalized color string, or `null` when the field is cleared. */
  onChange?: (value: string | null) => void;
  /** Notation the value is written in, and the one `forced` mode displays. */
  format?: ColorFormat;
  /** How strictly the input text is tied to `format`. */
  formatMode?: ColorPickerFormatMode;
  /** Color concept the popover opens with. */
  defaultSpace?: ColorSpace;
  /** Whether the popover is open. Makes the disclosure controlled. */
  isOpen?: boolean;
  /** Whether the popover is open initially. */
  defaultOpen?: boolean;
  /** Called when the popover opens or closes. */
  onOpenChange?: (isOpen: boolean) => void;
  /** Whether the popover may flip to the other side of the input. */
  shouldFlip?: boolean;
  /** Text shown while the field is empty. */
  placeholder?: string;
  /** The size of the input. */
  size?: 'small' | 'medium' | 'large' | (string & {});
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  styles?: Styles;
  /** Styles of the text input element. */
  inputStyles?: Styles;
  /** Styles of the popover trigger button. */
  triggerStyles?: Styles;
  /** Styles of the color swatch shown inside the input. */
  swatchStyles?: Styles;
}

/**
 * A color field: the color as text, a swatch of the current value, and a
 * popover to dial it in across OKHST, OKLCH and RGB.
 */
export const ColorPicker = forwardRef(function ColorPicker(
  allProps: CubeColorPickerProps,
  ref: ForwardedRef<HTMLElement>,
) {
  const props = useFieldProps(allProps, {
    defaultValidationTrigger: 'onBlur',
    valuePropsMapper: ({ value, onChange }) => ({
      value: value as string | null | undefined,
      onChange,
    }),
  });

  const {
    qa,
    value,
    defaultValue,
    onChange,
    format = 'hex',
    formatMode = 'forced',
    defaultSpace = 'hst',
    isOpen: controlledOpen,
    defaultOpen,
    onOpenChange,
    shouldFlip,
    placeholder = 'Pick a color',
    size,
    isDisabled,
    isReadOnly,
    isInvalid,
    isValid,
    isLoading,
    autoFocus,
    inputStyles,
    triggerStyles,
    swatchStyles,
    labelProps: userLabelProps,
    onBlur: userOnBlur,
    onFocus,
    label,
    description,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    id,
  } = props;

  const initialText = (value ?? defaultValue ?? '').toString();
  const [text, setText] = useState(() => {
    const parsed = parseColor(initialText);

    return parsed && formatMode === 'forced'
      ? formatColor(parsed, format)
      : initialText;
  });
  const [color, setColor] = useState(() => parseColor(initialText));
  const [space, setSpace] = useState<ColorSpace>(defaultSpace);
  const [isOpen, setOpen] = useState(defaultOpen ?? false);

  const targetRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** The last text that parsed, so an invalid entry has something to fall back to. */
  const validText = useRef(parseColor(initialText) ? text : '');
  /** What was last handed to `onChange`, to tell our own updates from outside ones. */
  const emitted = useRef<string | null | undefined>(value);

  const emit = useEvent((next: string | null) => {
    emitted.current = next;
    onChange?.(next);
  });

  /** The notation a value should be written in, given the current text. */
  const outputFormat = (source: string): ColorFormat =>
    formatMode === 'forced' ? format : detectFormat(source) ?? format;

  // Adopt values that did not come from here — a form reset, or a parent that
  // overrides what the user picked.
  useEffect(() => {
    if (value === undefined || value === emitted.current) return;

    emitted.current = value;

    const raw = (value ?? '').toString();
    const parsed = parseColor(raw);
    const nextText =
      parsed && formatMode === 'forced' ? formatColor(parsed, format) : raw;

    setColor(parsed);
    setText(nextText);
    validText.current = parsed ? nextText : '';
  }, [value, format, formatMode]);

  const handleTextChange = useEvent((nextText: string) => {
    setText(nextText);

    if (!nextText.trim()) {
      setColor(null);
      validText.current = '';
      emit(null);

      return;
    }

    const parsed = parseColor(nextText);

    // Half-typed input keeps the last valid color, so the value stays a real
    // color at every keystroke.
    if (!parsed) return;

    setColor(parsed);
    validText.current = nextText;
    emit(
      formatMode === 'free'
        ? nextText.trim()
        : formatColor(parsed, outputFormat(nextText)),
    );
  });

  /** Resolve whatever is in the input into a real color, or undo it. */
  const settle = useEvent(() => {
    if (!text.trim()) return;

    const parsed = parseColor(text);

    if (!parsed) {
      setText(validText.current);

      return;
    }

    if (formatMode === 'forced') setText(formatColor(parsed, format));
  });

  const handleBlur = useEvent((event: FocusEvent<HTMLInputElement>) => {
    settle();
    userOnBlur?.(event);
  });

  const handleKeyDown = useEvent((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') settle();
  });

  const handleColorChange = useEvent((nextColor: ColorValue) => {
    const nextText = formatColor(nextColor, outputFormat(text));

    setColor(nextColor);
    setText(nextText);
    validText.current = nextText;
    emit(nextText);
  });

  const handleOpenChange = useEvent((next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  });

  const { labelProps, inputProps } = useTextField(
    {
      id,
      label,
      description,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      'aria-describedby': ariaDescribedby,
      isDisabled,
      isReadOnly,
      isInvalid,
      autoFocus,
      placeholder,
      value: text,
      type: 'text',
      onChange: handleTextChange,
      onFocus,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
    },
    inputRef,
  );

  return (
    <TextInputBase
      {...props}
      ref={ref}
      qa={qa || 'ColorPicker'}
      size={size}
      autocomplete="off"
      icon={
        <SwatchElement
          mods={{ empty: !color }}
          styles={swatchStyles}
          style={color ? { '--color-picker-color': toHex(color) } : undefined}
        />
      }
      inputRef={inputRef}
      inputProps={{ ...inputProps, spellCheck: false }}
      inputStyles={inputStyles}
      labelProps={mergeProps(labelProps, userLabelProps)}
      wrapperRef={targetRef}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      isInvalid={isInvalid}
      isValid={isValid}
      isLoading={isLoading}
      suffix={
        <DialogTrigger
          hideArrow
          type="popover"
          mobileType="tray"
          placement="bottom right"
          targetRef={targetRef}
          isOpen={controlledOpen ?? isOpen}
          shouldFlip={shouldFlip}
          onOpenChange={handleOpenChange}
        >
          <ColorPickerButton
            size={size}
            aria-label="Open the color picker"
            isDisabled={isDisabled || isReadOnly}
            styles={triggerStyles}
          />
          <Dialog aria-label="Color picker" width="max-content">
            <ColorPickerPanel
              color={color ?? FALLBACK_COLOR}
              space={space}
              isDisabled={isDisabled || isReadOnly}
              previewFormat={outputFormat(text)}
              onChange={handleColorChange}
              onSpaceChange={setSpace}
            />
          </Dialog>
        </DialogTrigger>
      }
    />
  );
});

(ColorPicker as any).cubeInputType = 'Text';
