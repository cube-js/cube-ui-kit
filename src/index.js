import Text from './components/Text';
import Title from './components/Title';
import Paragraph from './components/Paragraph';

// generatic components
export { default as Base } from './components/Base';
export { default as Block } from './components/Block';
export { default as Action } from './components/Action';
export { default as Grid } from './components/Grid';
export { default as Flex } from './components/Flex';
export { default as Link } from './components/Link';
export { default as Space } from './components/Space';
export { default as Flow } from './components/Flow';
export { default as Root } from './components/Root';
export { default as PrismCode } from './atoms/PrismCode/PrismCode';

// atoms
export { default as LoadingAnimation } from './atoms/LoadingAnimation/LoadingAnimation';
export { default as Spin } from './atoms/Spin/Spin';
export { default as Base64Upload } from './atoms/Base64Upload/Base64Upload';
export { default as Card } from './atoms/Card/Card';
export { default as Button } from './atoms/Button/Button';
export { default as Placeholder } from './atoms/Placeholder/Placeholder';
export { default as Skeleton } from './atoms/Skeleton/Skeleton';
export { default as CloudLogo } from './atoms/CloudLogo/CloudLogo';

// molecules
export { default as TopBar } from './molecules/TopBar/TopBar';
export { default as Alert } from './molecules/Alert/Alert';
export { default as DirectoryTree } from './molecules/DirectoryTree/DirectoryTree';
export { default as FileTabs } from './molecules/FileTabs/FileTabs';
export { default as Modal } from './molecules/Modal/Modal';
export { default as CopySnippet } from './molecules/CopySnippet/CopySnippet';
export { default as StatsCard } from './molecules/StatsCard/StatsCard';

// services
export { default as notification } from './services/notification';

export * from './providers/Responsive';

export const Typography = {
  Text,
  Title,
  Paragraph,
};

export { Text, Title, Paragraph };
