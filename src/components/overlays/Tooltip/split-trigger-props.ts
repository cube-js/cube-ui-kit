import { mergeProps } from '../../../utils/react/mergeProps';

import type { HTMLAttributes } from 'react';

/**
 * The tooltip trigger props that only work on the element that takes focus.
 * React Aria's `useFocus` ignores focus that bubbles up from a child, so on a
 * wrapper around a native input — a radio's or a checkbox's `<label>` — the
 * tooltip never opened from the keyboard, and `aria-describedby` described the
 * wrapper instead of the control a screen reader announces.
 */
const FOCUS_TRIGGER_PROPS = [
  'onFocus',
  'onBlur',
  'onKeyDown',
  'onKeyUp',
  'aria-describedby',
] as const;

export type TooltipFocusProps = Pick<
  HTMLAttributes<HTMLElement>,
  (typeof FOCUS_TRIGGER_PROPS)[number]
>;

/**
 * Splits a tooltip's trigger props between the element it is positioned
 * against and hovered on (`pointerProps`) and the focusable element inside it
 * (`focusProps`).
 */
export function splitTooltipTriggerProps(
  triggerProps: HTMLAttributes<HTMLElement> = {},
) {
  const pointerProps: HTMLAttributes<HTMLElement> = { ...triggerProps };
  const focusProps: TooltipFocusProps = {};

  for (const key of FOCUS_TRIGGER_PROPS) {
    if (key in pointerProps) {
      (focusProps as Record<string, unknown>)[key] = pointerProps[key];
      delete pointerProps[key];
    }
  }

  return { pointerProps, focusProps };
}

/**
 * Adds a tooltip's focus-side trigger props to a focusable element's own:
 * handlers are chained, and the tooltip joins any description the element
 * already has rather than replacing it. `tabIndex` is never touched — a radio
 * group's roving tab index owns it.
 */
export function mergeTooltipFocusProps<P extends object>(
  props: P,
  tooltipProps?: TooltipFocusProps,
): P {
  if (!tooltipProps) return props;

  const { 'aria-describedby': tooltipDescribedBy, ...handlers } = tooltipProps;
  const ownDescribedBy = (props as { 'aria-describedby'?: string })[
    'aria-describedby'
  ];

  return {
    ...mergeProps(props, handlers),
    'aria-describedby':
      [ownDescribedBy, tooltipDescribedBy].filter(Boolean).join(' ') ||
      undefined,
  } as P;
}
