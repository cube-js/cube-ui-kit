---
'@cube-dev/ui-kit': patch
---

`DialogTrigger`: make `shouldCloseOnInteractOutside` actually reach the popover.

The prop was inert for a popover type Dialog. `PopoverTrigger` wraps the caller's predicate in its own resolver, and that resolver consulted the predicate last — after the automatic behaviours. Every `Button` and `ItemButton` carries `data-popover-dismiss`, so the auto-dismiss branch matched first, scheduled the close and returned, and the predicate was never called. A caller could not keep a popover open for a chosen element: it closed on every outside interaction regardless of what the predicate would have said.

The predicate is now asked first, so an explicit "keep me open for this element" wins over the automatic dismiss. Returning `false` still lets the click through to the control that was pressed (the resolver only reports "close" when the popover really should close, which is what stops React Aria from swallowing the click), so a guarded button both keeps the popover open and runs its own `onPress`.

One thing to know when writing the predicate: React Aria passes the element the pointer landed on, which for a `Button` is the label inside it rather than the `<button>` itself. Guard with `contains()`, not an identity check — `(el) => !myRef.current?.UNSAFE_getDOMNode()?.contains(el)`.

Nothing changes for callers that never passed the prop: without a predicate the resolver behaves exactly as before.
