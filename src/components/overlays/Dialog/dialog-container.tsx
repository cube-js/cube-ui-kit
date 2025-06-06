import {
  ComponentProps,
  ComponentType,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useEvent } from '../../../_internal/index';
import { mergeProps } from '../../../utils/react/index';

import { DialogContainer } from './DialogContainer';

/**
 * Generic hook to manage a dialog component.
 *
 * @param Component - A React component that represents the dialog content. It must accept props of type P.
 * @param defaultContainerProps - Default props to pass to the DialogContainer.
 * @returns An object with `open` function to open the dialog with provided props and `rendered` JSX element to include in your component tree.
 */
export function useDialogContainer<
  P,
  E = ComponentProps<typeof DialogContainer>,
>(
  Component: ComponentType<P>,
  defaultContainerProps?: ComponentProps<typeof DialogContainer>,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [componentProps, setComponentProps] = useState<P | null>(null);
  const [containerProps, setContainerProps] = useState<E | null>(null);
  const setupRef = useRef(false);

  function setupCheck() {
    if (!setupRef.current) {
      throw new Error(
        'useDialogContainer: DialogContainer must be rendered. Use `rendered` property to include it in your component tree.',
      );
    }
  }

  // 'open' accepts props required by the Component and opens the dialog
  const open = useEvent((props: P, containerProps?: E) => {
    setupCheck();

    setComponentProps(props);
    setContainerProps(containerProps ?? null);
    setIsOpen(true);
  });

  const update = useEvent((props: P, containerProps?: E) => {
    setupCheck();

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
        {...mergeProps(defaultContainerProps, containerProps || undefined)}
      >
        <Component {...componentProps} />
      </DialogContainer>
    );
  }, [componentProps, containerProps, isOpen, defaultContainerProps]);

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
