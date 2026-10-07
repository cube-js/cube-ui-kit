---
"@cube-dev/ui-kit": patch
---

Make Checkbox and Switch qa selectors identify only their hidden interactive input. The visual box or track now uses data-element="Input" instead of data-qa="Checkbox" or data-qa="Switch"; target that marker or use inputStyles when customizing the visual element. Picker and FilterPicker no longer duplicate their trigger's aria-label on the generic wrapper.
