---
'@cube-dev/ui-kit': patch
---

`Item`, `Button`: show the tooltip while the element is disabled, and stop putting the native
`disabled` attribute on elements that cannot carry it.

A tooltip on a disabled control is usually where the reason for being unavailable is written, but
browsers do not dispatch mouse events on elements carrying the native `disabled` attribute, so the
hover that opens the tooltip never arrived. What a disabled `Button` did instead was rely on a
quirk: Chromium still delivers *pointer* events to a natively disabled control, so the tooltip
opened there and nowhere else — not on a fallback to mouse events, and not under test. `Item` had
it worse, since it also set the attribute on whatever it rendered — a `div` or an `li` in most
cases, where it is invalid markup that only got in the way. When such an element has a tooltip that
can open, the disabled state now reaches the DOM as
`aria-disabled="true"` instead, and the element is kept inert by hand: activation handlers are
dropped and clicks (including the ones Enter and Space produce) do nothing, so `onPress` / `onClick`
stay silent and a `submit` button no longer submits its form. Such an element stays in the tab
order, so keyboard users can focus it and read the tooltip too.

Nothing changes for a disabled element without a tooltip: a `Button`, `ItemButton`, or `Item`
rendered as a form control keeps the native attribute. A disabled `Item` that is not a form control
does become inert, though — until now the attribute it carried did nothing there, so handlers passed
to it still ran.

Three related fixes come with it: a `Button` rendered as a link (`to`) is now announced as disabled
through `aria-disabled` — it previously had no accessible disabled state at all, only an invalid
`disabled` attribute on the anchor; `Item` now treats a `disabled` prop as an alias of `isDisabled`
rather than letting it overwrite what the component decided; and `ItemTable`'s `disabledTooltip` for
a bulk action reaches the user, which it could not while the button was natively disabled.
