import type { Styles } from '../tasty/styles/types';

/**
 * Color tokens with # prefix for tasty color definitions.
 * The tasty system automatically generates {name}-color-rgb variants.
 */
export const COLOR_TOKENS: Styles = {
  // Base colors
  '#pink': 'rgb(255 100 146)',
  '#pink-02': 'rgb(255 131 168)',

  '#purple': 'rgb(113 110 238)',
  '#purple-text': 'rgb(105 103 227)',
  '#purple-bg': 'rgb(241 239 250)',
  '#purple-icon': 'rgb(142 134 237)',
  '#purple-01': 'rgb(122 119 255)',
  '#purple-02': 'rgb(149 146 255)',
  '#purple-03': 'rgb(175 173 255)',
  '#purple-04': 'rgb(202 201 255)',

  '#focus': 'rgb(172 163 238)',

  '#text': 'rgb(91 92 125)',

  '#dark': 'rgb(25 26 46)',
  '#dark-01': 'rgb(25 26 46)',
  '#dark-02': 'rgb(69 68 98)',
  '#dark-03': 'rgb(115 114 139)',
  '#dark-04': 'rgb(161 161 178)',
  '#dark-05': 'rgb(213 213 222)',
  '#dark-bg': 'rgb(249 249 251)',

  '#light': 'rgb(246 246 248)',

  '#white': 'rgb(255 255 255)',
  '#black': 'rgb(0 0 0)',

  '#danger': 'rgb(227 70 75)',
  '#danger-text': 'rgb(208 57 56)',
  '#danger-bg': 'rgb(253 245 244)',
  '#danger-icon': 'rgb(245 101 99)',

  '#success': 'rgb(9 145 88)',
  '#success-text': 'rgb(12 135 82)',
  '#success-icon': 'rgb(40 165 104)',
  '#success-bg': 'rgb(238 249 242)',

  '#note': 'rgb(158 119 19)',
  '#note-text': 'rgb(150 112 8)',
  '#note-bg': 'rgb(253 245 233)',
  '#note-icon': 'rgb(181 140 44)',

  '#border': 'rgb(227 227 233)',
  '#light-border': 'rgb(227 227 233)',

  '#placeholder': '#dark-03',

  // Semantic colors
  '#clear': 'transparent',
  '#border-opaque': 'rgb(227 227 233)',
  '#shadow': '#dark.06',
  '#draft': '#dark.2',
  '#minor': '#dark.65',
  '#danger-bg-hover': '#danger.1',
  '#dark-75': '#dark.75',
  '#primary': '#purple',

  // Pink opacity variants
  '#pink-8': '#pink.2',
  '#pink-9': '#pink.1',

  // Disabled state colors
  '#disabled': '#dark-01.25',
  '#disabled-text': '#dark-01.25',
  '#disabled-bg': '#dark-05.2',
};
