import { parseStyle } from '../utils/styles';

interface DisplayStyleProps {
  display?: string;
  hide?: boolean;
  textOverflow?: string | boolean;
  overflow?: string;
  whiteSpace?: string;
}

/**
 * Handles display, hide, textOverflow, overflow, and whiteSpace styles.
 *
 * textOverflow syntax:
 * - `textOverflow="ellipsis"` - single-line truncation with ellipsis
 * - `textOverflow="ellipsis / 3"` - multi-line clamping (3 lines) with ellipsis
 * - `textOverflow="clip"` - single-line truncation with clip (no ellipsis)
 * - `textOverflow="clip / 2"` - multi-line clip (2 lines)
 * - `textOverflow={true}` or `textOverflow="initial"` - reset to initial
 *
 * Priority:
 * 1. `hide` takes precedence (display: none)
 * 2. Multi-line `textOverflow` forces display: -webkit-box
 * 3. Single-line `textOverflow` forces white-space: nowrap and overflow: hidden
 */
export function displayStyle({
  display,
  hide,
  textOverflow,
  overflow,
  whiteSpace,
}: DisplayStyleProps) {
  const result: Record<string, string | number> = {};

  // Handle textOverflow first to determine required overrides
  if (textOverflow != null && textOverflow !== false) {
    // Boolean true or 'initial' → reset to initial
    if (textOverflow === true || textOverflow === 'initial') {
      result['text-overflow'] = 'initial';
    } else {
      const processed = parseStyle(String(textOverflow));
      const group = processed.groups[0];

      if (group) {
        const { parts } = group;
        const modePart = parts[0];
        const clampPart = parts[1];

        const hasEllipsis = modePart?.mods.includes('ellipsis');
        const hasClip = modePart?.mods.includes('clip');

        // Get clamp value from second part (after /)
        let clamp = 1;
        if (clampPart?.values[0]) {
          const parsed = parseInt(clampPart.values[0], 10);
          if (!isNaN(parsed) && parsed > 0) {
            clamp = parsed;
          }
        }

        if (hasEllipsis || hasClip) {
          result['overflow'] = 'hidden';
          result['text-overflow'] = hasEllipsis ? 'ellipsis' : 'clip';

          if (clamp === 1) {
            result['white-space'] = 'nowrap';
          } else {
            result['display'] = '-webkit-box';
            result['-webkit-box-orient'] = 'vertical';
            result['-webkit-line-clamp'] = clamp;
            result['line-clamp'] = clamp;
          }
        }
      }
    }
  }

  // Apply user-specified values (only if not overridden by textOverflow)
  if (overflow && !result['overflow']) {
    result['overflow'] = overflow;
  }
  if (whiteSpace && !result['white-space']) {
    result['white-space'] = whiteSpace;
  }

  // Handle display (hide > textOverflow > user value)
  if (hide) {
    result['display'] = 'none';
  } else if (!result['display'] && display) {
    result['display'] = display;
  }

  // Return undefined if no styles to apply
  if (Object.keys(result).length === 0) {
    return;
  }

  return result;
}

displayStyle.__lookupStyles = [
  'display',
  'hide',
  'textOverflow',
  'overflow',
  'whiteSpace',
];
