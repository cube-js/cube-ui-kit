import {
  createContext,
  FC,
  MutableRefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

interface MenuTriggerController {
  actionButtonRect: DOMRect | null;
  actionId: string;
  hideMenu: () => void;
  menuRef: MutableRefObject<HTMLElement | null>;
  menuVisibility: boolean;
  showMenu: (rects: DOMRect, actionId: string) => void;
}

export const MenuTriggerContext = createContext<MenuTriggerController | null>(
  null,
);

export const MenuTrigger: FC = (props) => {
  const { children } = props;

  const [actionButtonRect, setActionButtonRect] = useState<DOMRect | null>(
    null,
  );
  const [actionId, setActionId] = useState('');
  const [menuVisibility, setMenuVisibility] = useState(false);

  const menuRef = useRef<HTMLElement>(null);

  const controller = useMemo<MenuTriggerController>(
    () => ({
      actionButtonRect,
      actionId,
      menuRef,
      menuVisibility,

      hideMenu: () => {
        setMenuVisibility(false);
      },
      showMenu: (rect, actionId) => {
        setActionButtonRect(rect);
        setActionId(actionId);
        setMenuVisibility(true);
      },
    }),
    [menuVisibility],
  );

  useEffect(() => {
    const hideMenu = () => setMenuVisibility(false);

    window.addEventListener('scroll', hideMenu);
    document.addEventListener('visibilitychange', hideMenu);

    return () => {
      window.removeEventListener('scroll', hideMenu);
      document.removeEventListener('visibilitychange', hideMenu);
    };
  }, []);

  return (
    <MenuTriggerContext.Provider value={controller}>
      {children}
    </MenuTriggerContext.Provider>
  );
};
