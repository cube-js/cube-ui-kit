import { TextInput } from './atoms/TextInput/TextInput';
import { PasswordInput } from './atoms/PasswordInput/PasswordInput';
import { NumberInput } from './atoms/NumberInput/NumberInput';
import { Form as _Form, Field } from './atoms/Form';

import { Text } from './components/Text';
import { Title } from './components/Title';
import { Paragraph } from './components/Paragraph';
import { TextArea } from './atoms/TextArea/TextArea';

const Form = Object.assign(_Form, { Item: Field });

export { Item } from '@react-stately/collections';

// generic components
export { Base } from './components/Base';
export { Block } from './components/Block';
export { Action } from './components/Action';
export { Grid } from './components/Grid';
export { Flex } from './components/Flex';
export { Link } from './atoms/Link/Link';
export { Space } from './components/Space';
export { Flow } from './components/Flow';
export { Root } from './components/Root';
export { PrismCode } from './atoms/PrismCode/PrismCode';
export { Prefix } from './components/Prefix';
export { Suffix } from './components/Suffix';
export { Divider } from './components/Divider';
export { GridProvider } from './components/GridProvider';
export { Content } from './components/Content';
export { Header } from './components/Header';
export { Footer } from './components/Footer';
export { FieldWrapper } from './components/FieldWrapper';

// atoms
export { LoadingAnimation } from './atoms/LoadingAnimation/LoadingAnimation';
export { Spin } from './atoms/Spin/Spin';
export { Base64Upload } from './atoms/Base64Upload/Base64Upload';
export { Card } from './atoms/Card/Card';
export { Button } from './atoms/Button/Button';
export { Placeholder } from './atoms/Placeholder/Placeholder';
export { Skeleton } from './atoms/Skeleton/Skeleton';
export { CloudLogo } from './atoms/CloudLogo/CloudLogo';
export { Badge } from './atoms/Badge/Badge';
export { SearchInput } from './atoms/SearchInput/SearchInput';
export { Submit } from './atoms/Button/Submit';
export { TextInput } from './atoms/TextInput/TextInput';
export { TextArea } from './atoms/TextArea/TextArea';
export { PasswordInput } from './atoms/PasswordInput/PasswordInput';
export { Checkbox } from './atoms/Checkbox/Checkbox';
export { CheckboxGroup } from './atoms/Checkbox/CheckboxGroup';
export { Switch } from './atoms/Switch/Switch';
export { Radio } from './atoms/RadioGroup/Radio';
export { Form, Field };
export { ComboBox } from './atoms/ComboBox/ComboBox';
export { Select } from './atoms/Select/Select';
export { NumberInput } from './atoms/NumberInput/NumberInput';
export { Avatar } from './atoms/Avatar/Avatar';
export { Dialog, DialogTrigger, DialogContainer } from './atoms/Dialog/index';
export { Tooltip } from './atoms/Tooltip/Tooltip';
export { TooltipTrigger } from './atoms/Tooltip/TooltipTrigger';
export { ButtonGroup } from './atoms/ButtonGroup/ButtonGroup';

// molecules
export { TopBar } from './molecules/TopBar/TopBar';
export { Alert } from './molecules/Alert/Alert';
export { DirectoryTree } from './molecules/DirectoryTree/DirectoryTree';
export { Tabs } from './molecules/Tabs/Tabs';
export { FileTabs } from './molecules/FileTabs/FileTabs';
export { Modal } from './molecules/Modal/Modal';
export { CopySnippet } from './molecules/CopySnippet/CopySnippet';
export { StatsCard } from './molecules/StatsCard/StatsCard';
export { AlertDialog } from './molecules/AlertDialog/AlertDialog';

export { SearchResults } from './molecules/SearchResults/SearchResults';
// services

export { notification } from './services/notification';

export * from './providers/Responsive';

export const Typography = {
  Text,
  Title,
  Paragraph,
};

export { Text, Title, Paragraph };

export { useContextStyles, StyleProvider } from './providers/Styles';

export { Provider, useProviderProps } from './provider';

const Input = Object.assign(TextInput, {
  Text: TextInput,
  Password: PasswordInput,
  Number: NumberInput,
  TextArea: TextArea,
});

export { Input };

export * from './components/types';
export * from './styles/types';
export * from './styles/list';

export { ModalProvider } from '@react-aria/overlays';
export * from './utils/react';
