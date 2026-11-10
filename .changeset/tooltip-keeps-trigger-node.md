---
'@cube-dev/ui-kit': patch
---

A `Button` whose label starts or stops truncating, for example when its container is resized, keeps its DOM node and its keyboard focus. The automatic tooltip used to wrap the button only while the label was cut off, so React replaced the `<button>` element each time and focus dropped to the page. The tooltip is now mounted beside the element instead of around it, and only while there is one. The same applies to every component with an automatic or toggled tooltip: `Item`, `ItemButton` and `Menu` items, `TextItem`, the `Layout.Header` title, `InlineInput`, `Checkbox`, `Switch`, `Radio` and text inputs. A component whose tooltip never turns on runs none of the tooltip's logic. `Item`'s private `isDynamicLabel` prop is removed: it kept the tooltip mounted only to avoid that remount.
