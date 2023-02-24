import {
  createContext,
  ReactNode,
  RefObject,
  useContext,
  useMemo,
} from 'react';

export interface TrackingProps {
  event?: (
    name: string,
    data?: Record<string, any>,
    ref?: RefObject<HTMLElement>,
  ) => void;
}

export const TrackingContext = createContext<TrackingProps>({
  event(name, data, ref) {
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
