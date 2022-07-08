import { useEvent } from './use-event';

export function useChainedCallback(
  ...callbacks: (((...args: any) => any) | null | undefined | boolean)[]
) {
  return useEvent((...args: any[]) => {
    callbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback(...args);
      }
    });
  });
}
