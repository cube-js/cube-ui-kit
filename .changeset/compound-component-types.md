---
'@cube-dev/ui-kit': patch
---

Export the types of the compound components: `LayoutComponent`, `GridLayoutComponent`, `TextComponent`, `FormComponent`, `TabsComponent` and `ItemTableComponent`. `NotificationComponent` becomes a named interface. The props types their parts use are exported too (`CubeLayoutFlexProps` and the other `Layout` part props, `CubeCollectionItemProps`, `CubeFieldProps` and `EventBusProviderProps`). An app that exports `tasty(Layout, …)` or another extension of a kit component without a type annotation can now emit its declarations: they name these types, so they no longer fail with TS2883 or TS4023.
