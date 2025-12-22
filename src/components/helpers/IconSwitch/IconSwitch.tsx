import {
  isValidElement,
  ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

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

function isNullishContent(node: ReactNode) {
  // React treats `null`, `undefined`, and `false` as "render nothing"
  return node == null || node === false;
}

const typeIds = new WeakMap<object, number>();
let lastTypeId = 0;

function getTypeId(type: object) {
  const existing = typeIds.get(type);
  if (existing != null) return existing;
  const next = (lastTypeId += 1);
  typeIds.set(type, next);
  return next;
}

/**
 * Best-effort key derivation for icon switching when `contentKey` is not provided.
 * The goal is to:
 * - Transition when icon component type changes
 * - Not transition when only props change for the same icon type (self-animating icons)
 * - Transition when toggling to/from nullish content
 */
function deriveContentKey(children: ReactNode): string {
  if (isNullishContent(children)) return 'nullish';
  if (!isValidElement(children)) return `non-element:${typeof children}`;

  const { type, key } = children;
  const keyPart = key == null ? '' : `:${String(key)}`;

  if (typeof type === 'string') return `host:${type}${keyPart}`;
  if (typeof type === 'function') return `fn:${getTypeId(type)}${keyPart}`;
  if (typeof type === 'object' && type != null)
    return `obj:${getTypeId(type)}${keyPart}`;
  if (typeof type === 'symbol') return `sym:${String(type)}${keyPart}`;

  return `unknown${keyPart}`;
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
    transition: {
      '': 'theme $transition ease-out',
      'exit | entered': 'theme $transition ease-in',
    },
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
  const effectiveKey = contentKey ?? deriveContentKey(children);
  const prevEffectiveKeyRef = useRef<string | number>(effectiveKey);
  const prevChildrenRef = useRef<ReactNode>(children);

  const [icons, setIcons] = useState<IconEntry[]>(() => [
    { key: keyCounterRef.current, content: children },
  ]);

  useLayoutEffect(() => {
    const prevKey = prevEffectiveKeyRef.current;
    const prevChildren = prevChildrenRef.current;

    const hasKeyChanged = effectiveKey !== prevKey;
    const hasNullishToggled =
      isNullishContent(children) !== isNullishContent(prevChildren);

    // Transition rules:
    // - If key changed -> transition (add new icon entry)
    // - If we toggled nullish <-> non-nullish -> transition (even if key did not change)
    // - Otherwise -> no state update (children reference changes are handled at render time)
    if (hasKeyChanged || hasNullishToggled) {
      keyCounterRef.current += 1;
      const newEntry: IconEntry = {
        key: keyCounterRef.current,
        content: children,
      };
      setIcons((prev) => [...prev, newEntry]);
    }

    prevEffectiveKeyRef.current = effectiveKey;
    prevChildrenRef.current = children;
  }, [children, effectiveKey]);

  const handleExitComplete = useCallback((exitedKey: number) => {
    setIcons((prev) => prev.filter((icon) => icon.key !== exitedKey));
  }, []);

  const latestKey = icons[icons.length - 1]?.key;

  const content = icons.map((icon) => {
    const isActive = icon.key === latestKey;
    // Use current children for active icon (avoids state updates on children reference changes),
    // use stored content for exiting icons (preserves appearance during fade-out)
    const displayContent = isActive ? children : icon.content;

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
        {({ isShown, phase, ref }) => (
          <IconSlotElement
            ref={ref}
            mods={{
              entered: isShown,
              phase,
            }}
          >
            {displayContent}
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
