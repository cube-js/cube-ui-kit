# Layout examples

## Flow layout

Flow Component is used to create gaps between blocks inside block layout.

## Flex layout

Use Space Component to create a row or a column of elements.

Use Flex Component for more flexible layouts.

## Grid layout

Use Grid Component for grid layouts.

### Simple layout with side bar.

```jsx
<Grid gridColumns="200px 1fr" gridRows="60px 1fr" height="500px">
  <Card gridColumn="1 / -1">Header</Card>
  <Card>Sidebar</Card>
  <Card>Content</Card>
</Grid>
```

