import {
  createContext,
  FC,
  Key,
  ReactNode,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { styled } from '../../../styled';
import { Styles } from '../../../styles/types';
import { BaseProps, ContainerStyleProps } from '../../types';
import { useLayoutEffect } from '../../../utils/react';

import { MenuTriggerContext } from './MenuTrigger';

export interface MenuController {
  action: (id: Key) => void;
}

export interface MenuProps extends BaseProps, ContainerStyleProps {
  /** The contents of the collection */
  children?: ReactNode;

  onAction?: (id: Key) => void;
}

const Container = styled({
  name: 'MenuContainer',
  tag: 'div',
  styles: {
    backgroundColor: '#FFFFFF',
    borderRadius: '4px',
    boxShadow: '0 0 4px rgba(0,0,0,0.5)',
    display: 'block',
    padding: '8px 0',
    position: 'fixed',
    zIndex: 10,
    margin: '4px 0',
    opacity: {
      '': 0,
      show: 1,
    },
    transition: 'all 0.3s ease',
    visibility: {
      '': 'hidden',
      show: 'visible',
    },
  },
});

export const MenuContext = createContext<MenuController | null>(null);

export const Menu: FC<MenuProps> = (props) => {
  const { children, onAction = null } = props;

  const triggerContext = useContext(MenuTriggerContext);

  if (triggerContext === null) {
    console.warn(
      'Please only use the Menu component inside the MenuTrigger component',
    );
  }

  const [above, setAbove] = useState(false);
  const [show, setShow] = useState(false);
  const [styles, setStyles] = useState<Styles>();

  const containerRef = useRef<HTMLDivElement>(null);
  const visibility = triggerContext !== null && triggerContext.menuVisibility;

  const controller = useMemo<MenuController>(
    () => ({
      action: (id) => {
        if (onAction !== null) {
          onAction(id);
        }

        triggerContext?.hideMenu();
      },
    }),
    [onAction, triggerContext],
  );

  useLayoutEffect(() => {
    if (visibility) {
      const rects = triggerContext!.actionButtonRect!;

      const stylesValue: Styles = {
        left: rects.left,
        width: `min ${rects.width}px`,
      };

      if (!above) {
        stylesValue.top = rects.bottom;
      } else {
        stylesValue.bottom = window.innerHeight - rects.top;
      }

      setStyles(stylesValue);
    }
  }, [above, visibility]);

  useLayoutEffect(() => {
    const containerNode = containerRef.current;

    if (containerNode !== null) {
      const buttonRect = triggerContext!.actionButtonRect!;

      const isOutside
        = buttonRect.bottom + containerNode.offsetHeight >= window.innerHeight;

      if (isOutside !== above) {
        setAbove((value) => !value);
      }
    }
  }, [styles]);

  useLayoutEffect(() => {
    setShow(visibility);
  }, [styles]);

  useLayoutEffect(() => {
    if (!visibility) {
      setShow(false);
    }
  }, [visibility]);

  useImperativeHandle(
    triggerContext?.menuRef,
    () => {
      return containerRef.current!;
    },
    [triggerContext],
  );

  return visibility
    ? createPortal(
        <Container mods={{ show }} ref={containerRef} styles={styles}>
          <MenuContext.Provider value={controller}>
            {children}
          </MenuContext.Provider>
        </Container>,
        document.body,
      )
    : null;
};
