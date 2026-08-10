---
'@cube-dev/ui-kit': patch
---

Fix every control rendered inside a table getting a 10px corner radius instead
of the global 6px.

Rounding the cells that meet a `card` frame's corner introduced a root token
named `$radius`. That emits `--radius` — the kit's **global** radius token — so
declaring it on the table root redefined it for the whole subtree: every
`Button`, `Input` and `Tag` inside a cell inherited the card's radius, and every
`1r` / `2r` unit in there moved with it.

The frame now uses the `1cr` unit (`--card-radius`) directly, with no
intermediate token. A browser test renders a `Button` in a cell and asserts its
corner still matches the global radius.

The failure mode is worth remembering: devtools showed `var(--radius)` on the
Button and looked correct, because the reference was right and only the value
had been overridden a level up. The bug also points away from its cause — the
table looks fine and a component three levels away is wrong.
