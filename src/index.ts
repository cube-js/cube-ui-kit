import { CubeParagraphProps, Paragraph } from './components/content/Paragraph';
import { CubeTextProps, Text } from './components/content/Text';
import { CubeTextItemProps, TextItem } from './components/content/TextItem';
import { CubeTitleProps, Title } from './components/content/Title';
import { configure } from './tasty';

import './version';

// Configure tasty with UI-kit defaults
// This overrides the raw unit defaults with CSS variable-based units
configure({
  units: {
    x: 'var(--gap)',
    r: 'var(--radius)',
    cr: 'var(--card-radius)',
    bw: 'var(--border-width)',
    ow: 'var(--outline-width)',
  },
});

export { Section } from 'react-stately';

export * from '@internationalized/date';

// generic components
export { CollectionItem } from './components/CollectionItem';
export { Block } from './components/Block';
export type { CubeBlockProps } from './components/Block';
export { Item } from './components/content/Item/Item';
export type { CubeItemProps } from './components/content/Item/Item';
// @deprecated Use `Item` instead
export { ItemBase } from './components/content/Item/Item';
// @deprecated Use `CubeItemProps` instead
export type { CubeItemBaseProps } from './components/content/Item/Item';
export { ItemBadge } from './components/content/ItemBadge/ItemBadge';
export type { CubeItemBadgeProps } from './components/content/ItemBadge/ItemBadge';
export { ActiveZone } from './components/content/ActiveZone/ActiveZone';
export type { CubeActiveZoneProps } from './components/content/ActiveZone/ActiveZone';
export * from './components/content/CopySnippet';
export * from './components/content/CopyPasteBlock';
export { Grid } from './components/layout/Grid';
export type { CubeGridProps } from './components/layout/Grid';
export { Flex } from './components/layout/Flex';
export type { CubeFlexProps } from './components/layout/Flex';
export { Link } from './components/actions/Link/Link';
export { Space } from './components/layout/Space';
export type { CubeSpaceProps } from './components/layout/Space';
export { Flow } from './components/layout/Flow';
export type { CubeFlowProps } from './components/layout/Flow';
export { Panel } from './components/layout/Panel';
export type { CubePanelProps } from './components/layout/Panel';
export { ResizablePanel } from './components/layout/ResizablePanel';
export type { CubeResizablePanelProps } from './components/layout/ResizablePanel';
export { Root } from './components/Root';
export type { CubeRootProps } from './components/Root';
export { DisplayTransition } from './components/helpers/DisplayTransition/DisplayTransition';
export type { DisplayTransitionProps } from './components/helpers/DisplayTransition/DisplayTransition';

// Navigation types and helpers
export type {
  NavigationAdapter,
  NavigateLike,
  Path,
  To,
  NavigateArg,
  NavigateOptions,
  RelativeRoutingType,
} from './providers/navigation.types';
export { defaultNavigationAdapter } from './providers/navigationAdapter.default';
export { PrismCode } from './components/content/PrismCode/PrismCode';
export type { CubePrismCodeProps } from './components/content/PrismCode/PrismCode';
export { PrismDiffCode } from './components/content/PrismDiffCode/PrismDiffCode';
export type { CubePrismDiffCodeProps } from './components/content/PrismDiffCode/PrismDiffCode';
export { Prefix } from './components/layout/Prefix';
export type { CubePrefixProps } from './components/layout/Prefix';
export { Suffix } from './components/layout/Suffix';
export type { CubeSuffixProps } from './components/layout/Suffix';
export { Divider } from './components/content/Divider';
export type { CubeDividerProps } from './components/content/Divider';
export { Disclosure } from './components/content/Disclosure';
export type {
  CubeDisclosureProps,
  CubeDisclosureTriggerProps,
  CubeDisclosureContentProps,
  CubeDisclosureGroupProps,
  CubeDisclosureItemProps,
  DisclosureStateContext,
} from './components/content/Disclosure';
export { GridProvider } from './components/GridProvider';
export type { CubeGridProviderProps } from './components/GridProvider';
export { Content } from './components/content/Content';
export type { CubeContentProps } from './components/content/Content';
export { Header } from './components/content/Header';
export type { CubeHeaderProps } from './components/content/Header';
export { Footer } from './components/content/Footer';
export type { CubeFooterProps } from './components/content/Footer';
export { Result } from './components/content/Result/Result';
export type {
  CubeResultProps,
  CubeResultStatus,
} from './components/content/Result/Result';
export { Layout, GridLayout } from './components/content/Layout';
export type {
  CubeLayoutProps,
  CubeGridLayoutProps,
  CubeLayoutToolbarProps,
  CubeLayoutHeaderProps,
  CubeLayoutFooterProps,
  CubeLayoutContentProps,
  CubeLayoutPaneProps,
  CubeLayoutPanelProps,
  CubeLayoutPanelHeaderProps,
  ScrollbarType,
} from './components/content/Layout';

