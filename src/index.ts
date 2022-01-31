import { TextInput } from './components/forms/TextInput/TextInput';
import { PasswordInput } from './components/forms/PasswordInput/PasswordInput';
import { NumberInput } from './components/forms/NumberInput/NumberInput';
import {
  CubeFormProps,
  Field,
  Form as _Form,
  useForm,
  useFormProps,
  CubeFormInstance,
} from './components/forms/Form';

import { CubeTextProps, Text } from './components/content/Text';
import { CubeTitleProps, Title } from './components/content/Title';
import { CubeParagraphProps, Paragraph } from './components/content/Paragraph';
import { TextArea } from './components/forms/TextArea/TextArea';
import { Button } from './components/actions/Button/Button';
import { ButtonGroup } from './components/actions/ButtonGroup/ButtonGroup';
import { FileInput } from './components/forms/FileInput/FileInput';

import './styles/predefined';

const _Button = Object.assign(Button, {
  Group: ButtonGroup,
});

const Form = Object.assign(_Form, { Item: Field, useForm });

export { Item } from '@react-stately/collections';

// generic components
export { Base } from './components/Base';
export { Block } from './components/Block';
export type { CubeBlockProps } from './components/Block';
export { Action } from './components/actions/Action';
export type { CubeActionProps } from './components/actions/Action';
export { ActiveZone } from './components/content/ActiveZone/ActiveZone';
export type { CubeActiveZoneProps } from './components/content/ActiveZone/ActiveZone';
export { Grid } from './components/layout/Grid';
export type { CubeGridProps } from './components/layout/Grid';
export { Flex } from './components/layout/Flex';
export type { CubeFlexProps } from './components/layout/Flex';
export { Link } from './components/navigation/Link/Link';
export { Space } from './components/layout/Space';
export type { CubeSpaceProps } from './components/layout/Space';
export { Flow } from './components/layout/Flow';
export type { CubeFlowProps } from './components/layout/Flow';
export { Root } from './components/Root';
export type { CubeRootProps } from './components/Root';
export { PrismCode } from './components/content/PrismCode/PrismCode';
export type { CubePrismCodeProps } from './components/content/PrismCode/PrismCode';
export { Prefix } from './components/layout/Prefix';
export type { CubePrefixProps } from './components/layout/Prefix';
export { Suffix } from './components/layout/Suffix';
export type { CubeSuffixProps } from './components/layout/Suffix';
export { Divider } from './components/content/Divider';
export type { CubeDividerProps } from './components/content/Divider';
export { GridProvider } from './components/GridProvider';
export type { CubeGridProviderProps } from './components/GridProvider';
export { Content } from './components/content/Content';
export type { CubeContentProps } from './components/content/Content';
export { Header } from './components/content/Header';
export type { CubeHeaderProps } from './components/content/Header';
export { Footer } from './components/content/Footer';
export type { CubeFooterProps } from './components/content/Footer';
export { FieldWrapper } from './components/forms/FieldWrapper';
export type { CubeFieldWrapperProps } from './components/forms/FieldWrapper';

