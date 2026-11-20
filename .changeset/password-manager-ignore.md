---
"@cube-dev/ui-kit": minor
---

`PasswordInput`, `TextInput` and `TextArea` take `ignorePasswordManagers`, for a secret that is not the user's own login (an API key, an OAuth client secret, a private key) and the text field paired with it. It sets `data-1p-ignore`, `data-lpignore`, `data-form-type="other"` and `data-protonpass-ignore`, the attributes 1Password, LastPass, Dashlane and Proton Pass read as an opt-out where they ignore `autocomplete="off"` (each documents its own effect: no save or fill, no icon, no autofill, skipped). It also sets `data-bwignore`, which Bitwarden's release builds don't honour today, so Bitwarden may still offer. A browser's built-in password manager documents no such opt-out. The same attribute in `inputProps` wins over the flag, and `null` there drops it.
