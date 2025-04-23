import { useSSRSafeId } from '@react-aria/ssr';
import { useEffect, useRef, useState } from 'react';

import { useLayoutEffect } from './useLayoutEffect';

let idsUpdaterMap = new Map();

/**
 * If a default is not provided, generate an id.
 * @param defaultId - Default component id.
 */
export function useId(defaultId?) {
  let isRendering = useRef(true);

  isRendering.current = true;

  let [value, setValue] = useState(defaultId);
  let nextId = useRef(null);

  // don't memo this, we want it new each render so that the Effects always run

  let updateValue = (val) => {
    if (!isRendering.current) {
      setValue(val);
    } else {
      nextId.current = val;
    }
  };

  useLayoutEffect(() => {
    isRendering.current = false;
  });

  useEffect(() => {
    let newId = nextId.current;
    if (newId) {
      setValue(newId);
      nextId.current = null;
    }
  }, [setValue, updateValue]);

  let res = useSSRSafeId(value);
  idsUpdaterMap.set(res, updateValue);
  return res;
}

/**
 * Merges two ids.
 * Different ids will trigger a side-effect and re-render components hooked up with `useId`.
 */
export function mergeIds(idA, idB) {
  if (idA === idB) {
    return idA;
  }

  let setIdA = idsUpdaterMap.get(idA);
  if (setIdA) {
    setIdA(idB);
    return idB;
  }

  let setIdB = idsUpdaterMap.get(idB);
  if (setIdB) {
    setIdB(idA);
    return idA;
  }

  return idB;
}

/**
 * Used to generate an id, and after render, check if that id is rendered so we know
 * if we can use it in places such as labelledby.
 */
export function useSlotId() {
  let [id, setId] = useState<string | null>(useId());
  useLayoutEffect(() => {
    if (id) {
      let setCurr = idsUpdaterMap.get(id);
      if (setCurr && !document.getElementById(id)) {
        setId(null);
      }
    }
  }, [id]);

  return id;
}
