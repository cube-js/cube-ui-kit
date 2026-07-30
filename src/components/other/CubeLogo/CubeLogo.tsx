import { tasty } from '@tenphi/tasty';
import { ForwardedRef, forwardRef } from 'react';

import { CubeIconProps, Icon } from '../../../icons/Icon';

/**
 * Cube logo marks.
 *
 * The mark is two *different drawings*, not one drawing recoloured: the light
 * variant is an outlined cube, the dark variant is filled differently so it keeps
 * its weight against a dark surface. Both are rendered and swapped by the global
 * `@dark` state rather than picked in JS, so the logo follows the scheme without a
 * re-render and works in SSR.
 *
 * Both marks are drawn with `currentColor`, so colour comes from the surrounding
 * text colour (or an explicit `color` prop) — never a baked-in hex. That is the
 * whole reason the previous `CloudLogo` had to go: it hard-coded the old brand
 * hexes and could not adapt.
 */

const MARK_LIGHT_PATH =
  'M12.3428 0.468443C13.3139 -0.0982146 14.5153 -0.0984244 15.4863 0.468443L25.7051 6.43426C26.1063 6.66852 26.3535 7.09853 26.3535 7.56317V11.9008C26.3534 12.1325 26.2301 12.347 26.0303 12.4642L23.8356 13.8389L25.7109 14.8737C26.1088 15.1088 26.3534 15.5366 26.3535 15.9987V20.4352C26.3535 20.8999 26.1063 21.3298 25.7051 21.5641L15.4834 27.53C14.5123 28.0967 13.3119 28.0968 12.3408 27.53L2.11914 21.5641C1.71803 21.3298 1.47168 20.8998 1.47168 20.4352V7.56317C1.47178 7.09851 1.71879 6.66848 2.12012 6.43426L12.3428 0.468443ZM14.7002 1.77118C14.2147 1.4878 13.6144 1.48791 13.1289 1.77118L3.18164 7.57587C3.06086 7.64635 2.98649 7.77589 2.98633 7.91571V20.0085L12.873 14.3005C13.5161 13.9292 14.3091 13.9292 14.9521 14.3005L24.8389 20.0095V16.3513C24.8388 16.2116 24.764 16.082 24.6436 16.0114L14.6982 10.197C14.2129 9.91323 13.6117 9.91297 13.126 10.196L6.38477 14.1247C6.13553 14.2695 5.82263 14.0897 5.82227 13.8015V10.3942C5.82238 10.188 5.93134 9.99713 6.1084 9.89129L12.8613 5.85614C13.5101 5.46859 14.3183 5.4637 14.9717 5.84344L24.8389 11.5788V7.91571C24.8387 7.77604 24.7641 7.64643 24.6436 7.57587L14.7002 1.77118Z';

const MARK_DARK_PATH =
  'M25.9002 6.65073C26.2344 6.84455 26.44 7.20162 26.44 7.5879L26.4396 11.3066C26.4395 11.6899 26.2369 12.0447 25.9067 12.2395L22.6916 14.1362L25.9094 16.0449C26.2383 16.24 26.44 16.5941 26.44 16.9766V20.6864C26.44 21.0743 26.2326 21.4327 25.8961 21.6258L15.6128 27.5294C14.6148 28.1023 13.387 28.0996 12.3914 27.5223L2.09765 21.5528C1.7635 21.359 1.55781 21.002 1.55781 20.6157V7.58789C1.55781 7.20162 1.76349 6.84457 2.09764 6.65079L13.049 0.299736C13.6372 -0.0413849 14.363 -0.0413542 14.9512 0.299815L25.9002 6.65073ZM3.08936 20.3607C2.9078 20.4649 2.90801 20.7268 3.08974 20.8307L13.0565 26.5279C13.641 26.8619 14.3587 26.861 14.9423 26.5254L24.821 20.8447C25.0017 20.7408 25.0022 20.4802 24.8218 20.3756L14.9425 14.6505C14.3571 14.3112 13.6353 14.3097 13.0485 14.6464L3.08936 20.3607ZM5.55497 9.75456C5.3906 9.85215 5.28984 10.0292 5.28984 10.2203V13.6284C5.28984 13.8379 5.51738 13.968 5.69791 13.8619L13.0363 9.54766C13.631 9.19804 14.3687 9.19907 14.9624 9.55035L21.2322 13.26C21.4021 13.3605 21.6131 13.3607 21.7831 13.2604L24.8318 11.4632C25.0105 11.3579 25.0093 11.0991 24.8297 10.9954L14.9614 5.29588C14.3677 4.95297 13.6351 4.95738 13.0455 5.3074L5.55497 9.75456Z';

