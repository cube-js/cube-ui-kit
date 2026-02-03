import { useMemo } from 'react';

import { mergeStyles, Styles } from '../../tasty';

/**
 * Hook to merge base styles with sub-element style props.
 *
 * This simplifies the common pattern of accepting props like `tabListStyles`,
 * `prefixStyles`, etc. that should merge into `styles.TabList`, `styles.Prefix`, etc.
 *
 * @param styles - Base styles object
 * @param subStylesMap - Mapping of sub-element names to their additional styles
 * @returns Merged styles object
 *
 * @example
 * ```tsx
 * const { styles, tabListStyles, prefixStyles, suffixStyles, ...rest } = props;
 *
 * const mergedStyles = useMergeStyles(styles, {
 *   TabList: tabListStyles,
 *   Prefix: prefixStyles,
 *   Suffix: suffixStyles,
 * });
 *
 * return <TabsElement styles={mergedStyles} {...rest} />;
 * ```
 */
export function useMergeStyles(
  styles: Styles | undefined,
  subStylesMap: Record<string, Styles | undefined>,
): Styles {
  // Extract values for dependency array - must be stable
  const subStylesValues = Object.values(subStylesMap);

  return useMemo(() => {
    // Build sub-element styles object from the map
    const subStyles: Styles = {};

    for (const [element, elementStyles] of Object.entries(subStylesMap)) {
      if (elementStyles != null) {
        subStyles[element] = elementStyles;
      }
    }

    // Merge base styles with sub-element styles
    return mergeStyles(styles, subStyles);
  }, [styles, ...subStylesValues]);
}
