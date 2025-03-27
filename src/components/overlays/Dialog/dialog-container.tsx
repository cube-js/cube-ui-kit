import {
  useState,
  useMemo,
  ComponentProps,
  ComponentType,
  useRef,
} from 'react';

import { useEvent } from '../../../_internal/index';

import { DialogContainer } from './DialogContainer';

/**
 * Generic hook to manage a dialog component.
 *
 * @param Component - A React component that represents the dialog content. It must accept props of type P.
 * @returns An object with `open` function to open the dialog with provided props and `rendered` JSX element to include in your component tree.
 */
export function useDialogContainer<
  P,
  E = ComponentProps<typeof DialogContainer>,
>(Component: ComponentType<P>) {
  const [isOpen, setIsOpen] = useState(false);
  const [componentProps, setComponentProps] = useState<P | null>(null);
  const [containerProps, setContainerProps] = useState<E | null>(null);
  const setupRef = useRef(false);

  // 'open' accepts props required by the Component and opens the dialog
  const open = useEvent((props: P, containerProps?: E) => {
    if (!setupRef.current) {
      throw new Error(
        'useDialogContainer: DialogContainer must be rendered. Use `rendered` property to include it in your component tree.',
      );
    }

    setComponentProps(props);
    setContainerProps(containerProps ?? null);
    setIsOpen(true);
  });

  const update = useEvent((props: P, containerProps?: E) => {
    if (!setupRef.current) {
      throw new Error(
        'useDialogContainer: DialogContainer must be rendered. Use `rendered` property to include it in your component tree.',
      );
    }

    setComponentProps(props);
    setContainerProps(containerProps ?? null);
  });

  const close = useEvent(() => {
    setIsOpen(false);
  });

  // Render the dialog only when componentProps is set
  const renderedDialog = useMemo(() => {
    if (!componentProps) return null;

    return (
      <DialogContainer
        isOpen={isOpen}
        onDismiss={close}
        {...(containerProps ?? {})}
      >
        <Component {...componentProps} />
      </DialogContainer>
    );
  }, [componentProps, containerProps, isOpen]);

  return {
    open,
    update,
    close,
    get rendered() {
      setupRef.current = true;

      return renderedDialog;
    },
  };
}
