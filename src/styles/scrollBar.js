export function scrollBarStyle({ scrollBar }) {
  if (scrollBar == null) return null;

  if (!scrollBar) {
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
      '--local-scrollbar-thumb-color':
        'var(--scrollbar-thumb-color, rgba(var(--text-color-rgb), .5))',
      '--local-scrollbar-border-color':
        'var(--scrollbar-border-color, var(--border-width))',
      '--local-scrollbar-bg-color':
        'var(--scrollbar-bg-color, var(--grey-light-color))',
    },
    {
      $: '::-webkit-scrollbar',
      width: 'calc(var(--gap) * 1.5)',
      height: 'calc(var(--gap) * 1.5)',
    },
    {
      $: '::-webkit-scrollbar-track',
      'background-color': 'var(--local-scrollbar-bg-color)',
    },
    {
      $: '::-webkit-scrollbar-thumb',
      'background-color': 'var(--local-scrollbar-thumb-color)',
      'border-radius': 'calc(var(--radius) * 1.5)',
      border: 'var(--outline-width) solid transparent',
      'background-clip': 'padding-box',
    },
    {
      $: '::-webkit-scrollbar-corner',
      'background-color': 'transparent',
    },
    {
      'scrollbar-width': 'thin',
      'scrollbar-color':
        'var(--local-scrollbar-bg-color) var(--local-scrollbar-thumb-color)',
    },
  ];
}

scrollBarStyle.__lookupStyles = ['scrollBar'];
