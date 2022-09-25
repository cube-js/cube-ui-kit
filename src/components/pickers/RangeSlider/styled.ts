import { tasty } from '../../../tasty';

export const StyledThumb = tasty({
  styles: {
    top: '2x',
    width: '2x',
    height: '2x',
    fill: {
      '': '#purple',
      hovered: '#6B4FEE',
      dragged: '#7A77FF',
      disabled: '#A1A1B5',
    },
    cursor: {
      hovered: 'pointer',
      dragged: 'grab',
    },
    shadow: '0px 2px 4px rgba(20, 20, 70, 0.2)',
    radius: '50%',
    border: {
      focused: '3px solid #CAC9FF',
      dragged: '2px solid #665DE8;',
    },
    boxSizing: {
      '': 'border-box',
      focused: 'content-box',
      dragged: 'border-box',
    },
    transition: 'theme',
  },
});

export const StyledSlide = tasty({
  styles: {
    top: '1.875x',
    position: 'absolute',
    fill: '#dark-05',
    height: '2px',
    width: '100%',
    radius: true,
  },
});

export const StyledSlideTrack = tasty({
  styles: {
    position: 'absolute',
    '@start-range': {
      '': '@thumb-0-value',
      single: '0',
    },
    '@end-range': {
      '': '(1 - @thumb-1-value)',
      single: '(1 - @thumb-0-value)',
    },
    left: '(@start-range * 100%)',
    right: '(@end-range * 100%)',
    height: '2px',
    fill: '#purple',
    radius: true,
  },
});

export const StyledGradation = tasty({
  styles: {},
});

export const StyledGrade = tasty({
  styles: {},
});

export const StyledControls = tasty({
  styles: {
    position: 'relative',
    width: '100% - 2x',
    height: '4x',
  },
});

export const StyledSlider = tasty({
  as: 'section',
  styles: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
});
