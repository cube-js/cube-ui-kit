import { useEffect } from 'react';
import { useFocusVisible } from 'react-aria';

import { createSharedStore } from './sharedStore';

interface ControlledFocusVisibleState {
  isManuallyActivated: boolean;
}

// Create a shared store for the controlled focus visible state
const useControlledFocusVisibleStore =
  createSharedStore<ControlledFocusVisibleState>('controlledFocusVisible', {
    isManuallyActivated: false,
  });

export interface UseControlledFocusVisibleResult {
  isFocusVisible: boolean;
  activateFocusVisible: () => void;
}

/**
 * A hook that shares its state using sharedStore and works like useFocusVisible from react-aria,
 * but also returns activateFocusVisible function that manually switches the state to true
 * until the original flag is switched to false.
 */
export function useControlledFocusVisible(): UseControlledFocusVisibleResult {
  // Get the original focus visible state from react-aria
  const { isFocusVisible: originalIsFocusVisible } = useFocusVisible({});

  // Get the shared store state and setter
  const [{ isManuallyActivated }, setStore] = useControlledFocusVisibleStore();

  // Reset manual activation when original focus visible becomes false
  useEffect(() => {
    if (!originalIsFocusVisible && isManuallyActivated) {
      setStore({ isManuallyActivated: false });
    }
  }, [originalIsFocusVisible, isManuallyActivated, setStore]);

  // Function to manually activate focus visible state
  const activateFocusVisible = () => {
    setStore({ isManuallyActivated: true });
  };

  // Return combined state: true if either original is true OR manually activated
  return {
    isFocusVisible: originalIsFocusVisible || isManuallyActivated,
    activateFocusVisible,
  };
}
