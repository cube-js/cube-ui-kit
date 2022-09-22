import { tasty } from '../../../tasty';

export const StyledThumb = tasty({
  styles: {
    width: '2x',
    height: '2x',
    fill: {
      '': '#purple',
      hovered: '#6B4FEE',
      dragged: '#7A77FF',
      disabled: '#A1A1B5',
    },
    shadow: '0px 2px 4px rgba(20, 20, 70, 0.2)',
    radius: '2r',
    border: {
      focused: '3px solid #CAC9FF',
      dragged: '2px solid #665DE8;',
    },
    boxSizing: {
      '': 'border-box',
      focused: 'content-box',
    },
  },
});

export const StyledSlide = tasty({
  styles: {
    position: 'absolute',
    fill: '#dark-05',
    height: '2px',
    radius: true,
  },
});

export const StyledSlideTrack = tasty({
  styles: {},
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
    width: '100% - 4x',
  },
});

export const StyledSlider = tasty({
  as: 'section',
  styles: {},
});
