import { ReactElement, useRef } from 'react';

export interface RenderCacheProps<T> {
  items: T[];
  renderKeys: (string | number)[];
  getKey: (item: T) => string | number;
  children: (item: T) => ReactElement;
}

/**
 * RenderCache optimizes rendering of item lists by reusing
 * previously rendered elements for unchanged items.
 */
export function RenderCache<T>({
  items,
  renderKeys,
  getKey,
  children,
}: RenderCacheProps<T>): ReactElement {
  // Store previous renders
  const cacheRef = useRef<Map<string | number, ReactElement>>(new Map());

  const rendered = items.map((item) => {
    const key = getKey(item);
    const shouldRerender = renderKeys.includes(key);
    const cached = cacheRef.current.get(key);

    if (!cached || shouldRerender) {
      const element = children(item);
      cacheRef.current.set(key, element);
      return element;
    }

    return cached;
  });

  // Optionally clean up cache for items no longer present
  const currentKeys = new Set(items.map(getKey));
  for (const key of cacheRef.current.keys()) {
    if (!currentKeys.has(key)) {
      cacheRef.current.delete(key);
    }
  }

  return <>{rendered}</>;
}
