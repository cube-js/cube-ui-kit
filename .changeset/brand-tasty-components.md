---
'@cube-dev/ui-kit': patch
---

Restore prop-forwarding behavior for `tasty(Component, …)` extensions under `@tenphi/tasty@2.4.0` by branding UI Kit's custom `forwardRef`/wrapper components (Item, ItemButton, ItemAction, Button, Action, Card, Block, Text, Tag, Space, Flex, Layout, LayoutContent, LayoutPanel, layout `Panel`, TextInputBase, RadioGroup, `Icon`, and `wrapIcon` outputs) so styled extensions like `tasty(Item, { as: 'li' })` and `tasty(ItemButton, …)` keep forwarding props (`as`, `htmlType`, `isDisabled`, `rightIcon`, …) to the wrapped component instead of silently dropping them or leaking them to the DOM.
