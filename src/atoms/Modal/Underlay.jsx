import React from 'react';
import { modAttrs } from '../../utils/react';
import { Base } from '../../components/Base';
import { useContextStyles } from '../../providers/Styles';

const UNDERLAY_STYLES = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  z: 1,
  transitionDelay: '0ms',
  // visibility: {
  //   '': 'hidden',
  //   open: 'visible',
  // },
  opacity: {
    '': 0,
    open: .9999,
  },
  pointerEvents: {
    '': 'none',
    open: 'auto',
  },
  fill: '#dark.30',
  overflow: 'hidden',
  transition: 'transform .25s ease-in-out, opacity .25s linear, visibility 0ms linear',
};

const Underlay = ({ isOpen }) => {
  const styles = {
    ...UNDERLAY_STYLES,
    ...useContextStyles('Underlay'),
  };

  return (
    <Base data-qa="Underlay" styles={styles} {...modAttrs({ open: isOpen })} />
  );
};

let _Underlay = React.forwardRef(Underlay);
export { _Underlay as Underlay };
