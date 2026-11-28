type Props = {
  qa?: string;
  qaVal?: string;
  'data-qa'?: string;
  'data-qa-val'?: string;
};

/**
 * Processes QA props.
 * If `qa` or `qaVal` props are present, they are not modified and have higher priority.
 * Otherwise, maps `data-qa` to `qa` and `data-qa-val` to `qaVal`.
 * Data attributes are always removed.
 * Modifies the original props object without copying it.
 * Accepts only non-falsy values, otherwise deletes both props.
 *
 * @param props - The object to process
 * @returns The modified object
 */
export function useQaProps<T extends Props>(props: T): T {
  // Helper function to process qa attributes
  const processQaAttribute = (propName: string, dataAttrName: string) => {
    if (props[propName] !== undefined || props[dataAttrName] !== undefined) {
      const propValue = props[propName];
      const dataAttrValue = props[dataAttrName];

      if (!propValue) {
        if (dataAttrValue) {
          // If prop is empty but data-attr is truthy, map data-attr to prop
          props[propName] = dataAttrValue;
        } else {
          // Both values are falsy, delete both
          delete props[propName];
        }
      }

      delete props[dataAttrName];
    }
  };

  // Process qa attributes
  processQaAttribute('qa', 'data-qa');
  processQaAttribute('qaVal', 'data-qa-val');

  return props;
}
