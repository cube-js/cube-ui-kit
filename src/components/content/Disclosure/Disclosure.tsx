import {
  createContext,
  forwardRef,
  Key,
  ReactNode,
  RefObject,
  useContext,
  useMemo,
  useRef,
} from 'react';
import { mergeProps, useDisclosure, useId } from 'react-aria';
import {
  DisclosureGroupState,
  DisclosureState,
  useDisclosureGroupState,
  useDisclosureState,
} from 'react-stately';

import { RightIcon } from '../../../icons';
import {
  BaseProps,
  BasePropsWithoutChildren,
  extractStyles,
  OUTER_STYLES,
  OuterStyleProps,
  Styles,
  tasty,
} from '../../../tasty';
import { CubeItemButtonProps, ItemButton } from '../../actions/ItemButton';
import { DisplayTransition } from '../../helpers';

// ============================================================================
// Types
// ============================================================================

export interface DisclosureStateContext {
  isExpanded: boolean;
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
}

interface DisclosureContextValue {
  state: DisclosureState;
  buttonProps: Record<string, unknown>;
  panelProps: Record<string, unknown>;
  panelRef: RefObject<HTMLDivElement | null>;
  isDisabled: boolean;
  isExpanded: boolean;
  shape: 'default' | 'card' | 'sharp';
  transitionDuration?: number;
  triggerProps?: Partial<CubeItemButtonProps>;
  contentStyles?: Styles;
}

interface DisclosureGroupContextValue {
  groupState: DisclosureGroupState;
  triggerProps?: Partial<CubeItemButtonProps>;
  contentStyles?: Styles;
}

export interface CubeDisclosureProps
  extends BasePropsWithoutChildren,
    OuterStyleProps {
  /** Controls expanded state in controlled mode */
  isExpanded?: boolean;
  /** Initial expanded state in uncontrolled mode */
  defaultExpanded?: boolean;
  /** Callback fired when expanded state changes */
  onExpandedChange?: (isExpanded: boolean) => void;
  /** Disables trigger interactions and force-closes the content */
  isDisabled?: boolean;
  /** Render-prop alternative to achieve custom trigger markup */
  children?: ReactNode | ((state: DisclosureStateContext) => ReactNode);
  /** Visual shape variant */
  shape?: 'default' | 'card' | 'sharp';
  /** Duration for DisplayTransition animation in milliseconds */
  transitionDuration?: number;
}

export interface CubeDisclosureTriggerProps
  extends Omit<CubeItemButtonProps, 'onPress'> {
  /** Children content for the trigger */
  children?: ReactNode;
}

export interface CubeDisclosureContentProps extends BaseProps {
  /** Children content for the panel */
  children?: ReactNode;
}

export interface CubeDisclosureGroupProps extends BaseProps, OuterStyleProps {
  /** Allow more than one disclosure to be open */
  allowsMultipleExpanded?: boolean;
  /** Controlled expanded keys */
  expandedKeys?: Iterable<Key>;
  /** Uncontrolled default expanded keys */
  defaultExpandedKeys?: Iterable<Key>;
  /** Change handler providing the full expanded keys Set */
  onExpandedChange?: (keys: Set<Key>) => void;
  /** Disable all disclosures within group and force-close their content */
  isDisabled?: boolean;
  /** Props forwarded to all ItemButton triggers in the group */
  triggerProps?: Partial<CubeItemButtonProps>;
  /** Optional panel styles applied to all Content panels in the group */
  contentStyles?: Styles;
  children: ReactNode;
}

export interface CubeDisclosureItemProps
  extends Omit<BasePropsWithoutChildren, 'id'>,
    OuterStyleProps {
  /** Unique identifier for the disclosure item in a group */
  id?: Key;
  /** Children content */
  children?: ReactNode;
  /** Disables trigger interactions and force-closes the content */
  isDisabled?: boolean;
  /** Controls expanded state in controlled mode */
  isExpanded?: boolean;
  /** Initial expanded state in uncontrolled mode */
  defaultExpanded?: boolean;
  /** Callback fired when expanded state changes */
  onExpandedChange?: (isExpanded: boolean) => void;
  /** Visual shape variant */
  shape?: 'default' | 'card' | 'sharp';
}

