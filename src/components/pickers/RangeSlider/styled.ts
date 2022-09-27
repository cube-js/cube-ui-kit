import { tasty } from '../../../tasty';

export const StyledThumb = tasty({
  styles: {
    top: '2x',
    width: '2x',
    height: '2x',
    fill: {
      '': '#purple',
      hovered: '#purple-text',
      dragged: '#purple',
      disabled: '#dark-04',
    },
    cursor: {
      hovered: 'pointer',
      dragged: 'grab',
    },
    shadow: {
      '': '0px 2px 4px #dark.2',
      dragged: 'inset 0 0 0 2px #purple-text, 0px 2px 4px #dark.2',
    },
    radius: '50%',
    border: {
      '': null,
      focused: '3px solid #purple-04',
    },
    transition: 'theme',
  },
});

export const StyledSlide = tasty({
  styles: {
    top: '1.875x',
    position: 'absolute',
    fill: {
      '': '#dark-05',
      // disabled: '#dark-04',
    },
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
    fill: {
      '': '#purple',
      disabled: '#dark-04',
    },
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
    gap: {
      '': '0',
      inputs: '1x',
    },
    flexDirection: {
      '': 'column',
      inputs: 'row',
    },
    alignItems: 'center',
    width: '100%',
    padding: {
      '': '0',
      sideLabel: '0.75x top',
    },
  },
});

export const StyledContent = tasty({
  styles: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    width: '100%',
  },
});
