import {
  Paragraph as UIKitParagraph,
  Text as UIKitText,
  Link,
  Flow,
  Space,
  Block,
} from '../index';

export default {
  title: 'Typography',
};

export const Presets = {
  render: () => (
    <Flow gap="1x" color="#dark">
      <Block preset="h1">
        The quick brown fox jumps over the lazy dog - h1
      </Block>
      <Block preset="h2">
        The quick brown fox jumps over the lazy dog - h2
      </Block>
      <Block preset="h3">
        The quick brown fox jumps over the lazy dog - h3
      </Block>
      <Block preset="h4">
        The quick brown fox jumps over the lazy dog - h4
      </Block>
      <Block preset="h5">
        The quick brown fox jumps over the lazy dog - h5
      </Block>
      <Block preset="h6">
        The quick brown fox jumps over the lazy dog - h6
      </Block>
      <Block preset="t1">
        The quick brown fox jumps over the lazy dog - t1
      </Block>
      <Block preset="t2">
        The quick brown fox jumps over the lazy dog - t2
      </Block>
      <Block preset="t2m">
        The quick brown fox jumps over the lazy dog - t2m
      </Block>
      <Block preset="t3">
        The quick brown fox jumps over the lazy dog - t3
      </Block>
      <Block preset="t3m">
        The quick brown fox jumps over the lazy dog - t3m
      </Block>
      <Block preset="t4">
        The quick brown fox jumps over the lazy dog - t4
      </Block>
      <Block preset="p1">
        The quick brown fox jumps over the lazy dog - p1
      </Block>
      <Block preset="p2">
        The quick brown fox jumps over the lazy dog - p2
      </Block>
      <Block preset="p3">
        The quick brown fox jumps over the lazy dog - p3
      </Block>
      <Block preset="p4">
        The quick brown fox jumps over the lazy dog - p4
      </Block>
      <Block preset="c1">
        The quick brown fox jumps over the lazy dog - c1
      </Block>
      <Block preset="c2">
        The quick brown fox jumps over the lazy dog - c2
      </Block>
      <Block preset="tag">
        The quick brown fox jumps over the lazy dog - tag
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
      <UIKitText.Selection>Selection label</UIKitText.Selection>
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
