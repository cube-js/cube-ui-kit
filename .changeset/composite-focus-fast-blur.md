---
"@cube-dev/ui-kit": patch
---

`ComboBox`, `SearchComboBox` and `CommandTextArea` no longer miss a blur when focus enters and leaves them within one animation frame, as it does in a fast automated test. Commit-on-blur and `onBlur` now run in that case too.
