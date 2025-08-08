import { tasty } from '../../../tasty';
import { Space } from '../../layout/Space';

export const SectionHeading = tasty(Space, {
  qa: 'SectionHeading',
  as: 'div',
  styles: {
    color: '#dark-04',
    preset: 'c2',
    padding: '.5x 1x',
    height: '3x',
    placeContent: 'center space-between',
    align: 'start',
  },
});
