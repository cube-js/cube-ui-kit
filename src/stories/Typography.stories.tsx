import {
  Block,
  CubeIcon,
  Flow,
  Link,
  Space,
  Paragraph as UIKitParagraph,
  Text as UIKitText,
} from '../index';

export default {
  title: 'Content/Typography',
};

export const Presets = {
  render: () => (
    <Flow gap="1x" color="#dark">
      <Block preset="h1">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - h1
      </Block>
      <Block preset="h2">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - h2
      </Block>
      <Block preset="h3">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - h3
      </Block>
      <Block preset="h4">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - h4
      </Block>
      <Block preset="h5">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - h5
      </Block>
      <Block preset="h6">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - h6
      </Block>
      <Block preset="t1">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - t1
      </Block>
      <Block preset="t2">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - t2
      </Block>
      <Block preset="t2m">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - t2m
      </Block>
      <Block preset="t3">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - t3
      </Block>
      <Block preset="t3m">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - t3m
      </Block>
      <Block preset="t4">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - t4
      </Block>
      <Block preset="p1">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - p1
      </Block>
      <Block preset="p2">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - p2
      </Block>
      <Block preset="p3">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - p3
      </Block>
      <Block preset="m1">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - m1
      </Block>
      <Block preset="m2">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - m2
      </Block>
      <Block preset="m3">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - m3
      </Block>
      <Block preset="p4">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - p4
      </Block>
      <Block preset="c1">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - c1
      </Block>
      <Block preset="c2">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - c2
      </Block>
      <Block preset="tag">
        <CubeIcon /> The quick brown fox jumps over the lazy dog - tag
      </Block>
    </Flow>
  ),
};

export const Paragraph = {
  render: () => (
    <Flow gap="2x">
      <UIKitParagraph width="320px">
        There are many ways to create typography elements like text labels and
        headings.
      </UIKitParagraph>
      <UIKitParagraph>
        You can use complete components, presets or low-level styles to get
        exact text label you want.
      </UIKitParagraph>
    </Flow>
  ),
};

export const Text = {
  render: () => (
    <Space flow="row wrap" preset="t3" placeItems="baseline">
      <UIKitText>Normal label</UIKitText>
      <UIKitText.Success>Success label</UIKitText.Success>
      <UIKitText.Danger>Danger label</UIKitText.Danger>
      <UIKitText.Strong>Strong label</UIKitText.Strong>
      <UIKitText.Emphasis>Emphasis label</UIKitText.Emphasis>
      <UIKitText.Highlight>Highlight label</UIKitText.Highlight>
    </Space>
  ),
};

export const ExternalLink = {
  render: () => (
    <UIKitParagraph>
      <Link to="https://cube-uikit-storybook.netlify.app/">
        Open Cube Cloud UI Kit
      </Link>{' '}
      |{' '}
      <Link to="!https://cube-uikit-storybook.netlify.app/">
        Open Cube Cloud UI Kit in new tab
      </Link>
    </UIKitParagraph>
  ),
};

export const LinkWithoutUsingRouter = {
  render: () => (
    <UIKitParagraph>
      <Link to="@">Reload the current page</Link> |{' '}
      <Link to="@/">Move to the Main Page</Link>
    </UIKitParagraph>
  ),
};
