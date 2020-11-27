import { createRule, parseStyle } from '../utils/styles';
import { toSnakeCase } from '../utils/string';

export default function createNativeStyle(styleName, cssStyle, parseUnits) {
  const NativeStyle = function (styles) {
    let value = styles[styleName];

    if (!value) return '';

    if (parseUnits) {
      value = parseStyle(value, 1).value;
    }

    return createRule(cssStyle || toSnakeCase(styleName), value);
  };

  NativeStyle.__styleLookup = [styleName];

  return NativeStyle;
}
