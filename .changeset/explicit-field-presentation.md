---
"@cube-dev/ui-kit": minor
---

Fields now render stable field chrome by default, including standalone inputs without a label, so generated validation and TagInput refusal messages stay visible and describe the control without sentinel props. Use `isBare` explicitly for inline controls or controls whose parent owns their field layout; it suppresses chrome even with a label or deprecated `forceField`, while preserving a supplied label for accessibility. Move whole-field layout styles to `fieldStyles` when migrating previously bare controls. An explicit empty `errorMessage` now suppresses the deprecated `message` fallback, and label-less fields no longer reserve a side-label column. Internal composite controls retain their compact presentation.
