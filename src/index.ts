import { TextInput } from './atoms/TextInput/TextInput';
import { PasswordInput } from './atoms/PasswordInput/PasswordInput';
import { NumberInput } from './atoms/NumberInput/NumberInput';
import { CubeFormProps, Field, Form as _Form, useFormProps } from './atoms/Form';

import { CubeTextProps, Text } from './components/Text';
import { CubeTitleProps, Title } from './components/Title';
import { CubeParagraphProps, Paragraph } from './components/Paragraph';
import { TextArea } from './atoms/TextArea/TextArea';

const Form = Object.assign(_Form, { Item: Field });

export { Item } from '@react-stately/collections';

// generic components
export { Base } from './components/Base';
export { Block } from './components/Block';
export type { CubeBlockProps } from './components/Block';
export { Action } from './components/Action';
export type { CubeActionProps } from './components/Action';
export { Grid } from './components/Grid';
export type { CubeGridProps } from './components/Grid';
export { Flex } from './components/Flex';
export type { CubeFlexProps } from './components/Flex';
export { Link } from './atoms/Link/Link';
export { Space } from './components/Space';
export type { CubeSpaceProps } from './components/Space';
export { Flow } from './components/Flow';
export type { CubeFlowProps } from './components/Flow';
export { Root } from './components/Root';
export type { CubeRootProps } from './components/Root';
export { PrismCode } from './atoms/PrismCode/PrismCode';
export type { CubePrismCodeProps } from './atoms/PrismCode/PrismCode';
export { Prefix } from './components/Prefix';
export type { CubePrefixProps } from './components/Prefix';
export { Suffix } from './components/Suffix';
export type { CubeSuffixProps } from './components/Suffix';
export { Divider } from './components/Divider';
export type { CubeDividerProps } from './components/Divider';
export { GridProvider } from './components/GridProvider';
export type { CubeGridProviderProps } from './components/GridProvider';
export { Content } from './components/Content';
export type { CubeContentProps } from './components/Content';
export { Header } from './components/Header';
export type { CubeHeaderProps } from './components/Header';
export { Footer } from './components/Footer';
export type { CubeFooterProps } from './components/Footer';
export { FieldWrapper } from './components/FieldWrapper';
export type { CubeFieldWrapperProps } from './components/FieldWrapper';

// atoms
export { LoadingAnimation } from './atoms/LoadingAnimation/LoadingAnimation';
export type { CubeLoadingAnimationProps } from './atoms/LoadingAnimation/LoadingAnimation';
export { Spin } from './atoms/Spin/Spin';
export type { CubeSpinProps } from './atoms/Spin/Spin';
export { Base64Upload } from './atoms/Base64Upload/Base64Upload';
export type { CubeBase64UploadProps } from './atoms/Base64Upload/Base64Upload';
export { Card } from './atoms/Card/Card';
export type { CubeCardProps } from './atoms/Card/Card';
export { Button } from './atoms/Button/Button';
export type { CubeButtonProps } from './atoms/Button/Button';
export { Placeholder } from './atoms/Placeholder/Placeholder';
export type { CubePlaceholderProps } from './atoms/Placeholder/Placeholder';
export { Skeleton } from './atoms/Skeleton/Skeleton';
export type { CubeSkeletonProps } from './atoms/Skeleton/Skeleton';
export { CloudLogo } from './atoms/CloudLogo/CloudLogo';
export { Badge } from './atoms/Badge/Badge';
export type { CubeBadgeProps } from './atoms/Badge/Badge';
export { SearchInput } from './atoms/SearchInput/SearchInput';
export type { CubeSearchInputProps } from './atoms/SearchInput/SearchInput';
export { Submit } from './atoms/Button/Submit';
export type { CubeTextInputBaseProps } from './atoms/TextInput/TextInputBase';
export type { CubeTextInputBaseProps as CubeTextInputProps } from './atoms/TextInput/TextInputBase';
export { TextInput } from './atoms/TextInput/TextInput';
export { TextArea } from './atoms/TextArea/TextArea';
export type { CubeTextAreaProps } from './atoms/TextArea/TextArea';
export { PasswordInput } from './atoms/PasswordInput/PasswordInput';
export { Checkbox } from './atoms/Checkbox/Checkbox';
export type { CubeCheckboxProps } from './atoms/Checkbox/Checkbox';
export { CheckboxGroup } from './atoms/Checkbox/CheckboxGroup';
export type { CubeCheckboxGroupProps } from './atoms/Checkbox/CheckboxGroup';
export { Switch } from './atoms/Switch/Switch';
export type { CubeSwitchProps } from './atoms/Switch/Switch';
export { Radio } from './atoms/RadioGroup/Radio';
export type { CubeRadioProps } from './atoms/RadioGroup/Radio';
export { Form, Field, useFormProps };
export type { CubeFormProps };
export { ComboBox } from './atoms/ComboBox/ComboBox';
export type { CubeComboBoxProps } from './atoms/ComboBox/ComboBox';
export { Select, ListBoxPopup } from './atoms/Select/Select';
export type { CubeSelectProps, CubeSelectBaseProps } from './atoms/Select/Select';
export { NumberInput } from './atoms/NumberInput/NumberInput';
export type { CubeNumberInputProps } from './atoms/NumberInput/NumberInput';
export { Avatar } from './atoms/Avatar/Avatar';
export type { CubeAvatarProps } from './atoms/Avatar/Avatar';
export {
  Dialog,
  DialogTrigger,
  DialogContainer,
} from './atoms/Dialog';
export type {
  CubeDialogTriggerProps,
  CubeDialogContainerProps,
  CubeDialogProps,
} from './atoms/Dialog';
export { Tooltip } from './atoms/Tooltip/Tooltip';
export type { CubeTooltipProps } from './atoms/Tooltip/Tooltip';
export { TooltipTrigger } from './atoms/Tooltip/TooltipTrigger';
export type { CubeTooltipTriggerProps } from './atoms/Tooltip/TooltipTrigger';
export { ButtonGroup } from './atoms/ButtonGroup/ButtonGroup';

