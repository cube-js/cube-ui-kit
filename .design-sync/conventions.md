# Building with @cube-dev/ui-kit

## 1. Wrap everything in `<Root>` — non-negotiable

`Root` is the provider. It carries the design tokens, the color scheme, i18n, and the portal/overlay/event-bus contexts. Without it, styles resolve to nothing and any component using an overlay, tooltip, menu, dialog, or notification throws a missing-provider error at render.

```jsx
const { Root, Button } = window.CubeUIKit;

<Root fontDisplay="auto">
  <Button type="primary">Save</Button>
</Root>
```

Mount `Root` **once**, at the top of the tree. Dark mode is driven by `<html data-scheme="dark">`; every color token resolves against it automatically, so never hand-write a dark variant.

## 2. There are NO CSS classes. Style via props.

This library styles through **tasty** (CSS-in-JS, injected at runtime). There is no utility-class vocabulary and no stylesheet to import — `_ds_bundle.css` is an intentional stub. Writing `className="p-4 bg-gray-100"` produces unstyled output. Instead, pass style props directly to any component:

| Family | Props |
| --- | --- |
| Fill & text | `fill` (background — **not** `background`), `color`, `fade`, `image` |
| Box | `padding`, `paddingInline`, `paddingBlock`, `border`, `radius`, `shadow`, `outline`, `overflow`, `textAlign` |
| Size | `width`, `height`, `flex`, `flexGrow`, `flexShrink`, `flexBasis` |
| Layout | `flow`, `gap`, `columnGap`, `rowGap`, `align`, `justify`, `alignItems`, `justifyContent`, `place`, `placeItems`, `placeContent`, `gridColumns` |
| Position | `position`, `inset`, `margin`, `zIndex`, `order`, `gridArea`, `gridColumn`, `gridRow`, `alignSelf`, `justifySelf`, `placeSelf` |
| Type | `preset`, `font`, `fontWeight`, `fontStyle`, `textTransform`, `whiteSpace` |
| Misc | `display`, `opacity`, `transition`, `hide` |

Use `styles={{ … }}` for the same keys when you want them grouped, or to target a component's inner elements.

**Units.** `1x` = one gap step (8px) — `2x`, `.5x`, `4x` all work. `1r` = one radius step (6px). Plain CSS values (`16px`, `50%`, `1fr`) are fine too.

**Colors are tokens, written `#name`** — never hex literals, or dark mode breaks: `#purple` `#primary` `#surface` `#surface-2` `#surface-3` `#border` `#text` `#dark` `#dark-02` `#dark-03` `#white` `#clear` `#minor` `#disabled` `#shadow`, plus semantic `#danger` `#success` `#warning` `#note`. Most have `-text` / `-bg` / `-hover` / `-icon` variants (e.g. `#danger-text`).

**Typography uses `preset`**, not font-size: `h1`–`h6`, `t1`/`t2`/`t2m`/`t3`/`t3m`/`t4`/`t4m` (text), `p1`–`p4` (paragraph), `m1`–`m3` (mono), `c1`/`c2` (caption), `tag`, `s2`–`s4` (code).

## 3. Layout primitives have no preview cards — use them anyway

`Flex`, `Space`, `Flow`, `Grid`, and `Block` are real exports with no cards in the component picker (they have no stories). **They are the right tool for your own layout glue** — do not reach for raw `<div>` + inline CSS. Also carded-but-worth- knowing: `Title`, `Text`, `Paragraph`, `Prefix`, `Suffix`, `Panel`, `Divider`. All accept every style prop above.

## 4. Semantic props before style props

Components carry their own design language — prefer it over restyling. `Button` takes `type` (`primary` | `outline` | `outline-2` | `clear` | `link`), `theme` (`default` | `danger` | `success` | `warning` | `note` | `special` | `current`), `size` (`xsmall`…`xlarge`, `inline`), plus `icon`, `rightIcon`, `isLoading`, `isSelected`, `tooltip`, `to`. Fields share `label`, `description`, `isRequired`, `isDisabled`, `validationState`. Read the component's `<Name>.d.ts` and `<Name>.prompt.md` before inventing styling.

## 5. Where the truth lives

- `_ds/<folder>/styles.css` — the only stylesheet; it just `@import`s the Inter webfont. Component CSS is injected at runtime, so there is nothing else to read.
- `components/<group>/<Name>/<Name>.d.ts` — the real prop contract.
- `components/<group>/<Name>/<Name>.prompt.md` — usage and examples.

## 6. Idiomatic example

```jsx
const { Root, Card, Title, Paragraph, TextInput, Button, Flow, Space } = window.CubeUIKit;

<Root fontDisplay="auto">
  <Flow gap="3x" padding="4x" fill="#surface" height="100%">
    <Card padding="3x" radius="1r" fill="#white" border="#border">
      <Flow gap="2x">
        <Title preset="h4">Connect a data source</Title>
        <Paragraph preset="p3" color="#minor">
          Credentials are encrypted at rest.
        </Paragraph>
        <TextInput label="Host" placeholder="db.example.com" />
        <Space gap="1x" justify="end">
          <Button type="clear">Cancel</Button>
          <Button type="primary">Connect</Button>
        </Space>
      </Flow>
    </Card>
  </Flow>
</Root>
```
