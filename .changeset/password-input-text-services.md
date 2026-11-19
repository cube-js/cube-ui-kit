---
"@cube-dev/ui-kit": patch
---

`PasswordInput` keeps its value out of the browser's spellchecker, autocorrect and autocapitalization by default (`spellCheck="false"`, `autoCorrect="off"`, `autoCapitalize="none"`), so a shown password or a `multiLine` secret such as a private key is no longer underlined or sent to an enhanced spellchecker; pass your own value to override one. A `multiLine` `PasswordInput` no longer puts a `type` attribute on its textarea.
