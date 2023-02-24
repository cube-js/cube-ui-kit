import { createContext, ReactNode, useContext, useMemo } from 'react';

export interface TrackingProps {
  event?: (
    name: string,
    data?: Record<string, any>,
    element?: HTMLElement,
  ) => void;
}

export const TrackingContext = createContext<TrackingProps>({
  event() {
    // noop
  },
});

export interface CubeTrackingProviderProps extends TrackingProps {
  children?: ReactNode;
}

export function TrackingProvider({
  children,
  event,
}: CubeTrackingProviderProps) {
  const tracking = useMemo(() => ({ event }), [event]);

  if (!event) return <>{children}</>;

  return (
    <TrackingContext.Provider value={tracking}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const tracking = useContext(TrackingContext);

  return tracking;
}