// molecules
export { TopBar } from './molecules/TopBar/TopBar';
export type { CubeTopbarProps } from './molecules/TopBar/TopBar';
export { Alert } from './molecules/Alert/Alert';
export type { CubeAlertProps } from './molecules/Alert/Alert';
export { DirectoryTree } from './molecules/DirectoryTree/DirectoryTree';
export type { CubeDirectoryTreeProps } from './molecules/DirectoryTree/DirectoryTree';
export { Tabs } from './molecules/Tabs/Tabs';
export type { CubeTabsProps } from './molecules/Tabs/Tabs';
export { FileTabs } from './molecules/FileTabs/FileTabs';
export type { CubeFileTabProps } from './molecules/FileTabs/FileTabs';
export { Modal } from './molecules/Modal/Modal';
export type { CubeModalProps } from './molecules/Modal/Modal';
export { CopySnippet } from './molecules/CopySnippet/CopySnippet';
export type { CubeCopySnippetProps } from './molecules/CopySnippet/CopySnippet';
export { StatsCard } from './molecules/StatsCard/StatsCard';
export type { CubeStatsCard } from './molecules/StatsCard/StatsCard';
export { AlertDialog } from './molecules/AlertDialog/AlertDialog';
export type { CubeAlertDialogProps } from './molecules/AlertDialog/AlertDialog';
export { SearchResults } from './molecules/SearchResults/SearchResults';
export type { CubeSearchResultsProps } from './molecules/SearchResults/SearchResults';
// services

export { notification } from './services/notification';
export type { CubeNotificationOptions } from './services/notification';

export * from './providers/Responsive';

export const Typography = {
  Text,
  Title,
  Paragraph,
};

export { Text, Title, Paragraph };
export type { CubeTextProps, CubeTitleProps, CubeParagraphProps };

export { useContextStyles, StyleProvider } from './providers/Styles';

export { Provider } from './provider';
export type { useProviderProps } from './provider';

const Input = Object.assign(TextInput, {
  Text: TextInput,
  Password: PasswordInput,
  Number: NumberInput,
  TextArea: TextArea,
});

export { Input };

export type {
  TagName,
  TagNameProps,
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
  ShortItemsStyles,
  ShortGridStyles,
} from './components/types';
export * from './styles/types';
export * from './styles/list';

export { ModalProvider } from '@react-aria/overlays';
export * from './utils/react';
