# Typography

There are many ways to create typography elements like text labels and headings. You can use complete components, presets or low-level styles to get exact text label you want.

## Typography Components

### Headings

### Paragraphs

Paragraphs with gaps between them.

### Text labels

### Links

Use `!` prefix to open link in new tab.

```jsx
(
  <Link to="https://cube-uikit-storybook.netlify.app/">
    Open Cube Cloud UI Kit
  </Link>
) |
  (
    <Link to="!https://cube-uikit-storybook.netlify.app/">
      Open Cube Cloud UI Kit in new tab
    </Link>
  );
```

Use `@` prefix to navigate to the new page without using the Router.

```jsx
<Link to="@">Reload this page</Link> |
<Link to="@/">Move to the Main Page</Link>;
```

