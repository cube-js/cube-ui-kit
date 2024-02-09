import { createDOMRef } from '@react-spectrum/utils';
import { createFocusManager } from '@react-aria/focus';
import { FocusableRef } from '@react-types/shared';
import { useImperativeHandle, useRef } from 'react';
import { DateSegment } from 'react-stately';

// export function useFormatHelpText(
//   props: Pick<SpectrumDatePickerBase, 'description' | 'showFormatHelpText'>,
// ) {
//   let formatter = useDateFormatter({ dateStyle: 'short' });
//   let displayNames = useDisplayNames();
//   return useMemo(() => {
//     if (props.description) {
//       return props.description;
//     }
//
//     if (props.showFormatHelpText) {
//       return formatter
//         .formatToParts(new Date())
//         .map((s) => {
//           if (s.type === 'literal') {
//             return s.value;
//           }
//
//           return displayNames.of(s.type);
//         })
//         .join(' ');
//     }
//
//     return '';
//   }, [props.description, props.showFormatHelpText, formatter, displayNames]);
// }

// export function useVisibleMonths(maxVisibleMonths: number) {
//   let [visibleMonths, setVisibleMonths] = useState(getVisibleMonths('large'));
//   useLayoutEffect(() => {
//     let onResize = () => setVisibleMonths(getVisibleMonths('large'));
//     onResize();
//
//     window.addEventListener('resize', onResize);
//     return () => {
//       window.removeEventListener('resize', onResize);
//     };
//   }, []);
//
//   return Math.max(1, Math.min(visibleMonths, maxVisibleMonths, 3));
// }

// function getVisibleMonths(scale) {
//   if (typeof window === 'undefined') {
//     return 1;
//   }
//   let monthWidth = scale === 'large' ? 336 : 280;
//   let gap = scale === 'large' ? 30 : 24;
//   let popoverPadding = scale === 'large' ? 32 : 48;
//   return Math.floor(
//     (window.innerWidth - popoverPadding * 2) / (monthWidth + gap),
//   );
// }

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

export function formatSegments(segments: DateSegment[]) {
  segments = JSON.parse(JSON.stringify(segments));

  segments.forEach((segment) => {
    if (segment.type === 'literal') {
      if (segment.text === '/') {
        segment.text = '-';
      }

      if (segment.text === ', ') {
        segment.text = ' ';
      }
    }
  });

  const year = segments.find((s) => s.type === 'year');

  if (year) {
    segments.splice(segments.indexOf(year), 1);
    segments.unshift(year);
  }

  const month = segments.find((s) => s.type === 'month');

  if (month) {
    segments.splice(segments.indexOf(month), 1);
    segments.splice(2, 0, month);
  }

  const day = segments.find((s) => s.type === 'day');

  if (day) {
    segments.splice(segments.indexOf(day), 1);
    segments.splice(4, 0, day);
  }

  return segments;
}