// atoms
export { LoadingAnimation } from './components/status/LoadingAnimation/LoadingAnimation';
export type { CubeLoadingAnimationProps } from './components/status/LoadingAnimation/LoadingAnimation';
export { Spin } from './components/status/Spin/Spin';
export type { CubeSpinProps } from './components/status/Spin/Spin';
export { Base64Upload } from './components/other/Base64Upload/Base64Upload';
export type { CubeBase64UploadProps } from './components/other/Base64Upload/Base64Upload';
export { Card } from './components/content/Card/Card';
export type { CubeCardProps } from './components/content/Card/Card';
export { _Button as Button, ButtonGroup };
export type { CubeButtonProps } from './components/actions/Button/Button';
export { Placeholder } from './components/content/Placeholder/Placeholder';
export type { CubePlaceholderProps } from './components/content/Placeholder/Placeholder';
export { Skeleton } from './components/content/Skeleton/Skeleton';
export type { CubeSkeletonProps } from './components/content/Skeleton/Skeleton';
export { CloudLogo } from './components/other/CloudLogo/CloudLogo';
export { Badge } from './components/content/Badge/Badge';
export type { CubeBadgeProps } from './components/content/Badge/Badge';
export { Tag } from './components/content/Tag/Tag';
export type { CubeTagProps } from './components/content/Tag/Tag';
export { SearchInput } from './components/forms/SearchInput/SearchInput';
export type { CubeSearchInputProps } from './components/forms/SearchInput/SearchInput';
export { Submit } from './components/actions/Button/Submit';
export type { CubeTextInputBaseProps } from './components/forms/TextInput/TextInputBase';
export type { CubeTextInputBaseProps as CubeTextInputProps } from './components/forms/TextInput/TextInputBase';
export { TextInput } from './components/forms/TextInput/TextInput';
export { TextArea } from './components/forms/TextArea/TextArea';
export type { CubeTextAreaProps } from './components/forms/TextArea/TextArea';
export { FileInput } from './components/forms/FileInput/FileInput';
export type { CubeFileInputProps } from './components/forms/FileInput/FileInput';
export { PasswordInput } from './components/forms/PasswordInput/PasswordInput';
export { Checkbox } from './components/forms/Checkbox/Checkbox';
export type { CubeCheckboxProps } from './components/forms/Checkbox/Checkbox';
export { CheckboxGroup } from './components/forms/Checkbox/CheckboxGroup';
export type { CubeCheckboxGroupProps } from './components/forms/Checkbox/CheckboxGroup';
export { Switch } from './components/forms/Switch/Switch';
export type { CubeSwitchProps } from './components/forms/Switch/Switch';
export { Radio } from './components/forms/RadioGroup/Radio';
export type { CubeRadioProps } from './components/forms/RadioGroup/Radio';
export { Form, Field, useFormProps };
export type { CubeFormProps, CubeFormInstance };
export { ComboBox } from './components/pickers/ComboBox/ComboBox';
export type { CubeComboBoxProps } from './components/pickers/ComboBox/ComboBox';
export { Select, ListBoxPopup } from './components/pickers/Select/Select';
export type {
  CubeSelectProps,
  CubeSelectBaseProps,
} from './components/pickers/Select/Select';
export { NumberInput } from './components/forms/NumberInput/NumberInput';
export type { CubeNumberInputProps } from './components/forms/NumberInput/NumberInput';
export { Avatar } from './components/content/Avatar/Avatar';
export type { CubeAvatarProps } from './components/content/Avatar/Avatar';
export {
  Dialog,
  DialogTrigger,
  DialogContainer,
  DialogForm,
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

// molecules
export { TopBar } from './components/organisms/TopBar/TopBar';
export type { CubeTopbarProps } from './components/organisms/TopBar/TopBar';
export { Alert } from './components/organisms/Alert/Alert';
export type { CubeAlertProps } from './components/organisms/Alert/Alert';
export { DirectoryTree } from './components/organisms/DirectoryTree/DirectoryTree';
export type { CubeDirectoryTreeProps } from './components/organisms/DirectoryTree/DirectoryTree';
export { LegacyTabs } from './components/navigation/LegacyTabs/LegacyTabs';
export type { CubeTabsProps } from './components/navigation/LegacyTabs/LegacyTabs';
export { FileTabs } from './components/organisms/FileTabs/FileTabs';
export type { CubeFileTabProps } from './components/organisms/FileTabs/FileTabs';
export { Modal } from './components/organisms/Modal/Modal';
export type { CubeModalProps } from './components/organisms/Modal/Modal';
export { CopySnippet } from './components/organisms/CopySnippet/CopySnippet';
export type { CubeCopySnippetProps } from './components/organisms/CopySnippet/CopySnippet';
export { StatsCard } from './components/organisms/StatsCard/StatsCard';
export type { CubeStatsCard } from './components/organisms/StatsCard/StatsCard';
export { AlertDialog } from './components/overlays/AlertDialog/AlertDialog';
export type { CubeAlertDialogProps } from './components/overlays/AlertDialog/AlertDialog';
export { SearchResults } from './components/organisms/SearchResults/SearchResults';
export type { CubeSearchResultsProps } from './components/organisms/SearchResults/SearchResults';
export { Result } from './components/organisms/Result/Result';
export type { CubeResultProps, CubeResultStatus } from './components/organisms/Result/Result';

// services
export { notification } from './services/notification';
export type { CubeNotificationOptions } from './services/notification';

export * from './providers/BreakpointsProvider';

export const Typography = {
  Text,
  Title,
  Paragraph,
};

export { Text, Title, Paragraph };
export type { CubeTextProps, CubeTitleProps, CubeParagraphProps };

export { useContextStyles, StyleProvider } from './providers/StylesProvider';

export { Provider } from './provider';
export type { useProviderProps } from './provider';

const Input = Object.assign(TextInput, {
  Text: TextInput,
  Password: PasswordInput,
  Number: NumberInput,
  TextArea: TextArea,
  File: FileInput,
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
  ShortGridStyles,
} from './components/types';
export * from './styles/types';
export * from './styles/list';
export * from './styles/index';

export { ModalProvider } from '@react-aria/overlays';
export * from './utils/react';
export * from './styled';
export { default as copy } from 'clipboard-copy';
export * from '@react-aria/ssr';
