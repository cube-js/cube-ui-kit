/**
 * The attributes password manager extensions read as "leave this field alone". They treat a text
 * field followed by a password field as a login form whatever its `autocomplete`, so these are the
 * only way to keep them off a credential that is not the user's own login.
 */
const PASSWORD_MANAGER_IGNORE_PROPS = {
  // 1Password
  'data-1p-ignore': 'true',
  // LastPass
  'data-lpignore': 'true',
  // Bitwarden: release builds don't honour it today (it sits behind a setting that is off and
  // hidden outside development builds); set so the field is covered if Bitwarden turns it on.
  'data-bwignore': 'true',
  // Proton Pass: read by presence, the value doesn't matter.
  'data-protonpass-ignore': 'true',
  // Dashlane
  'data-form-type': 'other',
} as const;

export function getPasswordManagerIgnoreProps(
  isIgnored: boolean | undefined,
): typeof PASSWORD_MANAGER_IGNORE_PROPS | undefined {
  return isIgnored ? PASSWORD_MANAGER_IGNORE_PROPS : undefined;
}
