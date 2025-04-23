import { PropsWithChildren, useCallback, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import styled from 'styled-components';

import type { TransitionProps } from 'react-transition-group/Transition';

const CSS_TRANSITION_CLASS_NAME = 'cube-notifications-css-transition';
const TRANSITION_TIMEOUT = 250;

export type TransitionComponentProps = PropsWithChildren<
  Partial<TransitionProps>
>;

export function TransitionComponent(props: TransitionComponentProps) {
  const { children, ...transitionProps } = props;
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const calculateNotificationSize = useCallback(() => {
    if (notificationRef.current) {
      notificationRef.current.style.setProperty(
        '--__notification-size__',
        `${notificationRef.current.scrollHeight}px`,
      );
    }
  }, []);

  return (
    <CSSTransition
      unmountOnExit
      mountOnEnter
      timeout={TRANSITION_TIMEOUT}
      classNames={CSS_TRANSITION_CLASS_NAME}
      onEnter={calculateNotificationSize}
      onExit={calculateNotificationSize}
      {...transitionProps}
    >
      <Transition ref={notificationRef}>{children}</Transition>
    </CSSTransition>
  );
}

const Transition = styled.div`
  transition-property: height, opacity, margin-top, margin-bottom;
  transition-duration: ${TRANSITION_TIMEOUT}ms;
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);

  &.${CSS_TRANSITION_CLASS_NAME} {
    &-enter {
      height: 0;
      opacity: 0;
      will-change: height, opacity;
    }
    &-enter-active {
      height: var(--__notification-size__);
      opacity: 1;
      will-change: height, opacity;
    }
    &-exit {
      height: var(--__notification-size__);
      opacity: 1;
      will-change: height, opacity, margin-top;
    }
    &-exit-active {
      margin-top: -8px;
      height: 0;
      opacity: 0;
      will-change: height, opacity;
    }
  }
`;
