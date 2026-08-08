import {
  BaseProps,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  tasty,
} from '@tenphi/tasty';
import {
  ForwardedRef,
  forwardRef,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useEvent } from '../../../_internal';
import { FieldBaseProps } from '../../../shared';
import { extractStyles } from '../../../utils/styles';
import { ItemButton } from '../../actions';
import { CubeItemProps } from '../../content/Item';
import {
  getValidationIcon,
  getValidationTheme,
  useFieldProps,
  wrapWithField,
} from '../../form';
import { Dialog, DialogTrigger } from '../../overlays/Dialog';
import { ColorSpace } from '../color/channels';
import {
  ColorFormat,
  ColorValue,
  formatColor,
  parseColor,
} from '../color/color';
import { ColorPanel } from '../color/ColorPanel';
import { ColorSwatch } from '../color/ColorSwatch';

/** What the popover starts from when there is no color to edit yet. */
const FALLBACK_COLOR: ColorValue = { h: 264, s: 0.8, l: 0.6 };

const ColorPickerWrapper = tasty({
  qa: 'ColorPickerWrapper',
  styles: {
    display: 'inline-grid',
    flow: 'column',
    gridRows: '1sf',
    placeContent: 'stretch',
    placeItems: 'stretch',
  },
});

export interface CubeColorPickerProps
  extends BaseProps,
    OuterStyleProps,
    FieldBaseProps {
  /** The selected color, as a color string. */
  value?: string | null;
  /** The initial color of an uncontrolled picker. */
  defaultValue?: string | null;
  /** Called with the color string, or `null` when there is no color. */
  onChange?: (value: string | null) => void;
  /** Notation the value is written in. */
  format?: ColorFormat;
  /** Color concept the popover opens with. */
  defaultSpace?: ColorSpace;
  /** Whether the popover is open. Makes the disclosure controlled. */
  isOpen?: boolean;
  /** Whether the popover is open initially. */
  defaultOpen?: boolean;
  /** Called when the popover opens or closes. */
  onOpenChange?: (isOpen: boolean) => void;
  /** Whether the popover may flip to the other side of the trigger. */
  shouldFlip?: boolean;
  /** Replaces the color shown on the trigger. Pass `null` for a swatch on its own. */
  children?: ReactNode;
  /** Shown on the trigger while there is no color. */
  placeholder?: ReactNode;
  /** The size of the trigger. */
  size?: CubeItemProps['size'];
  /** The visual type of the trigger. */
  type?: CubeItemProps['type'];
  theme?: CubeItemProps['theme'];
  /** Tooltip for the trigger, separate from the field tooltip. */
  triggerTooltip?: CubeItemProps['tooltip'];
  styles?: Styles;
  /** Styles of the trigger button. */
  triggerStyles?: Styles;
  /** Styles of the color swatch. */
  swatchStyles?: Styles;
  'aria-label'?: string;
}

/**
 * A color swatch that opens the color popover — the same one `ColorInput`
 * uses, without the text field. Reach for it when a color is chosen but never
 * typed: a toolbar, a chart legend, a cell in a dense table.
 */
export const ColorPicker = forwardRef(function ColorPicker(
  allProps: CubeColorPickerProps,
  ref: ForwardedRef<HTMLElement>,
) {
  const props = useFieldProps(allProps, {
    defaultValidationTrigger: 'onChange',
    valuePropsMapper: ({ value, onChange }) => ({
      value: value as string | null | undefined,
      onChange,
    }),
  });

  const {
    qa,
    id,
    value,
    defaultValue,
    onChange,
    format = 'hex',
    defaultSpace = 'hst',
    isOpen: controlledOpen,
    defaultOpen,
    onOpenChange,
    shouldFlip,
    children,
    placeholder = 'Pick a color',
    size,
    type = 'outline',
    theme = 'default',
    triggerTooltip,
    triggerStyles,
    swatchStyles,
    isDisabled,
    isLoading,
    isInvalid,
    isValid,
    autoFocus,
    'aria-label': ariaLabel,
  } = props;

  const styles = extractStyles(props, OUTER_STYLES);

  const [color, setColor] = useState(() =>
    parseColor((value ?? defaultValue ?? '').toString()),
  );
  const [space, setSpace] = useState<ColorSpace>(defaultSpace);
  const [isOpen, setOpen] = useState(defaultOpen ?? false);

  /** What was last published, to tell our own updates from outside ones. */
  const emitted = useRef<string | null | undefined>(value);

  // Adopt values that did not come from here — a form reset, or a parent that
  // overrides what the user picked.
  useEffect(() => {
    if (value === undefined || value === emitted.current) return;

    emitted.current = value;
    setColor(parseColor((value ?? '').toString()));
  }, [value]);

  const handleColorChange = useEvent((next: ColorValue) => {
    const text = formatColor(next, format);

    emitted.current = text;
    setColor(next);
    onChange?.(text);
  });

  const handleOpenChange = useEvent((next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  });

  // The swatch carries the color and the label spells it out. `children`
  // replaces that label, and `null` leaves the swatch on its own.
  const label =
    children !== undefined
      ? children
      : color
        ? formatColor(color, format)
        : placeholder;

  const pickerField = (
    <ColorPickerWrapper styles={styles}>
      <DialogTrigger
        hideArrow
        type="popover"
        mobileType="tray"
        placement="bottom start"
        isOpen={controlledOpen ?? isOpen}
        shouldFlip={shouldFlip}
        onOpenChange={handleOpenChange}
      >
        <ItemButton
          data-popover-trigger
          id={id}
          qa={qa || 'ColorPickerTrigger'}
          data-input-type="colorpicker"
          type={type}
          theme={getValidationTheme(theme, { isInvalid, isValid })}
          size={size}
          icon={<ColorSwatch color={color} styles={swatchStyles} />}
          rightIcon={getValidationIcon({ isInvalid, isValid })}
          tooltip={triggerTooltip}
          isDisabled={isDisabled || isLoading}
          autoFocus={autoFocus}
          aria-label={ariaLabel}
          mods={{ placeholder: !color }}
          styles={triggerStyles}
        >
          {label}
        </ItemButton>
        <Dialog aria-label="Color picker" width="max-content">
          <ColorPanel
            color={color ?? FALLBACK_COLOR}
            space={space}
            isDisabled={isDisabled}
            previewFormat={format}
            onChange={handleColorChange}
            onSpaceChange={setSpace}
          />
        </Dialog>
      </DialogTrigger>
    </ColorPickerWrapper>
  );

  return wrapWithField(pickerField, ref as any, props);
});

(ColorPicker as any).cubeInputType = 'Text';
