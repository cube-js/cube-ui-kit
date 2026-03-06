import { CONTAINER_STYLES, extractStyles, tasty } from '@tenphi/tasty';
import { forwardRef, ReactNode, useCallback, useMemo, useState } from 'react';

import { DirectionIcon } from '../../../icons/DirectionIcon';
import { mergeProps } from '../../../utils/react';
import { Button } from '../Button/Button';
import { Menu } from '../Menu/Menu';

import { ButtonSplitContext } from './context';

import type { BaseProps, ContainerStyleProps, Styles } from '@tenphi/tasty';
import type { CubeCollectionItemProps } from '../../CollectionItem';
import type { CubeButtonProps } from '../Button/Button';
import type { CubeMenuProps } from '../Menu/Menu';

export interface ButtonSplitAction
  extends Omit<
    CubeCollectionItemProps<object>,
    'children' | 'onAction' | 'wrapper'
  > {
  key: string;
  label: ReactNode;
}

export interface CubeButtonSplitProps extends BaseProps, ContainerStyleProps {
  /** Actions for strict mode. When provided, renders action + trigger buttons automatically. */
  actions?: ButtonSplitAction[];
  /** Currently selected action key (controlled). */
  actionKey?: string;
  /** Initially selected action key (uncontrolled). */
  defaultActionKey?: string;
  /** Called when the action button is pressed. Receives the current action key. */
  onAction?: (key: string) => void;
  /** Called when the selected action changes via the trigger menu. */
  onActionChange?: (key: string) => void;

  /** Button type applied to both action and trigger buttons in strict mode. */
  type?: CubeButtonProps['type'];
  /** Button theme applied to both action and trigger buttons in strict mode. */
  theme?: CubeButtonProps['theme'];
  /** Button size applied to both action and trigger buttons in strict mode. */
  size?: CubeButtonProps['size'];
  /** Disables both buttons in strict mode. */
  isDisabled?: boolean;

  /** Additional props for the action button in strict mode. */
  actionProps?: Partial<CubeButtonProps>;
  /** Additional props for the trigger button in strict mode. */
  triggerProps?: Partial<CubeButtonProps>;
  /** Additional props for the dropdown menu in strict mode. */
  menuProps?: Partial<CubeMenuProps<object>>;

  /** Custom styles for the wrapper element. */
  styles?: Styles;

  /** Custom mode: render arbitrary Button children. */
  children?: ReactNode;
}

const STYLE_PROPS = CONTAINER_STYLES;

const ButtonSplitElement = tasty({
  tag: 'div',
  qa: 'ButtonSplit',
  styles: {
    display: 'inline-flex',
    position: 'relative',
    verticalAlign: 'bottom',
  },
});

export const ButtonSplit = forwardRef<HTMLDivElement, CubeButtonSplitProps>(
  function ButtonSplit(props, ref) {
    const {
      actions,
      actionKey: controlledActionKey,
      defaultActionKey,
      onAction,
      onActionChange,
      type,
      theme,
      size,
      isDisabled,
      actionProps,
      triggerProps,
      menuProps,
      styles,
      children,
      ...rest
    } = props;

    const isControlled = controlledActionKey !== undefined;
    const [uncontrolledKey, setUncontrolledKey] = useState(
      () => defaultActionKey ?? actions?.[0]?.key,
    );

    const currentKey = isControlled ? controlledActionKey : uncontrolledKey;

    const currentAction = useMemo(
      () => actions?.find((a) => a.key === currentKey) ?? actions?.[0],
      [actions, currentKey],
    );

    const handleActionPress = useCallback(() => {
      if (currentKey) {
        onAction?.(currentKey);
      }
    }, [currentKey, onAction]);

    const handleSelectionChange = useCallback(
      (keys: string[]) => {
        const newKey = keys[0];

        if (newKey) {
          if (!isControlled) {
            setUncontrolledKey(newKey);
          }

          onActionChange?.(newKey);
        }
      },
      [isControlled, onActionChange],
    );

    const containerStyles = extractStyles(rest, STYLE_PROPS);

    const mergedStyles = useMemo<Styles>(
      () => ({
        ...containerStyles,
        ...styles,
      }),
      [containerStyles, styles],
    );

    const contextValue = useMemo(
      () => ({
        currentKey,
        onAction,
        onActionChange,
        type,
        theme,
        size,
        isDisabled,
      }),
      [currentKey, onAction, onActionChange, type, theme, size, isDisabled],
    );

    const isCustomMode = children != null;

    return (
      <ButtonSplitContext.Provider value={contextValue}>
        <ButtonSplitElement
          ref={ref}
          data-button-split
          styles={mergedStyles}
          qa={rest.qa}
        >
          {isCustomMode ? (
            children
          ) : actions ? (
            <>
              <Button
                type={type}
                theme={theme}
                size={size}
                isDisabled={isDisabled}
                icon={currentAction?.icon}
                {...mergeProps(actionProps, { onPress: handleActionPress })}
              >
                {currentAction?.label}
              </Button>
              <Menu.Trigger placement="bottom end">
                <Button
                  type={type}
                  theme={theme}
                  size={size}
                  isDisabled={isDisabled}
                  aria-label="More options"
                  icon={({ pressed }) => (
                    <DirectionIcon to={pressed ? 'up' : 'down'} />
                  )}
                  {...triggerProps}
                />
                <Menu
                  selectionMode="single"
                  selectedKeys={currentKey ? [currentKey] : []}
                  onSelectionChange={handleSelectionChange}
                  {...menuProps}
                >
                  {actions.map(({ key, label, textValue, ...itemProps }) => (
                    <Menu.Item
                      key={key}
                      textValue={
                        textValue ?? (typeof label === 'string' ? label : key)
                      }
                      {...itemProps}
                    >
                      {label}
                    </Menu.Item>
                  ))}
                </Menu>
              </Menu.Trigger>
            </>
          ) : null}
        </ButtonSplitElement>
      </ButtonSplitContext.Provider>
    );
  },
);

ButtonSplit.displayName = 'ButtonSplit';
