import {
  ComponentProps,
  ComponentType,
  useMemo,
  useRef,
  useState,
} from 'react';
import { VisuallyHidden } from 'react-aria';

import { useEvent } from '../../_internal';
import { mergeProps } from '../../utils/react';

import { MenuTrigger } from './Menu';

/**
 * Generic hook to manage an anchored menu component.
 *
 * @param Component - A React component that represents the menu content (Menu or CommandMenu).
 * @param defaultTriggerProps - Default props to pass to the MenuTrigger.
 * @returns An object with `anchorRef` to position the menu, `open` function to open the menu with provided props, `close` function to close the menu, and `rendered` JSX element to include in your component tree.
 */
export function useAnchoredMenu<P, T = ComponentProps<typeof MenuTrigger>>(
  Component: ComponentType<P>,
  defaultTriggerProps?: Omit<
    ComponentProps<typeof MenuTrigger>,
    'children' | 'isOpen' | 'onOpenChange' | 'targetRef'
  >,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [componentProps, setComponentProps] = useState<P | null>(null);
  const [triggerProps, setTriggerProps] = useState<T | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const setupRef = useRef(false);

  function setupCheck() {
    if (!setupRef.current) {
      throw new Error(
        'useAnchoredMenu: MenuTrigger must be rendered. Use `rendered` property to include it in your component tree.',
      );
    }
  }

  // 'open' accepts props required by the Component and opens the menu
  const open = useEvent((props: P, triggerProps?: T) => {
    setupCheck();

    setComponentProps(props);
    setTriggerProps(triggerProps ?? null);
    setIsOpen(true);
  });

  const update = useEvent((props: P, triggerProps?: T) => {
    setupCheck();

    setComponentProps(props);
    setTriggerProps(triggerProps ?? null);
  });

  const close = useEvent(() => {
    setIsOpen(false);
  });

  // Render the menu only when componentProps is set
  const renderedMenu = useMemo(() => {
    if (!componentProps) return null;

    return (
      <MenuTrigger
        isOpen={isOpen}
        targetRef={anchorRef}
        placement="bottom start"
        onOpenChange={setIsOpen}
        {...mergeProps(defaultTriggerProps, triggerProps || undefined)}
      >
        <VisuallyHidden>
          <button aria-label="context-menu" />
        </VisuallyHidden>
        <Component {...componentProps} />
      </MenuTrigger>
    );
  }, [componentProps, triggerProps, isOpen, defaultTriggerProps]);

  return {
    anchorRef,
    open,
    update,
    close,
    isOpen,
    get rendered() {
      setupRef.current = true;

      return renderedMenu;
    },
  };
}
