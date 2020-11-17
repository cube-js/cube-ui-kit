export function color(name, opacity = 1) {
  if (opacity !== 1) {
    return `rgba(var(--${name}-color-rgb), ${opacity})`;
  }

  return `var(--${name}-color)`;
}
