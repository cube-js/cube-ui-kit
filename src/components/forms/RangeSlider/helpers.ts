export type SliderValue = number[];

export function getRanges(value) {
  if (Array.isArray(value)) {
    return value.length >= 2 ? [0, 1] : [0];
  }

  return [0];
}

export function isNumber(val): val is number {
  return typeof val === 'number';
}

export function isValueValid(value?: SliderValue): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    isNumber(value[0]) &&
    isNumber(value[1])
  );
}

export function getValidValue(value?: SliderValue, min?: number, max?: number) {
  if (isValueValid(value)) {
    // try to fix jumbled values
    let minVal = Math.min(...value);
    let maxVal = Math.max(...value);

    // try to fix wrong min value
    if (isNumber(min) && minVal < min) {
      minVal = min;
    }

    // try to fix wrong max value
    if (isNumber(max) && maxVal >= max) {
      maxVal = max;
    }

    return [minVal, maxVal];
  }

  return value;
}

export function getMinMaxValue(
  min?: number,
  max?: number,
  value?: SliderValue,
) {
  if (isNumber(min) && isNumber(max)) {
    if (isValueValid(value)) {
      const minValue = Math.min(...value);
      const maxValue = Math.max(...value);

      // try to set min and max from value if they overflows
      return [Math.min(min, max, minValue), Math.max(min, max, maxValue)];
    }

    // also try to fix jumbled min and max
    return [Math.min(min, max), Math.max(min, max)];
  }

  return [min, max];
}