// ============================================================================
// Contexts
// ============================================================================

const DisclosureContext = createContext<DisclosureContextValue | null>(null);
const DisclosureGroupContext =
  createContext<DisclosureGroupContextValue | null>(null);

function useDisclosureContext(): DisclosureContextValue {
  const context = useContext(DisclosureContext);

  if (!context) {
    throw new Error(
      'Disclosure.Trigger and Disclosure.Content must be used within a Disclosure',
    );
  }

  return context;
}

function useDisclosureGroupContext(): DisclosureGroupContextValue | null {
  return useContext(DisclosureGroupContext);
}

// ============================================================================
// Styled Components
// ============================================================================

const DisclosureRoot = tasty({
  qa: 'Disclosure',
  styles: {
    display: 'flex',
    flow: 'column',
    gap: 0,
    position: 'relative',
    border: {
      '': 'none',
      'shape=card': '1bw solid #border',
    },
    radius: {
      '': '1r',
      'shape=card': '1cr',
      'shape=sharp': '0',
    },
    fill: '#white',
  },
});

const ContentWrapperElement = tasty({
  styles: {
    display: 'block',
    overflow: 'hidden',
    interpolateSize: 'allow-keywords',
    height: {
      '': '0',
      shown: 'max-content',
    },
    transition: 'height $disclosure-transition linear',
  },
});

const ContentElement = tasty({
  qa: 'DisclosureContent',
  styles: {
    padding: '1x',
  },
});

const GroupRoot = tasty({
  qa: 'DisclosureGroup',
  styles: {
    display: 'flex',
    flow: 'column',
    gap: '0',
  },
});

const TriggerIcon = tasty(RightIcon, {
  styles: {
    transition: 'rotate',
    rotate: {
      '': '0deg',
      expanded: '90deg',
    },
  },
});

const StyledTrigger = tasty(ItemButton, {
  styles: {
    radius: {
      '': '1r',
      'expanded & shape=card': '(1cr - 1bw) (1cr - 1bw) 0 0',
      'shape=sharp': '0',
    },
    border: '#clear',
  },
});

// ============================================================================
// Disclosure Component
// ============================================================================

const DisclosureComponent = forwardRef<HTMLDivElement, CubeDisclosureProps>(
  function Disclosure(props, ref) {
    const {
      isExpanded: controlledIsExpanded,
      defaultExpanded,
      onExpandedChange,
      isDisabled = false,
      children,
      shape = 'default',
      transitionDuration,
      qa,
      mods,
      ...otherProps
    } = props;

    const groupContext = useDisclosureGroupContext();
    const panelRef = useRef<HTMLDivElement>(null);

    // When disabled, force expanded to false
    const effectiveIsExpanded = isDisabled ? false : controlledIsExpanded;

    const state = useDisclosureState({
      isExpanded: effectiveIsExpanded,
      defaultExpanded: isDisabled ? false : defaultExpanded,
      onExpandedChange: isDisabled ? undefined : onExpandedChange,
    });

    // When disabled, override state.isExpanded to false
    const isExpanded = isDisabled ? false : state.isExpanded;

    const { buttonProps, panelProps } = useDisclosure(
      {
        isExpanded,
        isDisabled,
      },
      state,
      panelRef,
    );

    const contextValue = useMemo<DisclosureContextValue>(
      () => ({
        state,
        buttonProps,
        panelProps,
        panelRef,
        isDisabled,
        isExpanded,
        shape,
        transitionDuration,
        triggerProps: groupContext?.triggerProps,
        contentStyles: groupContext?.contentStyles,
      }),
      [
        state,
        buttonProps,
        panelProps,
        isDisabled,
        isExpanded,
        shape,
        transitionDuration,
        groupContext?.triggerProps,
        groupContext?.contentStyles,
      ],
    );

    const stateContext = useMemo<DisclosureStateContext>(
      () => ({
        isExpanded,
        toggle: state.toggle,
        expand: state.expand,
        collapse: state.collapse,
      }),
      [isExpanded, state.toggle, state.expand, state.collapse],
    );

    const outerStyles = extractStyles(otherProps, OUTER_STYLES);

    const finalMods = useMemo(
      () => ({
        expanded: isExpanded,
        disabled: isDisabled,
        shape,
        ...mods,
      }),
      [isExpanded, isDisabled, shape, mods],
    );

    const content =
      typeof children === 'function' ? children(stateContext) : children;

    return (
      <DisclosureContext.Provider value={contextValue}>
        <DisclosureRoot ref={ref} qa={qa} mods={finalMods} styles={outerStyles}>
          {content}
        </DisclosureRoot>
      </DisclosureContext.Provider>
    );
  },
);

