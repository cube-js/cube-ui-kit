---
"@cube-dev/ui-kit": patch
---

Update React Aria to 3.52.1, React Stately to 3.50.0 and the related Adobe accessibility and internationalization packages together. Preserve UI Kit's overlay dismissal, field keyboard handling and Menu callback contracts while adopting the consolidated upstream types.

Custom calendar implementations supplied to date controls must implement the new `@internationalized/date` methods `getMaximumMonthsInYear` and `getMaximumDaysInMonth`. Built-in calendars already support them.
