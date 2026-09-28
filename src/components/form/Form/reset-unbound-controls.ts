/**
 * Both form roots cancel a native reset, because the browser would put a bound
 * input back to what it rendered on mount, which is not the form's default once
 * defaults arrive after mount. The browser still owes that reset to every
 * control the form does not own, such as a bare `<input name="token">` in an
 * `action` form, so this runs the HTML reset algorithm on each named control
 * that `isBound` rejects. Unnamed controls are left alone: nothing submits
 * them, and they include inputs that React Aria renders and React controls.
 */
export function resetUnboundControls(
  form: HTMLFormElement,
  isBound: (name: string) => boolean,
) {
  for (const control of Array.from(form.elements)) {
    const name = control.getAttribute('name');

    if (!name || isBound(name)) continue;

    switch (control.tagName) {
      case 'INPUT': {
        const input = control as HTMLInputElement;

        if (input.type === 'checkbox' || input.type === 'radio') {
          input.checked = input.defaultChecked;
        } else if (input.type === 'file') {
          input.value = '';
        } else if (input.type !== 'hidden') {
          input.value = input.defaultValue;
        }
        break;
      }
      case 'TEXTAREA':
      case 'OUTPUT': {
        const text = control as HTMLTextAreaElement | HTMLOutputElement;

        text.value = text.defaultValue;
        break;
      }
      case 'SELECT':
        for (const option of Array.from(
          (control as HTMLSelectElement).options,
        )) {
          option.selected = option.defaultSelected;
        }
        break;
    }
  }
}