// ============================================================================
// Disclosure.Trigger Component
// ============================================================================

const DisclosureTrigger = forwardRef<
  HTMLButtonElement,
  CubeDisclosureTriggerProps
>(function DisclosureTrigger(props, ref) {
  const { children, icon, mods, ...otherProps } = props;
  const context = useDisclosureContext();
  const { buttonProps, isDisabled, isExpanded, shape, triggerProps } = context;

  const finalMods = useMemo(
    () => ({
      expanded: isExpanded,
      disabled: isDisabled,
      shape,
      ...mods,
    }),
    [isExpanded, isDisabled, shape, mods],
  );

  // Default icon is a rotating chevron
  const defaultIcon = <TriggerIcon mods={{ expanded: isExpanded }} />;

  return (
    <StyledTrigger
      ref={ref}
      icon={icon ?? defaultIcon}
      isDisabled={isDisabled}
      isSelected={isExpanded}
      {...triggerProps}
      {...(mergeProps(otherProps, buttonProps as any) as any)}
      mods={finalMods}
    >
      {children}
    </StyledTrigger>
  );
});

// ============================================================================
// Disclosure.Content Component
// ============================================================================

const DisclosureContent = forwardRef<
  HTMLDivElement,
  CubeDisclosureContentProps
>(function DisclosureContent(props, ref) {
  const { children, styles, mods, ...otherProps } = props;
  const context = useDisclosureContext();
  const {
    panelProps,
    panelRef,
    isExpanded,
    transitionDuration,
    contentStyles,
  } = context;

  const mergedStyles = useMemo<Styles>(
    () => ({
      ...contentStyles,
      ...styles,
    }),
    [contentStyles, styles],
  );

  // Filter out hidden attribute from panelProps since we manage visibility via CSS height animation
  const { hidden, ...filteredPanelProps } = panelProps as Record<
    string,
    unknown
  >;

  return (
    <DisplayTransition
      isShown={isExpanded}
      duration={transitionDuration}
      animateOnMount={false}
    >
      {({ phase, isShown, ref: transitionRef }) => (
        <ContentWrapperElement
          ref={transitionRef}
          mods={{ shown: isShown, phase }}
        >
          <ContentElement
            mods={mods}
            styles={mergedStyles}
            {...filteredPanelProps}
            {...otherProps}
          >
            {children}
          </ContentElement>
        </ContentWrapperElement>
      )}
    </DisplayTransition>
  );
});

// ============================================================================
// Disclosure.Group Component
// ============================================================================

const DisclosureGroup = forwardRef<HTMLDivElement, CubeDisclosureGroupProps>(
  function DisclosureGroup(props, ref) {
    const {
      allowsMultipleExpanded = false,
      expandedKeys,
      defaultExpandedKeys,
      onExpandedChange,
      isDisabled = false,
      triggerProps,
      contentStyles,
      children,
      qa,
      mods,
      styles,
      ...otherProps
    } = props;

    const groupState = useDisclosureGroupState({
      allowsMultipleExpanded,
      expandedKeys,
      defaultExpandedKeys,
      onExpandedChange,
      isDisabled,
    });

    const contextValue = useMemo<DisclosureGroupContextValue>(
      () => ({
        groupState,
        triggerProps,
        contentStyles,
      }),
      [groupState, triggerProps, contentStyles],
    );

    const outerStyles = extractStyles(otherProps, OUTER_STYLES);

    const finalStyles = useMemo<Styles>(
      () => ({
        ...outerStyles,
        ...styles,
      }),
      [outerStyles, styles],
    );

    return (
      <DisclosureGroupContext.Provider value={contextValue}>
        <GroupRoot ref={ref} qa={qa} mods={mods} styles={finalStyles}>
          {children}
        </GroupRoot>
      </DisclosureGroupContext.Provider>
    );
  },
);

