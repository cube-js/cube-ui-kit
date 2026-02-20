---
"@cube-dev/ui-kit": patch
---

**Internal refactoring:** Made token type definitions extensible in the tasty style system. Color names (`TastyNamedColors`), preset names (`TastyPresetNames`), and theme names (`TastyThemeNames`) are now defined via extensible interfaces instead of hardcoded unions.

This change maintains full backward compatibility - all existing UI kit tokens continue to work via module augmentation. Projects can now augment these interfaces to register their own token names for autocomplete.
