import { mergeProps } from '@react-aria/utils';
import React, { useContext, useMemo } from 'react';

let SlotContext = React.createContext(null);

export function useSlotProps(props, defaultSlot) {
  let slot = props.slot || defaultSlot;
  let { [slot]: slotProps = {} } = useContext(SlotContext) || {};

  return mergeProps(slotProps, props);
}

export function SlotProvider(props) {
  let parentSlots = useContext(SlotContext) || {};
  let { slots = {}, children } = props;

  // Merge props for each slot from parent context and props
  let value = useMemo(
    () =>
      Object.keys(parentSlots)
        .concat(Object.keys(slots))
        .reduce(
          (o, p) => ({
            ...o,
            [p]: mergeProps(parentSlots[p] || {}, slots[p] || {}),
          }),
          {},
        ),
    [parentSlots, slots],
  );

  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
}

export function ClearSlots(props) {
  let { children, ...otherProps } = props;
  let content = children;
  if (React.Children.toArray(children).length <= 1) {
    if (typeof children === 'function') {
      // need to know if the node is a string or something else that react can render that doesn't get props
      content = React.cloneElement(React.Children.only(children), otherProps);
    }
  }
  return <SlotContext.Provider value={{}}>{content}</SlotContext.Provider>;
}
