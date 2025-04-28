import {
  Children,
  cloneElement,
  createContext,
  useContext,
  useMemo,
} from 'react';

import { mergeProps } from './mergeProps';

const INITIAL_VALUE = {};

let SlotContext = createContext<Object>(INITIAL_VALUE);

export function useSlotProps(
  props: Record<string, any>,
  defaultSlot,
): Record<string, any> {
  let slot: string = props.slot || defaultSlot;
  let allSlots = useContext(SlotContext) ?? INITIAL_VALUE;
  let slotProps: Record<string, any> = allSlots[slot];

  return mergeProps(slotProps, props);
}

export function SlotProvider(props) {
  let parentSlots = useContext(SlotContext) ?? INITIAL_VALUE;
  let { slots = {}, children } = props;

  // Merge props for each slot from parent context and props
  let value = useMemo(
    () =>
      Object.keys(parentSlots)
        .concat(Object.keys(slots))
        .reduce(
          (o, p) => ({
            ...o,
            [p]: mergeProps(parentSlots[p] ?? {}, slots[p] ?? {}),
          }),
          {},
        ),
    [parentSlots, slots],
  );

  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
}

export function ClearSlots(props) {
  const { children, ...otherProps } = props;
  let content = children;

  if (Children.toArray(children).length <= 1) {
    if (typeof children === 'function') {
      // need to know if the node is a string or something else that react can render that doesn't get props
      content = cloneElement(Children.only(children), otherProps);
    }
  }

  return (
    <SlotContext.Provider value={INITIAL_VALUE}>{content}</SlotContext.Provider>
  );
}
