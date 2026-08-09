import { useObjectRef } from '@react-aria/utils';
import {
  BaseProps,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  tasty,
} from '@tenphi/tasty';
import { ForwardedRef, forwardRef, useMemo, useRef, useState } from 'react';
import { useRadio, useRadioGroup } from 'react-aria';
import { useRadioGroupState } from 'react-stately';

import { useEvent } from '../../../_internal';
import { FieldBaseProps } from '../../../shared';
import { mergeProps } from '../../../utils/react';
import { useFocus } from '../../../utils/react/interactions';
import { extractStyles } from '../../../utils/styles';
import { getValidationMods, useFieldProps, wrapWithField } from '../../form';
import { HiddenInput } from '../../HiddenInput';
import { ColorFormat, formatColor, parseColor, toHex } from '../color/color';
import { useIsInsideColorPopover } from '../color/context';
import { ColorPicker } from '../ColorPicker';

import type { RadioGroupState } from 'react-stately';

/** A swatch: a color, and optionally a name to announce instead of the color. */
export type CubeColorSwatchItem = string | { color: string; label?: string };

/**
 * The trailing picker is a button wrapping a swatch, which would otherwise read
 * as a box inside a box. Stripping its chrome leaves just the swatch, so it
 * sits in the row as one of them.
 */
const CUSTOM_TRIGGER_STYLES: Styles = {
  width: '$swatch-size $swatch-size',
  height: '$swatch-size $swatch-size',
  padding: 0,
  radius: '1r',
  border: 0,
};

/** Matches the ring a selected swatch gets, for a custom color in the row. */
const CUSTOM_TRIGGER_SELECTED_STYLES: Styles = {
  ...CUSTOM_TRIGGER_STYLES,
  shadow: '0 0 0 1bw #surface, 0 0 0 2bw #primary',
};

/** The swatch fills the stripped button rather than keeping its own size. */
const CUSTOM_SWATCH_STYLES: Styles = {
  width: '100%',
  height: '100%',
  radius: '1r',
};

const GroupElement = tasty({
  qa: 'ColorSwatchGroup',
  styles: {
    display: 'grid',
    gap: '.5x',
    placeItems: 'stretch',
    width: 'max-content',
    gridColumns: 'repeat($columns, 1fr)',

    // 20px, 16px and 24px — 1x is 8px.
    '$swatch-size': {
      '': '2.5x',
      'size=small': '2x',
      'size=large': '3x',
    },
  },
});

const SwatchElement = tasty({
  as: 'label',
  qa: 'ColorSwatchOption',
  styles: {
    display: 'grid',
    placeItems: 'stretch',
    position: 'relative',
    radius: '1r',
    cursor: {
      '': 'pointer',
      disabled: 'default',
    },
    width: '$swatch-size $swatch-size',
    height: '$swatch-size $swatch-size',
    fill: '(#color-swatch, #clear)',
    opacity: {
      '': 1,
      disabled: '$disabled-opacity',
    },
    // A ring at one border-width's distance, so the color area stays whole —
    // the inner ring is the surface showing through as the gap. `outline` is
    // deliberately left to the focus ring.
    shadow: {
      '': 'inset 0 0 0 1bw #dark.15',
      selected:
        '0 0 0 1bw #surface, 0 0 0 2bw #primary, inset 0 0 0 1bw #dark.15',
    },
    outline: {
      '': '1bw #primary-text.0',
      focused: '1bw #primary-text',
    },
    outlineOffset: 3,
    transition: 'theme',
  },
});

export interface CubeColorSwatchGroupProps
  extends BaseProps,
    OuterStyleProps,
    FieldBaseProps {
  /** The colors to offer. Duplicates of the same color are dropped. */
  colors?: CubeColorSwatchItem[];
  /** The selected color (controlled). */
  value?: string | null;
  /** The selected color (uncontrolled). */
  defaultValue?: string | null;
  /** Called with the chosen color, written in `format`. */
  onChange?: (value: string | null) => void;
  /** Notation the value is written in. */
  format?: ColorFormat;
  /** How many swatches per row. Defaults to a single row. */
  columns?: number;
  /**
   * Append a `ColorPicker` for colors outside the set. Ignored inside a color
   * popover, which is where that picker would otherwise recurse.
   */
  allowCustom?: boolean;
  /** The size of each swatch. */
  size?: 'small' | 'medium' | 'large' | (string & {});
  styles?: Styles;
  /** Styles of an individual swatch. */
  swatchStyles?: Styles;
  'aria-label'?: string;
}

interface SwatchProps {
  colorKey: string;
  label: string;
  state: RadioGroupState;
  isDisabled?: boolean;
  size?: string;
  styles?: Styles;
  mods?: Record<string, boolean | undefined>;
}

