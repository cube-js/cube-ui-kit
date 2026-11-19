---
"@cube-dev/ui-kit": patch
---

`ItemTable` in `paginationMode="infinite"` no longer throws where there is no `IntersectionObserver`, as in jsdom tests: it loads nothing more there, as `ListBox` does.
