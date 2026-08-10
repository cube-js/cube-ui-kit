---
'@cube-dev/ui-kit': minor
---

Remove `FileTabs`. Use `Tabs` instead.

`FileTabs` was an editor-style tab bar with close buttons and dirty-state dots.
Its `FileTabProps` has carried `@deprecated consider using <Tabs /> instead`
since before the Glaze migration. Cube Cloud — the component's only known
consumer — moved `FilesEditor` onto `Tabs` in October 2025 and has had no
reference to it since.

Removed from the public API: the `FileTabs` component (with its
`FileTabs.TabPane` subcomponent) and the `CubeFileTabProps` type.

```diff
-<FileTabs defaultActiveKey="1" onTabClose={(key) => removeTab(key)}>
-  <FileTabs.TabPane id="1" title="index.ts" />
-  <FileTabs.TabPane id="2" title="styles.css" />
-</FileTabs>
+<Tabs defaultActiveKey="1" onDelete={(key) => removeTab(key)}>
+  <Tabs.Panel key="1" title="index.ts" />
+  <Tabs.Panel key="2" title="styles.css" />
+</Tabs>
```

The close button is the main behaviour to port: on `Tabs` it is `onDelete`, and
passing it is what makes the buttons appear (`onTabClose` on `FileTabs`).
`Tabs` has no built-in equivalent of `isDirty` — render the unsaved indicator
into the tab's `title` or `actions`, which is what Cube Cloud's `FilesEditor`
does.
