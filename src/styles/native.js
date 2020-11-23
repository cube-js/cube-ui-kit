import { createRule, parseStyle } from '../utils/styles';

export default function createNativeStyle(styleName, cssStyle, parseUnits) {
  const NativeStyle = function(styles) {
    let value = styles[styleName];

    if (!value) return '';

    if (parseUnits) {
      value = parseStyle(value, 1).value;
    }

    return createRule(cssStyle || styleName, value);
  };

  NativeStyle.__styleLookup = [styleName];

  return NativeStyle;
}
