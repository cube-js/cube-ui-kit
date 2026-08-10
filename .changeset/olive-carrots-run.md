---
'@cube-dev/ui-kit': patch
---

Infinite scroll now appends a full batch of skeleton rows while loading, instead
of a fixed three.

Three rows is about 120px: the user hits the bottom of the list with nothing
left to scroll into, and then the content lurches when a batch of fifty lands
under a placeholder of three. The burst is now sized to the batch that is
coming — measured from the last one that arrived — so the list keeps its length
through the load and the scroll height is right both before and after it.

Measured rather than read from `pageSize`, which infinite-scroll consumers often
do not set, and the first batch is the best predictor of the second. Capped at
50 rows, taller than any viewport, because these rows sit after the virtualized
window and so are real DOM.

Infinite scroll also starts fetching **a full screen before the end** rather
than 200px before it. `loadMoreMargin` now defaults to the scroller's own
height, so the request goes out while a viewport of rows is still left to read.
200px is about five rows: a fast scroll reached the bottom before the response
did, which is the stall infinite scroll exists to prevent. Pass an explicit
`loadMoreMargin` to override, including `0` to fetch only on arrival.
