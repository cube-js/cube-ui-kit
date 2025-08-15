import { tasty } from '../../../tasty';

export const StyledCommandMenu = tasty({
  qa: 'CommandMenu',
  styles: {
    display: 'grid',
    flow: 'row',
    gridColumns: 'minmax(0, 1fr)',
    gridRows: {
      '': 'max-content minmax(0, 1fr)',
      header: 'max-content max-content minmax(0, 1fr)',
      footer: 'max-content minmax(0, 1fr) max-content max-content',
      'header & footer':
        'max-content max-content minmax(0, 1fr) max-content max-content',
    },
    placeContent: 'stretch',
    placeItems: 'stretch',
    fill: '#white',
    border: '#border',
    radius: '(1cr + 1bw)',
    shadow: {
      '': false,
      'popover | tray': '0px 5px 15px #dark.05',
    },
    overflow: 'hidden',
    height: {
      '': 'initial',
      popover: 'initial max-content (50vh - $size-md)',
      tray: 'initial max-content (100vh - $size-md)',
    },
  },
});

export const StyledSearchInput = tasty({
  qa: 'SearchInput',
  as: 'input',
  styles: {
    display: 'grid',
    width: '100%',
    color: '#dark',
    fill: '#clear',
    border: '#border bottom',
    outline: 'none',
    transition: 'theme',
    radius: 0,
    textAlign: 'left',
    reset: 'input',
    preset: 't3',
    margin: 0,
    boxSizing: 'border-box',
    userSelect: 'auto',
    height: '($size + 1x)',
    padding: {
      '': '.5x $inline-padding',
      prefix: '0 $inline-padding 0 .5x',
    },

    $size: {
      '': '$size-md',
      '[data-size="small"]': '$size-sm',
      '[data-size="medium"]': '$size-md',
      '[data-size="large"]': '$size-lg',
    },
    '$inline-padding':
      'max($min-inline-padding, (($size - 1lh) / 2 + $inline-compensation - 1bw))',
    '$inline-compensation': '1x',
    '$min-inline-padding': '1x',
  },
});

export const StyledLoadingWrapper = tasty({
  qa: 'LoadingWrapper',
  styles: {
    display: 'flex',
    padding: '2x',
    placeContent: 'center',
    placeItems: 'center',
    color: '#dark-03',
  },
});

export const StyledEmptyState = tasty({
  qa: 'EmptyState',
  styles: {
    display: 'flex',
    padding: '2x',
    placeContent: 'center',
    placeItems: 'center',
    color: '#dark-03',
    preset: 't3',
  },
});

export const StyledMenuWrapper = tasty({
  qa: 'MenuWrapper',
  styles: {
    display: 'grid',
    flow: 'row',
    gridColumns: 'minmax(0, 1fr)',
    placeContent: 'stretch',
    placeItems: 'stretch',
    width: '100%',
    overflow: 'auto',
    scrollbar: 'styled',
  },
});
