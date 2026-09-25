---
"@cube-dev/ui-kit": minor
---

`TooltipProvider` takes a `qa` for the tooltip it renders, and so does every component's `tooltip` object: `<Button tooltip={{ title: 'Copy', qa: 'CopyTooltip' }}>`. Only `tooltipStyles` and `width` used to reach the tooltip, and `Tooltip` itself dropped the `qa` its props accept, so a test could only find a tooltip by `role="tooltip"` — which works while exactly one is open and never says whose it is.
