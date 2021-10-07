import { forwardRef, HTMLAttributes } from 'react';
import { Base } from '../../Base';
import { useContextStyles } from '../../../providers/StylesProvider';
import { Styles } from '../../../styles/types';

const UNDERLAY_STYLES: Styles = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 1,
  transitionDelay: '0ms',
  // visibility: {
  //   '': 'hidden',
  //   open: 'visible',
  // },
  opacity: {
    '': 0,
    open: 0.9999,
  },
  pointerEvents: {
    '': 'none',
    open: 'auto',
  },
  fill: '#dark.30',
  overflow: 'hidden',
  transition:
    'transform .25s ease-in-out, opacity .25s linear, visibility 0ms linear',
};

export interface CubeUnderlayProps extends HTMLAttributes<HTMLElement> {
  isOpen?: boolean;
}

const Underlay = ({ isOpen, ...otherProps }, ref) => {
  const styles = {
    ...UNDERLAY_STYLES,
    ...useContextStyles('Underlay'),
  };

  return (
    <Base
      ref={ref}
      data-qa="Underlay"
      styles={styles}
      mods={{
        open: isOpen,
      }}
      {...otherProps}
    />
  );
};

let _Underlay = forwardRef(Underlay);
export { _Underlay as Underlay };
