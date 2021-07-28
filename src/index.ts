import { TextInput } from './atoms/TextInput/TextInput';
import { PasswordInput } from './atoms/PasswordInput/PasswordInput';
import { NumberInput } from './atoms/NumberInput/NumberInput';
import { Form } from './atoms/Form/Form';
import { Field } from './atoms/Form/Field';

import { Text } from './components/Text';
import { Title } from './components/Title';
import { Paragraph } from './components/Paragraph';
import { TextArea } from './atoms/TextArea/TextArea';

// Form.Item = Field;

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
export { Submit } from './components/Submit';
export { TextInput } from './atoms/TextInput/TextInput';
export { TextArea } from './atoms/TextArea/TextArea';
export { PasswordInput } from './atoms/PasswordInput/PasswordInput';
export { Checkbox } from './atoms/Checkbox/Checkbox';
export { CheckboxGroup } from './atoms/Checkbox/CheckboxGroup';
export { Switch } from './atoms/Switch/Switch';
export { Radio } from './atoms/RadioGroup/Radio';
export { Form, Field };
export { ComboBox } from './atoms/ComboBox/ComboBox';
export { Select, Item } from './atoms/Select/Select';
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

const Input = TextInput;

// Input.Text = TextInput;
// Input.Password = PasswordInput;
// Input.Number = NumberInput;
// Input.TextArea = TextArea;

export { Input };
