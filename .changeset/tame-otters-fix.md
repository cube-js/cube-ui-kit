---
'@cube-dev/ui-kit': patch
---

`DialogTrigger`'s `mobileType` now defaults to the same value as `type` instead of silently converting `type="popover"` to a full-screen modal under the 700px breakpoint. That auto-conversion was never an intentional per-consumer choice — `FilterPicker` and `Picker` both inherited it by omission, giving them an unrequested full-screen modal (with a close button) on narrow viewports like the Excel/Google Sheets add-in task pane. Consumers that want a different mobile presentation (e.g. `DatePicker`'s `mobileType="tray"`) are unaffected, since they already set it explicitly.

`FilterPicker` additionally no longer shows a close button in its popover at all (`isDismissable={false}` on its own Dialog) — it read as a duplicate of the existing "Clear" action in the header.
