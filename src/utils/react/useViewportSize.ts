import { useEffect, useState } from 'react';

interface ViewportSize {
  width: number;
  height: number;
}

let visualViewport = typeof window !== 'undefined' && window.visualViewport;

export type ViewportSizeParams = {
  isDisabled?: boolean;
};
export function useViewportSize(params: ViewportSizeParams = {}): ViewportSize {
  const { isDisabled } = params;

  let [size, setSize] = useState(() => getViewportSize());

  useEffect(() => {
    if (isDisabled) {
      return;
    }
    // Use visualViewport api to track available height even on iOS virtual keyboard opening
    let onResize = () => {
      setSize((size) => {
        let newSize = getViewportSize();
        if (newSize.width === size.width && newSize.height === size.height) {
          return size;
        }
        return newSize;
      });
    };

    if (!visualViewport) {
      window.addEventListener('resize', onResize);
    } else {
      visualViewport.addEventListener('resize', onResize);
    }

    return () => {
      if (!visualViewport) {
        window.removeEventListener('resize', onResize);
      } else {
        visualViewport.removeEventListener('resize', onResize);
      }
    };
  }, [isDisabled]);

  return size;
}

function getViewportSize(): ViewportSize {
  return {
    width:
      (visualViewport && visualViewport.width) ||
      (typeof window !== 'undefined' ? window.innerWidth : 0),
    height:
      (visualViewport && visualViewport.height) ||
      (typeof window !== 'undefined' ? window.innerHeight : 0),
  };
}
