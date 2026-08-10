---
'@cube-dev/ui-kit': minor
---

Change what a refresh looks like: the table now fades — header included — and a
band of lower opacity sweeps left to right across it, the way ag-grid marks a
reloading grid. The spinner that used to sit on top of the rows is gone.

`loadingIndicator="overlay"` exists to keep the previous answer on screen while
the next one loads, and parking a spinner in the middle of it covered the very
rows the mode is for. Dimming was also applied to `<tbody>` alone, so the header
stayed at full strength and read as though the columns were current and only the
data was not.

The sweep is a `mask-image`, not a coloured overlay, so the band genuinely
lowers the content's opacity rather than painting a stripe over it — no colour
token to resolve, and correct on any backdrop. The refresh is still announced
through `role="status"`; it is simply no longer drawn over the content.

`LoadingAnimation` itself is unchanged and still exported — this only stops the
tables from using it.
