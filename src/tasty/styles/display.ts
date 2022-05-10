export function displayStyle({ display, hide }) {
  return { display: !hide ? display : 'none' };
}

displayStyle.__lookupStyles = ['display', 'hide'];
