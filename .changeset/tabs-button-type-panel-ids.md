---
'@cube-dev/ui-kit': patch
---

`Tabs`: a tab is now a `type="button"` button, so tabs inside a `<form>` no longer submit it when clicked or activated with Enter or Space, and Enter in a field of a tab panel no longer submits the form through the first tab. With `prerender` or `keepMounted`, each rendered panel now gets its own id, so the selected tab's `aria-controls` points at its own panel instead of the first one.
