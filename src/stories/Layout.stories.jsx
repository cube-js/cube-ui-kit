import {
  Block,
  Button,
  Card,
  Space,
  Flex as UIKitFlex,
  Flow as UIKitFlow,
  Grid as UIKitGrid,
} from '../index';

export default {
  title: 'Layout',
};

export const Flow = {
  render: () => (
    <UIKitFlow gap>
      <Card>Card 1</Card>
      <Card>Card 2</Card>
      <Card>Card 3</Card>
    </UIKitFlow>
  ),
};

export const Flex = {
  render: () => (
    <UIKitFlow gap>
      <Space flow="row">
        <Block>horizontal space</Block>
        <Button>One</Button>
        <Button>Two</Button>
      </Space>
      <Space flow="column">
        <Block>vertical space</Block>
        <Button>One</Button>
        <Button>Two</Button>
      </Space>
    </UIKitFlow>
  ),
};

export const FlexCustom = {
  render: () => (
    <UIKitFlex
      flow="row"
      gap="4x"
      placeContent="space-between"
      placeItems="center"
    >
      <Button>One</Button>
      <Button>Two</Button>
      <Button>Three</Button>
      <Button>Four</Button>
    </UIKitFlex>
  ),
};

export const Grid = {
  render: () => (
    <UIKitGrid
      gridColumns="200px 1fr"
      gridRows="60px 1fr"
      height="500px"
      gap="1x"
    >
      <Card gridColumn="1 / -1">Header</Card>
      <Card>Sidebar</Card>
      <Card>Content</Card>
    </UIKitGrid>
  ),
};
