/**
 * Converts property value to string based on NUMBER type (or array of numbers).
 * @param val {string} - provided value.
 * @return {string|null}
 */
export function numUnit(val) {
  if (val == null) return null;

  if (val !== val) return null;

  if (typeof val === 'number') {
    return `${val.toFixed(3)}px`;
  }

  if (Array.isArray(val)) {
    return val.map(numUnit).join(' ');
  }

  return String(val);
}

export function splitString(str) {
  return str.split(/\s+/g);
}
