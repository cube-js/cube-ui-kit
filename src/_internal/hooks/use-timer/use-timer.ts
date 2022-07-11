import { useEffect, useState } from 'react';
import { useEvent } from '../use-event';
import { Timer } from './timer';

export type UseTimerProps = {
  callback?: () => void;
  delay?: number | null;
  isDisabled?: boolean;
  timer?: Timer | null;
};

export function useTimer(props: UseTimerProps = {}) {
  const { callback, delay, isDisabled, timer: propsTimer = null } = props;

  const callbackEvent = useEvent(() => callback?.());
  const [timer, setTimer] = useState<Timer | null>(() => {
    if (propsTimer) {
      return propsTimer;
    }

    if (typeof delay === 'number') {
      return new Timer(callbackEvent, delay);
    }

    return null;
  });

  if (isDisabled) {
    timer?.reset();
  } else {
    timer?.resume();
  }

  useEffect(() => {
    setTimer(propsTimer);
    return () => timer?.reset();
  }, [propsTimer]);

  useEffect(() => {
    if (propsTimer) return;

    if (typeof delay === 'number') {
      setTimer(new Timer(callbackEvent, delay));
    }

    return () => timer?.reset();
  }, [delay, propsTimer]);

  useEffect(() => () => timer?.reset(), [timer]);

  return { timer } as const;
}