// ============================================================================
// Disclosure.Item Component
// ============================================================================

const DisclosureItem = forwardRef<HTMLDivElement, CubeDisclosureItemProps>(
  function DisclosureItem(props, ref) {
    const {
      id: providedId,
      children,
      isDisabled: itemDisabled = false,
      isExpanded: controlledIsExpanded,
      defaultExpanded,
      onExpandedChange,
      shape = 'default',
      qa,
      mods,
      styles,
      ...otherProps
    } = props;

    const defaultId = useId();
    const id = providedId ?? defaultId;

    const groupContext = useDisclosureGroupContext();
    const panelRef = useRef<HTMLDivElement>(null);

    // Determine if disabled from group or item
    const isDisabled =
      itemDisabled || groupContext?.groupState?.isDisabled || false;

    // Determine expanded state from group or local props
    const groupIsExpanded = groupContext
      ? groupContext.groupState.expandedKeys.has(id)
      : undefined;

    // When disabled, force expanded to false
    const effectiveIsExpanded = isDisabled
      ? false
      : groupIsExpanded ?? controlledIsExpanded;

    const state = useDisclosureState({
      isExpanded: effectiveIsExpanded,
      defaultExpanded: isDisabled ? false : defaultExpanded,
      onExpandedChange(expanded) {
        if (isDisabled) return;

        if (groupContext) {
          groupContext.groupState.toggleKey(id);
        }
        onExpandedChange?.(expanded);
      },
    });

    // When disabled, override state.isExpanded to false
    const isExpanded = isDisabled ? false : state.isExpanded;

    const { buttonProps, panelProps } = useDisclosure(
      {
        isExpanded,
        isDisabled,
      },
      state,
      panelRef,
    );

    const contextValue = useMemo<DisclosureContextValue>(
      () => ({
        state,
        buttonProps,
        panelProps,
        panelRef,
        isDisabled,
        isExpanded,
        shape,
        transitionDuration: undefined,
        triggerProps: groupContext?.triggerProps,
        contentStyles: groupContext?.contentStyles,
      }),
      [
        state,
        buttonProps,
        panelProps,
        isDisabled,
        isExpanded,
        shape,
        groupContext?.triggerProps,
        groupContext?.contentStyles,
      ],
    );

    const outerStyles = extractStyles(otherProps, OUTER_STYLES);

    const finalStyles = useMemo<Styles>(
      () => ({
        ...outerStyles,
        ...styles,
      }),
      [outerStyles, styles],
    );

    const finalMods = useMemo(
      () => ({
        expanded: isExpanded,
        disabled: isDisabled,
        shape,
        ...mods,
      }),
      [isExpanded, isDisabled, shape, mods],
    );

    return (
      <DisclosureContext.Provider value={contextValue}>
        <DisclosureRoot
          ref={ref}
          qa={qa}
          mods={finalMods}
          styles={finalStyles}
          data-key={id}
        >
          {children}
        </DisclosureRoot>
      </DisclosureContext.Provider>
    );
  },
);

// ============================================================================
// Compound Component Export
// ============================================================================

const _Disclosure = Object.assign(DisclosureComponent, {
  Trigger: DisclosureTrigger,
  Content: DisclosureContent,
  Group: DisclosureGroup,
  Item: DisclosureItem,
});

export { _Disclosure as Disclosure };
export type {
  CubeDisclosureProps as DisclosureProps,
  CubeDisclosureTriggerProps as DisclosureTriggerProps,
  CubeDisclosureContentProps as DisclosureContentProps,
  CubeDisclosureGroupProps as DisclosureGroupProps,
  CubeDisclosureItemProps as DisclosureItemProps,
};
