import { FC, useContext, useEffect, useImperativeHandle, useRef } from 'react';
import { PressEvent } from '@react-types/shared';

import { Button, CubeButtonProps } from '../../actions/Button/Button';

import { MenuTriggerContext } from './MenuTrigger';

const isInsideContainer = (
  container: HTMLElement,
  target: HTMLElement | null,
) => {
  let current = target;

  while (current !== null) {
    if (current === container) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
};

export const ActionButton: FC<CubeButtonProps> = (props) => {
  const { children, onPress, ...buttonProps } = props;

  const triggerContext = useContext(MenuTriggerContext);

  const actionIdRef = useRef('');
  const buttonRef = useRef<Element>();

  const handlePress = (event: PressEvent) => {
    if (triggerContext !== null) {
      if (triggerContext.menuVisibility) {
        if (triggerContext.actionId === actionIdRef.current) {
          triggerContext.hideMenu();
        }
      } else {
        const rect = event.target.getBoundingClientRect();
        triggerContext.showMenu(rect, actionIdRef.current);
      }
    }

    buttonRef.current = event.target;

    if (onPress) {
      onPress(event);
    }
  };

  useImperativeHandle(actionIdRef, () => Math.random().toString(16), []);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        triggerContext !== null
        && triggerContext.menuVisibility
        && triggerContext.actionId === actionIdRef.current
      ) {
        const target = event.target as HTMLElement;

        if (!isInsideContainer(triggerContext.menuRef.current!, target)) {
          triggerContext.hideMenu();
        }
      }
    };

    document.addEventListener('mousedown', handler, true);

    return () => {
      document.removeEventListener('mousedown', handler, true);
    };
  }, [triggerContext]);

  return (
    <Button onPress={handlePress} {...buttonProps}>
      {children}
    </Button>
  );
};
