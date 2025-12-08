import { ReactNode } from 'react';

import { Styles } from '../../tasty';

import { Text } from './Text';

/**
 * Highlights occurrences of a search string within text.
 * Returns an array of ReactNodes with highlighted portions wrapped in Text.Highlight.
 */
export function highlightText(
  text: string,
  highlight: string,
  caseSensitive: boolean,
  highlightStyles?: Styles,
): ReactNode[] {
  if (!highlight) {
    return [text];
  }

  const flags = caseSensitive ? 'g' : 'gi';
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedHighlight})`, flags);
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isMatch = caseSensitive
      ? part === highlight
      : part.toLowerCase() === highlight.toLowerCase();

    if (isMatch) {
      return (
        <Text.Highlight key={index} styles={highlightStyles}>
          {part}
        </Text.Highlight>
      );
    }
    return part;
  });
}
