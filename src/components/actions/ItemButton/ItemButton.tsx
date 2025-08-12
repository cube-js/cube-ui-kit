import { FocusableRef } from '@react-types/shared';
import { forwardRef, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { tasty } from '../../../tasty';
import { mergeProps } from '../../../utils/react';
import { useCombinedRefs } from '../../../utils/react/useCombinedRefs';
import { HotKeys } from '../../content/HotKeys';
import { CubeItemBaseProps, ItemBase } from '../../content/ItemBase/ItemBase';
import {
  CubeTooltipProviderProps,
  TooltipProvider,
} from '../../overlays/Tooltip/TooltipProvider';
import { CubeUseActionProps, useAction } from '../use-action';

export interface CubeItemButtonProps
  extends Omit<CubeItemBaseProps, 'buttonType' | 'as'>,
    Omit<CubeUseActionProps, 'type' | 'as'> {
  /** Keyboard shortcut that triggers the button when pressed */
  hotkeys?: string;
  /** Tooltip content - string for simple text or object for advanced configuration */
  tooltip?: string | Omit<CubeTooltipProviderProps, 'children'>;
}

const StyledItemBase = tasty(ItemBase, {
  as: 'button',
  type: 'neutral',
  theme: 'default',
  styles: {
    reset: 'button',
    placeContent: 'center stretch',
  },
});

export const ItemButton = forwardRef(function ItemButton(
  allProps: CubeItemButtonProps,
  ref: FocusableRef<HTMLElement>,
) {
  const {
    mods,
    to,
    htmlType,
    buttonType,
    as,
    hotkeys,
    suffix,
    tooltip,
    type,
    ...rest
  } = allProps as CubeItemButtonProps & {
    as?: 'a' | 'button' | 'div' | 'span';
  };

  const { actionProps } = useAction(
    { ...(allProps as any), type: buttonType, to, htmlType, as, mods },
    ref,
  );

  // Build final suffix: custom suffix or HotKeys hint if provided and no explicit suffix
  const finalSuffix =
    suffix ??
    (hotkeys ? (
      <HotKeys
        theme={type === 'primary' ? 'special' : 'default'}
        styles={{ padding: '1x left', opacity: rest.isDisabled ? 0.5 : 1 }}
      >
        {hotkeys}
      </HotKeys>
    ) : undefined);

  // Register global hotkey if provided
  useHotkeys(
    typeof hotkeys === 'string' ? hotkeys.toLowerCase() : '',
    () => {
      if (!hotkeys) return;
      if (rest.isDisabled) return;
      // Simulate a click on the button so all existing handlers run
      if (actionProps.ref.current) {
        actionProps.ref.current.click();
      }
    },
    {
      enableOnContentEditable: true,
      enabled: !!hotkeys,
      preventDefault: true,
      enableOnFormTags: true,
    },
    [hotkeys, rest.isDisabled],
  );

  const buttonElement = (
    <StyledItemBase
      {...(mergeProps(rest, actionProps) as any)}
      type={type}
      buttonType={actionProps.type}
      suffix={finalSuffix}
    />
  );

  if (tooltip) {
    const tooltipProps =
      typeof tooltip === 'string' ? { title: tooltip } : tooltip;

    return <TooltipProvider {...tooltipProps}>{buttonElement}</TooltipProvider>;
  }

  return buttonElement;
});

export type { CubeItemButtonProps as ItemButtonProps };
