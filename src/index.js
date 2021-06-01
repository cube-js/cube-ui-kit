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