// atoms
export * from './components/status';
export { Card } from './components/content/Card/Card';
export type { CubeCardProps } from './components/content/Card/Card';
export * from './components/actions';
export { Placeholder } from './components/content/Placeholder/Placeholder';
export type { CubePlaceholderProps } from './components/content/Placeholder/Placeholder';
export { Skeleton } from './components/content/Skeleton/Skeleton';
export type { CubeSkeletonProps } from './components/content/Skeleton/Skeleton';
export { CloudLogo } from './components/other/CloudLogo/CloudLogo';
export { Badge } from './components/content/Badge/Badge';
export type { CubeBadgeProps } from './components/content/Badge/Badge';
export { Tag } from './components/content/Tag/Tag';
export type { CubeTagProps } from './components/content/Tag/Tag';
export * from './components/content/HotKeys';
export type { CubeSearchInputProps } from './components/fields/SearchInput/SearchInput';
export type { CubeListBoxProps } from './components/fields/ListBox';
export { ListBox } from './components/fields/ListBox';
export { Menu } from './components/actions/Menu/Menu';
export type { CubeMenuProps } from './components/actions/Menu/Menu';
export { MenuTrigger } from './components/actions/Menu/MenuTrigger';
export { SubMenuTrigger } from './components/actions/Menu/SubMenuTrigger';
export type { CubeMenuTriggerProps } from './components/actions/Menu/MenuTrigger';
export { CommandMenu } from './components/actions/CommandMenu';
export type {
  CubeCommandMenuProps,
  CommandMenuItem,
} from './components/actions/CommandMenu';
export { Select, ListBoxPopup } from './components/fields/Select/Select';
export type {
  CubeSelectProps,
  CubeSelectBaseProps,
} from './components/fields/Select/Select';

export { Avatar } from './components/content/Avatar/Avatar';
export type { CubeAvatarProps } from './components/content/Avatar/Avatar';
export {
  Dialog,
  DialogTrigger,
  DialogContainer,
  DialogForm,
  useDialogContainer,
} from './components/overlays/Dialog';
export type {
  CubeDialogTriggerProps,
  CubeDialogContainerProps,
  CubeDialogProps,
  CubeDialogFormRef,
  CubeDialogFormProps,
} from './components/overlays/Dialog';
export { Tooltip } from './components/overlays/Tooltip/Tooltip';
export type { CubeTooltipProps } from './components/overlays/Tooltip/Tooltip';
export { TooltipTrigger } from './components/overlays/Tooltip/TooltipTrigger';
export type { CubeTooltipTriggerProps } from './components/overlays/Tooltip/TooltipTrigger';
export { TooltipProvider } from './components/overlays/Tooltip/TooltipProvider';
export type { CubeTooltipProviderProps } from './components/overlays/Tooltip/TooltipProvider';

export * from './components/content/Alert';

// navigation
export * from './components/navigation';

// molecules
export { FileTabs } from './components/organisms/FileTabs/FileTabs';
export type { CubeFileTabProps } from './components/organisms/FileTabs/FileTabs';
export { StatsCard } from './components/organisms/StatsCard/StatsCard';
export type { CubeStatsCard } from './components/organisms/StatsCard/StatsCard';
export {
  AlertDialog,
  useAlertDialogAPI,
} from './components/overlays/AlertDialog';
export type { CubeAlertDialogProps } from './components/overlays/AlertDialog';

// services
export { notification } from './services/notification';
export type { CubeNotificationOptions } from './services/notification';

export * from './tasty';

export const Typography = {
  Text: Text,
  Title,
  Paragraph,
};

export { Text, TextItem, Title, Paragraph };
export type {
  CubeTextProps,
  CubeTextItemProps,
  CubeTitleProps,
  CubeParagraphProps,
};

export { Provider, useProviderProps } from './provider';
export type { ProviderProps } from './provider';
export { Portal } from './components/portal';
export type { PortalProps } from './components/portal';
export * from './components/fields';

export type {
  TagName,
  AllBaseProps,
  BaseProps,
  BaseStyleProps,
  DimensionStyleProps,
  ColorStyleProps,
  OuterStyleProps,
  PositionStyleProps,
  TextStyleProps,
  BlockStyleProps,
  ContainerStyleProps,
  BasePropsWithoutChildren,
  Props,
  FlowStyleProps,
  ShortGridStyles,
} from './tasty';

export * from './utils';
export * from './tasty';
export { default as copy } from 'clipboard-copy';
export * from '@react-aria/ssr';
export * from './components/overlays/NewNotifications';
export * from './components/overlays/Toast';
export * from './shared';
export * from './icons';
export * from './components/form';
export * from './tokens';
