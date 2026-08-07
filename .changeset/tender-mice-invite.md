---
'@cube-dev/ui-kit': minor
---

Export `IconSwitch` (and its `CubeIconSwitchProps` type) from the package root.

`IconSwitch` cross-fades between icons when its children change — the animated
icon swap used inside buttons and items. It already had a stories file and a
published docs page under `Helpers/IconSwitch`, and `src/components/helpers/index.ts`
exported it, but that barrel is not re-exported from `src/index.ts` — only
`DisplayTransition` was pulled through. So the component was publicly documented
while being impossible to import.

```tsx
import { IconSwitch } from '@cube-dev/ui-kit';

<IconSwitch>{isLoading ? <LoaderIcon /> : <CheckIcon />}</IconSwitch>;
```
