---
"@cube-dev/ui-kit": patch
---

`FilterPicker` shows options that arrive while its popover is open, such as a server search's results with `filter={false}`. With `sortSelectedToTop`, which is on when `items` is set, it kept showing the options it opened with until the next change. With `allowsCustomValue`, a selected value shown as a custom value is listed once when it arrives among the options, in place of the custom value, instead of twice.
