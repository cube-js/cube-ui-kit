---
'@cube-dev/ui-kit': patch
---

`Board`: a marquee (lasso) drag no longer selects text under it. Dragging a band across widgets used to paint a native text selection and leave stray highlighted text behind once the band was gone. The board carries a `marquee` modifier (`data-marquee`) for the length of the gesture.
