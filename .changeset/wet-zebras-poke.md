---
'@cube-dev/ui-kit': minor
---

Redesigned close button in `<Notification />` component.

Added ability to dismiss a notification in `<NotificationList />` component.

```typescript jsx
import { NotificationsList } from "@cube-dev/ui-kit";

<NotificationList onDismiss={() => console.log('dismissed')}>
  <NotificationsList.Item
    header="Notification title"
    description="Notification description"
  />
</NotificationList>
```

Now notifications generates more uniq ids by default.