const WORDMARK_PATH =
  'M52.1689 16.0085C52.1689 18.0202 53.5876 19.2742 55.3838 19.2742C57.1215 19.274 58.5107 18.02 58.5107 16.0085V7.46362H61.5527V15.7761C61.5526 19.6552 58.8592 22.1041 55.3857 22.1042C51.8518 22.1042 49.1584 19.6553 49.1582 15.7761V7.46362H52.1689V16.0085ZM68.2725 9.2146C69.3445 7.90193 71.0524 7.14436 73.0215 7.14429C77.0745 7.14226 79.999 10.3792 79.999 14.6375C79.999 18.8957 77.0747 22.1042 73.0498 22.1042C70.964 22.1042 69.1394 21.26 68.0693 19.8015V21.7849H65.2314V0.6521H68.2725V9.2146ZM90.0576 7.14233C93.851 7.14255 96.6309 9.94205 96.6309 13.7039C96.6308 14.4918 96.4859 15.2518 96.3994 15.6306H85.8008C86.2072 17.9925 88.0019 19.3923 90.4336 19.3923C92.0849 19.3923 93.3865 18.7502 94.5752 17.7009L96.0234 19.8015C94.5169 21.2297 92.6055 22.1042 90.3467 22.1042C85.9457 22.1042 82.7012 18.8673 82.7012 14.6375C82.7012 10.438 85.9161 7.14233 90.0576 7.14233ZM40.5293 7.14233C43.2224 7.14248 45.3056 8.45506 46.5225 10.4666L44.3809 12.158C43.4536 10.8452 42.2663 9.97046 40.5586 9.97046C37.952 9.97067 36.0996 12.0122 36.0996 14.6072C36.0996 17.2608 37.952 19.272 40.5586 19.2722C42.2381 19.2722 43.4254 18.4277 44.3809 17.115L46.5225 18.7781C45.2774 20.7896 43.1922 22.1021 40.5293 22.1023C36.3314 22.1043 33 18.837 33 14.6091C33 10.4096 36.3314 7.14233 40.5293 7.14233ZM72.5273 9.94409C70.3852 9.94409 68.2403 11.4022 68.2402 14.6394C68.2402 17.905 70.4133 19.3044 72.5273 19.3044C74.9891 19.3042 76.872 17.3803 76.8721 14.6091C76.8721 11.838 74.961 9.9443 72.5273 9.94409ZM89.9424 9.73706C87.9431 9.73916 86.322 11.109 85.8594 13.238H93.5908C93.5325 10.9914 91.8834 9.73706 89.9424 9.73706Z';

/** Mark artwork is square. */
const MARK_VIEW_BOX = '0 0 28 28';
/**
 * Full logo = mark (x 0–28) + wordmark (x 33–98) on one canvas, so the 5-unit
 * gap between them is part of the artwork rather than a layout concern.
 */
const FULL_VIEW_BOX = '0 0 98 28';
/** 98 / 28 — used to let width follow height automatically. */
const FULL_ASPECT_RATIO = '98 / 28';

const MarkPaths = () => (
  <>
    <path
      clipRule="evenodd"
      d={MARK_LIGHT_PATH}
      data-element="LightMark"
      fill="currentColor"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d={MARK_DARK_PATH}
      data-element="DarkMark"
      fill="currentColor"
      fillRule="evenodd"
    />
  </>
);

const SCHEME_SWAP = {
  LightMark: {
    display: { '': 'block', '@dark': 'none' },
  },
  DarkMark: {
    display: { '': 'none', '@dark': 'block' },
  },
} as const;

/**
 * Square Cube mark, sized through `Icon` — pass `size` (or any `Icon` style prop)
 * and both axes follow it.
 */
const CubeLogoElement = tasty(Icon, {
  qa: 'CubeLogo',
  styles: SCHEME_SWAP,
});

export const CubeLogo = forwardRef(function CubeLogo(
  props: CubeIconProps,
  ref: ForwardedRef<HTMLSpanElement>,
) {
  return (
    <CubeLogoElement aria-label="Cube" role="img" {...props} ref={ref}>
      <svg
        fill="none"
        viewBox={MARK_VIEW_BOX}
        xmlns="http://www.w3.org/2000/svg"
      >
        <MarkPaths />
      </svg>
    </CubeLogoElement>
  );
});

/**
 * Cube mark + wordmark.
 *
 * `size` sets the **height** only; the width follows the artwork's aspect ratio.
 * `Icon` is square by default (`width: '1em 1em'`), so both the wrapper and the
 * inner `svg` have their width released to `auto` and the ratio pinned with
 * `aspectRatio` — otherwise the wordmark would be squashed into a 1em box.
 */
const CubeFullLogoElement = tasty(Icon, {
  qa: 'CubeFullLogo',
  styles: {
    ...SCHEME_SWAP,
    // Height still comes from `$icon-size` via `Icon`; width must not.
    width: 'auto',
    aspectRatio: FULL_ASPECT_RATIO,

    Svg: {
      width: 'auto',
      height: '1em 1em',
      aspectRatio: FULL_ASPECT_RATIO,
    },
  },
});

export const CubeFullLogo = forwardRef(function CubeFullLogo(
  props: CubeIconProps,
  ref: ForwardedRef<HTMLSpanElement>,
) {
  return (
    <CubeFullLogoElement aria-label="Cube" role="img" {...props} ref={ref}>
      <svg
        fill="none"
        viewBox={FULL_VIEW_BOX}
        xmlns="http://www.w3.org/2000/svg"
      >
        <MarkPaths />
        <path d={WORDMARK_PATH} fill="currentColor" />
      </svg>
    </CubeFullLogoElement>
  );
});
