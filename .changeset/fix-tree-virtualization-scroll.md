---
'@cube-dev/ui-kit': patch
---

**Tree**: fix virtualized scroll container growing past its fixed height. The virtual sizer (`height: totalSize`) was being applied directly to the scroll element, so scrolling down made the viewport expand instead of revealing more rows. The sizer is now an inner wrapper, leaving the outer element as a stable scroll viewport.
