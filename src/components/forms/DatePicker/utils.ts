import { createDOMRef } from '@react-spectrum/utils';
import { createFocusManager } from '@react-aria/focus';
import { FocusableRef } from '@react-types/shared';
import { SpectrumDatePickerBase } from '@react-types/datepicker';
import { useDateFormatter } from '@react-aria/i18n';
import { useDisplayNames } from '@react-aria/datepicker';
import { useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useLayoutEffect } from '@react-aria/utils';

export function useFormatHelpText(
  props: Pick<SpectrumDatePickerBase, 'description' | 'showFormatHelpText'>,
) {
  let formatter = useDateFormatter({ dateStyle: 'short' });
  let displayNames = useDisplayNames();
  return useMemo(() => {
    if (props.description) {
      return props.description;
    }

    if (props.showFormatHelpText) {
      return formatter
        .formatToParts(new Date())
        .map((s) => {
          if (s.type === 'literal') {
            return s.value;
          }

          return displayNames.of(s.type);
        })
        .join(' ');
    }

    return '';
  }, [props.description, props.showFormatHelpText, formatter, displayNames]);
}

export function useVisibleMonths(maxVisibleMonths: number) {
  let [visibleMonths, setVisibleMonths] = useState(getVisibleMonths('large'));
  useLayoutEffect(() => {
    let onResize = () => setVisibleMonths(getVisibleMonths('large'));
    onResize();

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return Math.max(1, Math.min(visibleMonths, maxVisibleMonths, 3));
}

function getVisibleMonths(scale) {
  if (typeof window === 'undefined') {
    return 1;
  }
  let monthWidth = scale === 'large' ? 336 : 280;
  let gap = scale === 'large' ? 30 : 24;
  let popoverPadding = scale === 'large' ? 32 : 48;
  return Math.floor(
    (window.innerWidth - popoverPadding * 2) / (monthWidth + gap),
  );
}

export function useFocusManagerRef(ref: FocusableRef<HTMLElement>) {
  let domRef = useRef();
  useImperativeHandle(ref, () => ({
    // @ts-ignore
    ...createDOMRef(domRef),
    focus() {
      // @ts-ignore
      createFocusManager(domRef).focusFirst({ tabbable: true });
    },
  }));
  return domRef;
}
