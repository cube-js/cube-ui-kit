import { createContext, ReactNode, useContext } from 'react';

export interface NotificationsDialogContextValue {
  insideNotificationsDialog: boolean;
}

export const NotificationsDialogContext =
  createContext<NotificationsDialogContextValue | null>(null);

export function NotificationsDialogProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <NotificationsDialogContext.Provider
      value={{ insideNotificationsDialog: true }}
    >
      {children}
    </NotificationsDialogContext.Provider>
  );
}

export function useNotificationsDialogContext() {
  const context = useContext(NotificationsDialogContext);
  return context?.insideNotificationsDialog ?? false;
}
