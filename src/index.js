import { Text } from './components/Text';
import { Title } from './components/Title';
import { Paragraph } from './components/Paragraph';

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
export { SearchField } from './atoms/SearchField/SearchField';
export { Submit } from './components/Submit';
export { TextField } from './atoms/TextField/TextField';
export { PasswordField } from './atoms/TextField/PasswordField';
export { Checkbox } from './atoms/Checkbox/Checkbox';
export { Switch } from './atoms/Switch/Switch';
export { Radio } from './atoms/RadioGroup/Radio';
export { Form } from './atoms/Form/Form';
export { ComboBox } from './atoms/ComboBox/ComboBox';
export { Select, Item } from './atoms/Select/Select';

// molecules
export { TopBar } from './molecules/TopBar/TopBar';
export { Alert } from './molecules/Alert/Alert';
export { DirectoryTree } from './molecules/DirectoryTree/DirectoryTree';
export { Tabs } from './molecules/Tabs/Tabs';
export { FileTabs } from './molecules/FileTabs/FileTabs';
export { Modal } from './molecules/Modal/Modal';
export { CopySnippet } from './molecules/CopySnippet/CopySnippet';
export { StatsCard } from './molecules/StatsCard/StatsCard';
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

export { useContextStyles, StylesProvider } from './providers/Styles';

export { Provider, useProviderProps } from './provider';
