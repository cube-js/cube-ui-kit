import type { SyntheticEvent } from 'react';
import type { Props } from '../../props';

/**
 * Tags where `disabled` is a real HTML attribute. Browsers refuse to dispatch
 * mouse events on those elements while the attribute is set, so nothing that
 * listens for hover — a tooltip trigger above all — ever hears from them.
 * On every other tag the attribute is invalid markup that does nothing.
 */
const FORM_CONTROL_TAGS = new Set([
  'button',
  'input',
  'select',
  'textarea',
  'fieldset',
  'option',
  'optgroup',
]);

/**
 * Handlers that can activate an element. They are dropped while the element is
 * disabled through `aria-disabled` alone, so it stays as inert as a natively
 * disabled one.
 */
const ACTIVATION_EVENT_PROPS = [
  'onClick',
  'onDoubleClick',
  'onMouseDown',
  'onMouseUp',
  'onPointerDown',
  'onPointerUp',
  'onTouchStart',
  'onTouchEnd',
  'onKeyDown',
  'onKeyUp',
  'onKeyPress',
] as const;

function preventActivation(event: SyntheticEvent) {
  // Without the native attribute a click (or Enter/Space, which the browser
  // turns into a click) still runs the default action and would submit the
  // surrounding form.
  event.preventDefault();
}

const INERT_PROPS: Props = {
  'aria-disabled': true,
  onClick: preventActivation,
};

const EMPTY_PROPS: Props = {};

export interface DisabledElementOptions {
  /** Whether the component is disabled. */
  isDisabled?: boolean;
  /**
   * Whether the element has to keep receiving pointer and focus events while
   * disabled. Set it when the element hosts a tooltip: the tooltip is there to
   * explain why the element is unavailable, so hover has to reach it.
   */
  keepEvents?: boolean;
  /** The tag the component renders. */
  as?: string;
}

export interface DisabledElementProps {
  /** Whether the element has to carry the native `disabled` attribute. */
  isNativelyDisabled: boolean;
  /**
   * Whether the element is disabled through `aria-disabled` only and therefore
   * has to be kept inert by hand.
   */
  isInert: boolean;
  /** Props that mark the element disabled and inert. Spread them last. */
  inertProps: Props;
}

/**
 * Decides how the disabled state reaches the DOM.
 *
 * The native `disabled` attribute is the strongest option, but it also makes
 * the browser swallow the events the element needs to open a tooltip. When
 * such an element has to stay hoverable, it is marked `aria-disabled` instead
 * and kept inert by blocking activation — the outcome a user sees is the same,
 * except the tooltip now opens and screen readers still announce the state.
 */
export function getDisabledElementProps({
  isDisabled,
  keepEvents,
  as = 'div',
}: DisabledElementOptions): DisabledElementProps {
  if (!isDisabled) {
    return {
      isNativelyDisabled: false,
      isInert: false,
      inertProps: EMPTY_PROPS,
    };
  }

  // The attribute only means something on form controls, and there it can be
  // kept whenever nothing depends on the element's events.
  if (FORM_CONTROL_TAGS.has(as) && !keepEvents) {
    return {
      isNativelyDisabled: true,
      isInert: false,
      inertProps: EMPTY_PROPS,
    };
  }

  return { isNativelyDisabled: false, isInert: true, inertProps: INERT_PROPS };
}

/**
 * Removes the handlers that would activate an element which is disabled
 * without the native attribute.
 */
export function omitActivationEventProps<T extends Props>(props: T): T {
  const result = { ...props };

  for (const prop of ACTIVATION_EVENT_PROPS) {
    delete result[prop];
  }

  return result;
}
