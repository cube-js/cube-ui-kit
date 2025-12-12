import { ReactNode, useCallback, useRef, useState } from 'react';

import { BaseProps, tasty } from '../../../tasty';
import { DisplayTransition } from '../DisplayTransition/DisplayTransition';

export interface CubeIconSwitchProps extends BaseProps {
  /** The icon to display */
  children: ReactNode;
  /** Override the default key derivation for detecting icon changes */
  contentKey?: string | number;
  /** When true, renders without wrapper element, expecting parent to provide grid context */
  noWrapper?: boolean;
}

interface IconEntry {
  key: number;
  content: ReactNode;
}

const IconSwitchElement = tasty({
  styles: {
    display: 'grid',
    placeItems: 'center',
  },
});

const IconSlotElement = tasty({
  styles: {
    gridArea: '1 / 1',
    display: 'grid',
    placeItems: 'center',
    opacity: {
      '': 0,
      entered: 1,
    },
    transition: 'theme',
  },
});

/**
 * A component that cross-fades between icons when children change.
 * Useful for animated icon transitions in buttons, items, etc.
 *
 * When `contentKey` changes, a transition is triggered.
 * When only `children` changes (same `contentKey`), content is updated in-place
 * without transition, allowing self-animating icons (like DirectionIcon) to work.
 */
export function IconSwitch(props: CubeIconSwitchProps) {
  const { children, contentKey, noWrapper, ...rest } = props;

  const keyCounterRef = useRef(0);
  const prevContentKeyRef = useRef<string | number | undefined>(contentKey);
  const prevChildrenRef = useRef<ReactNode>(children);

  const [icons, setIcons] = useState<IconEntry[]>(() => [
    { key: keyCounterRef.current, content: children },
  ]);

  // Detect what has changed
  const hasKeyChanged = contentKey !== prevContentKeyRef.current;
  const hasChildrenChanged = children !== prevChildrenRef.current;

  if (hasKeyChanged) {
    // Key changed -> add new entry -> trigger transition
    prevContentKeyRef.current = contentKey;
    prevChildrenRef.current = children;
    keyCounterRef.current += 1;

    const newEntry: IconEntry = {
      key: keyCounterRef.current,
      content: children,
    };

    setIcons((prev) => [...prev, newEntry]);
  } else if (hasChildrenChanged) {
    // Same key, different children -> update in-place -> no transition
    // This allows self-animating icons to receive updated props
    prevChildrenRef.current = children;

    setIcons((prev) =>
      prev.map((icon, i) =>
        i === prev.length - 1 ? { ...icon, content: children } : icon,
      ),
    );
  }

  const handleExitComplete = useCallback((exitedKey: number) => {
    setIcons((prev) => prev.filter((icon) => icon.key !== exitedKey));
  }, []);

  const latestKey = icons[icons.length - 1]?.key;

  const content = icons.map((icon) => {
    const isActive = icon.key === latestKey;

    return (
      <DisplayTransition
        key={icon.key}
        isShown={isActive}
        animateOnMount={icon.key !== 0}
        onRest={(transition) => {
          if (transition === 'exit') {
            handleExitComplete(icon.key);
          }
        }}
      >
        {({ phase, ref }) => (
          <IconSlotElement
            ref={ref}
            mods={{
              entered: phase === 'entered',
            }}
          >
            {icon.content}
          </IconSlotElement>
        )}
      </DisplayTransition>
    );
  });

  if (noWrapper) {
    return <>{content}</>;
  }

  return <IconSwitchElement {...rest}>{content}</IconSwitchElement>;
}

export type { CubeIconSwitchProps as IconSwitchProps };
