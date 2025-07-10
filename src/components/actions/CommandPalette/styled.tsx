import { tasty } from '../../../tasty';

export const StyledCommandPalette = tasty({
  qa: 'CommandPalette',
  styles: {
    display: 'grid',
    flow: 'row',
    gridColumns: '1fr',
    gridRows: 'auto minmax(0, 1fr)',
    fill: '#white',
    border: '#border',
    radius: '(1cr + 1bw)',
    boxShadow: '0px 5px 15px #dark.05',
    overflow: 'hidden',
    minWidth: '20x',
    maxWidth: '50x',
    maxHeight: '40x',
  },
});

export const StyledSearchWrapper = tasty({
  qa: 'SearchWrapper',
  styles: {
    display: 'flex',
    flow: 'row',
    align: 'center',
    padding: '1x',
    border: '#border bottom',
    fill: '#white',
    gap: '.75x',
  },
});

export const StyledSearchInput = tasty({
  qa: 'SearchInput',
  as: 'input',
  styles: {
    display: 'flex',
    flex: 1,
    border: 'none',
    outline: 'none',
    fill: 'transparent',
    color: '#dark',
    preset: 't3',
    padding: '0',

    '&::placeholder': {
      color: '#dark-03',
    },
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
