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
 */
export function IconSwitch(props: CubeIconSwitchProps) {
  const { children, contentKey, noWrapper, ...rest } = props;

  const keyCounterRef = useRef(0);
  const prevContentKeyRef = useRef<string | number | undefined>(contentKey);
  const prevChildrenRef = useRef<ReactNode>(children);

  const [icons, setIcons] = useState<IconEntry[]>(() => [
    { key: keyCounterRef.current, content: children },
  ]);

  // Detect if content has changed
  const hasContentChanged =
    contentKey !== undefined
      ? contentKey !== prevContentKeyRef.current
      : children !== prevChildrenRef.current;

  if (hasContentChanged) {
    prevContentKeyRef.current = contentKey;
    prevChildrenRef.current = children;
    keyCounterRef.current += 1;

    const newEntry: IconEntry = {
      key: keyCounterRef.current,
      content: children,
    };

    // Add new icon to the stack (will be rendered on top)
    setIcons((prev) => [...prev, newEntry]);
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
