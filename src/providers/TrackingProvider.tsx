import { createContext, useContext, ReactNode, RefObject } from 'react';

export interface TrackingProps {
  event?: (
    name: string,
    data?: Record<string, any>,
    ref?: RefObject<HTMLElement>,
  ) => void;
}

export const TrackingContext = createContext<TrackingProps>({
  event(name, data, ref) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Tracking event registered', name, data, ref);
    }
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
  if (!event) return <>{children}</>;

  return (
    <TrackingContext.Provider value={{ event }}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const tracking = useContext(TrackingContext);

  return tracking;
}