function Swatch({
  colorKey,
  label,
  state,
  isDisabled,
  size,
  styles,
  mods,
}: SwatchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    inputProps,
    isSelected,
    isDisabled: isRadioDisabled,
  } = useRadio(
    { value: colorKey, 'aria-label': label, isDisabled },
    state,
    inputRef,
  );
  // `useRadio` reports selection but not focus, and the swatch is the only
  // thing a keyboard user can see — without this the ring never appears.
  const { isFocused, focusProps } = useFocus({ isDisabled }, true);

  return (
    <SwatchElement
      data-size={size}
      mods={{
        selected: isSelected,
        disabled: isRadioDisabled,
        focused: isFocused,
        ...mods,
      }}
      styles={styles}
      style={{ '--color-swatch-color': colorKey }}
    >
      <HiddenInput
        {...mergeProps(inputProps, focusProps)}
        ref={inputRef}
        qa="ColorSwatchInput"
        mods={{ button: true, disabled: isRadioDisabled }}
      />
    </SwatchElement>
  );
}

/**
 * A grid of color swatches, one of which can be selected — the palette half of
 * choosing a color, where `ColorPicker` is the freeform half.
 *
 * Swatches are keyed by their canonical hex, so the same color written two ways
 * collapses into one entry. Equivalent colors would otherwise make selection
 * ambiguous.
 */
export const ColorSwatchGroup = forwardRef(function ColorSwatchGroup(
  allProps: CubeColorSwatchGroupProps,
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
    colors = [],
    value,
    defaultValue,
    onChange,
    format = 'hex',
    columns,
    allowCustom,
    size = 'medium',
    isDisabled,
    isInvalid,
    isValid,
    swatchStyles,
    'aria-label': ariaLabel,
  } = props;

  const styles = extractStyles(props, OUTER_STYLES);
  const isInsidePopover = useIsInsideColorPopover();
  // A custom picker inside a color popover would open a popover of its own.
  const showCustom = allowCustom && !isInsidePopover;

  /** Keyed by canonical hex so the same color written two ways is one swatch. */
  const swatches = useMemo(() => {
    const seen = new Map<string, { key: string; label: string }>();

    for (const entry of colors) {
      const raw = typeof entry === 'string' ? entry : entry.color;
      const parsed = parseColor(raw);

      if (!parsed) continue;

      const key = toHex(parsed);

      if (seen.has(key)) continue;

      seen.set(key, {
        key,
        label:
          (typeof entry === 'string' ? undefined : entry.label) ??
          formatColor(parsed, format),
      });
    }

    return [...seen.values()];
  }, [colors, format]);

  const [internalValue, setInternalValue] = useState<string | null>(
    () => defaultValue ?? null,
  );
  const currentValue = value !== undefined ? value : internalValue;

  const selectedColor = parseColor((currentValue ?? '').toString());
  const selectedKey = selectedColor ? toHex(selectedColor) : null;
  const isCustom =
    !!selectedKey && !swatches.some((s) => s.key === selectedKey);

  const publish = useEvent((next: string | null) => {
    if (value === undefined) setInternalValue(next);

    onChange?.(next);
  });

  const handleChange = useEvent((nextKey: string) => {
    const parsed = parseColor(nextKey);

    publish(parsed ? formatColor(parsed, format) : null);
  });

  const state = useRadioGroupState({
    value: selectedKey ?? null,
    isDisabled,
    isReadOnly: props.isReadOnly,
    onChange: handleChange,
  });

  // `useFocusableRef` wants the ref of a real focusable control to forward to,
  // and a group of radios has no single one — `RadioGroup` takes the same
  // approach for the same reason.
  const domRef = useObjectRef(ref);
  const { radioGroupProps, labelProps } = useRadioGroup(
    {
      ...props,
      // Only name the group here when nothing else does: an `aria-label` set
      // unconditionally would outrank the visible label React Aria wires up.
      'aria-label': props.label ? undefined : ariaLabel ?? 'Colors',
      orientation: 'horizontal',
    },
    state,
  );

  const group = (
    <GroupElement
      ref={domRef}
      qa={qa || 'ColorSwatchGroup'}
      data-size={size}
      data-input-type="colorswatchgroup"
      styles={styles}
      mods={getValidationMods({ isInvalid, isValid })}
      style={{
        '--columns': String(columns ?? swatches.length + (showCustom ? 1 : 0)),
      }}
      {...mergeProps(radioGroupProps, {})}
    >
      {swatches.map((swatch) => (
        <Swatch
          key={swatch.key}
          colorKey={swatch.key}
          label={swatch.label}
          state={state}
          isDisabled={isDisabled}
          size={size}
          styles={swatchStyles}
        />
      ))}
      {showCustom ? (
        <ColorPicker
          aria-label="Custom color"
          qa="ColorSwatchGroupCustom"
          format={format}
          type="clear"
          size="small"
          value={isCustom ? currentValue ?? null : null}
          isDisabled={isDisabled}
          isReadOnly={props.isReadOnly}
          triggerStyles={
            isCustom ? CUSTOM_TRIGGER_SELECTED_STYLES : CUSTOM_TRIGGER_STYLES
          }
          swatchStyles={CUSTOM_SWATCH_STYLES}
          onChange={publish}
        >
          {null}
        </ColorPicker>
      ) : null}
    </GroupElement>
  );

  return wrapWithField(group, domRef, {
    ...props,
    labelProps: mergeProps(props.labelProps, labelProps),
  });
});

(ColorSwatchGroup as any).cubeInputType = 'Picker';
