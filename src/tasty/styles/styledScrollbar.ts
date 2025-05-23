/**
 * @deprecated `styledScrollbar` is deprecated. Use `scrollbar` instead.
 */
export function styledScrollbarStyle({ styledScrollbar: val }) {
  if (val == null) return null;

  if (!val) {
    return [
      {
        $: '::-webkit-scrollbar',
        display: 'none',
      },
      {
        'scrollbar-width': 'none',
      },
    ];
  }

  return [
    {
      $: '::-webkit-scrollbar',
      width: 'var(--scrollbar-width)',
      height: 'var(--scrollbar-width)',
    },
    {
      $: '::-webkit-scrollbar-track',
      'background-color': 'var(--scrollbar-bg-color)',
    },
    {
      $: '::-webkit-scrollbar-thumb',
      'background-color': 'var(--scrollbar-thumb-color)',
      'border-radius': 'var(--scrollbar-radius)',
      border:
        'var(--scrollbar-outline-width) solid var(--scrollbar-outline-color)',
      'background-clip': 'padding-box',
    },
    {
      $: '::-webkit-scrollbar-corner',
      'background-color': 'var(--scrollbar-corner-color)',
    },
    // Breaks the scrollbar in the latest Chromium browsers
    // {
    //   'scrollbar-width': 'thin',
    //   'scrollbar-color':
    //     'var(--scrollbar-bg-color) var(--scrollbar-thumb-color)',
    // },
  ];
}

styledScrollbarStyle.__lookupStyles = ['styledScrollbar'];
