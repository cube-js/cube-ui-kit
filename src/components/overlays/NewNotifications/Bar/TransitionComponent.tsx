import { forwardRef, PropsWithChildren, useCallback, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';

import { tasty } from '../../../../tasty';

import type { TransitionProps } from 'react-transition-group/Transition';

const CSS_TRANSITION_CLASS_NAME = 'cube-notifications-css-transition';
const TRANSITION_TIMEOUT = 250;

export type TransitionComponentProps = PropsWithChildren<
  Partial<TransitionProps>
>;

const TransitionElement = tasty({
  styles: {
    transitionProperty: 'height, opacity, margin-top, margin-bottom',
    transitionDuration: `${TRANSITION_TIMEOUT}ms`,
    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',

    height: {
      [`.${CSS_TRANSITION_CLASS_NAME}-enter`]: 0,
      [`.${CSS_TRANSITION_CLASS_NAME}-enter-active`]: '$notification-size',
      [`.${CSS_TRANSITION_CLASS_NAME}-exit`]: '$notification-size',
      [`.${CSS_TRANSITION_CLASS_NAME}-exit-active`]: 0,
    },
    opacity: {
      [`.${CSS_TRANSITION_CLASS_NAME}-enter`]: 0,
      [`.${CSS_TRANSITION_CLASS_NAME}-enter-active`]: 1,
      [`.${CSS_TRANSITION_CLASS_NAME}-exit`]: 1,
      [`.${CSS_TRANSITION_CLASS_NAME}-exit-active`]: 0,
    },
    willChange: {
      [`.${CSS_TRANSITION_CLASS_NAME}-enter`]: 'height, opacity',
      [`.${CSS_TRANSITION_CLASS_NAME}-enter-active`]: 'height, opacity',
      [`.${CSS_TRANSITION_CLASS_NAME}-exit`]: 'height, opacity, margin-top',
      [`.${CSS_TRANSITION_CLASS_NAME}-exit-active`]: 'height, opacity',
    },
    marginTop: {
      [`.${CSS_TRANSITION_CLASS_NAME}-exit-active`]: '-1x',
    },
  },
});

const TransitionWrapper = forwardRef<HTMLDivElement, PropsWithChildren>(
  function TransitionWrapper({ children }, ref) {
    return <TransitionElement ref={ref}>{children}</TransitionElement>;
  },
);

export function TransitionComponent(props: TransitionComponentProps) {
  const { children, ...transitionProps } = props;
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const calculateNotificationSize = useCallback(() => {
    if (notificationRef.current) {
      notificationRef.current.style.setProperty(
        '--notification-size',
        `${notificationRef.current.scrollHeight}px`,
      );
    }
  }, []);

  return (
    <CSSTransition
      unmountOnExit
      mountOnEnter
      nodeRef={notificationRef}
      timeout={TRANSITION_TIMEOUT}
      classNames={CSS_TRANSITION_CLASS_NAME}
      onEnter={calculateNotificationSize}
      onExit={calculateNotificationSize}
      {...transitionProps}
    >
      <TransitionWrapper ref={notificationRef}>{children}</TransitionWrapper>
    </CSSTransition>
  );
}
