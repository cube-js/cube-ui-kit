---
"@cube-dev/ui-kit": patch
---

`parseAbsoluteDate` now returns a UTC `ZonedDateTime` for a string with a zone or offset, such as `2024-01-05T00:00:00Z` or `2024-01-05T00:00:00+02:00`, instead of `undefined`. A `DateInput` given such a string as its value now shows it instead of an empty field. An ISO date-time without a zone, such as `2024-01-05T10:30` or `2024-01-05 10:30:15`, is now read as UTC wall time; it used to be read in the browser's time zone, which moved it by the browser's offset and could show the previous or next day. A malformed day `00` is still rejected. Date-only strings, `Date` objects and other date strings parse as before. A local workaround that parses these strings before passing them in is no longer needed.
