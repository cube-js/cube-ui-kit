import { mergeStyles, tasty } from '@tenphi/tasty';

import { StyledHeader } from '../../actions/Menu/styled';
import {
  DEFAULT_INPUT_STYLES,
  INPUT_WRAPPER_STYLES,
} from '../TextInput/TextInputBase';

/**
 * The chrome FilterListBox draws around its list: the frame, the search row
 * and the header above it. FilterPicker's tree mode draws the same chrome
 * around a `Tree`, so both read as one control.
 */

export const FilterListBoxWrapperElement = tasty({
  styles: {
    display: 'grid',
    flow: 'column',
    gridColumns: '1sf',
    gridRows: 'max-content max-content 1sf',
    gap: 0,
    position: 'relative',
    radius: true,
    color: '#dark-02',
    transition: 'theme',
    outline: {
      '': '#purple-03.0',
      'invalid & focused': '#danger.50',
      focused: '#purple-03',
    },
    border: {
      '': true,
      focused: '#primary-text',
      valid: '#success-text.50',
      invalid: '#danger-text.50',
      disabled: true,
      popover: false,
    },
  },
});

export const SearchWrapperElement = tasty({
  qa: 'FilterListBoxSearchWrapper',
  styles: mergeStyles(INPUT_WRAPPER_STYLES, {
    border: 'bottom',
    radius: '1r top',
    fill: '#clear',
    height: '($size + 1x)',
    $size: {
      '': '$size-md',
      'size=small': '$size-sm',
      'size=medium': '$size-md',
      'size=large': '$size-lg',
    },
  }),
});

export const SearchInputElement = tasty({
  as: 'input',
  styles: mergeStyles(DEFAULT_INPUT_STYLES, {
    fill: '#clear',
    padding: {
      '': '.5x 1.5x',
      prefix: '0 1.5x 0 .5x',
      suffix: '.5x .5x .5x 1.5x',
      'prefix & suffix': '0 .5x 0 .5x',
    },
  }),
});

export const StyledHeaderWithoutBorder = tasty(StyledHeader, {
  styles: {
    border: false,
  },
});
