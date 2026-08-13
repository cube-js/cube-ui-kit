---
'@cube-dev/ui-kit': minor
---

Add a `current` type to `Item` (and `Item.Action`) that derives every color — fill, border, label and focus ring — from the inherited text color, so an item adopts the color of whatever container it sits in. The label stays fully opaque, the resting fill is a barely-there `#current.02` chip with a `#current.08` border, and hover, pressed and selected step the same alpha ramp up from there. The type is theme-agnostic and only supports `theme="default"`.
