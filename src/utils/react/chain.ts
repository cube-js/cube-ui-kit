/**
 * Calls all functions in the order they were chained with the same arguments.
 */
export function chain(...callbacks) {
  return (...args) => {
    for (let callback of callbacks) {
      if (typeof callback === 'function') {
        callback(...args);
      }
    }
  };
}
