// Same report-only React Hooks / Compiler rules as `eslint.hooks.config.mjs`,
// pointed at the spike sources so the modern code can be measured.
import root from '../eslint.hooks.config.mjs';

export default root.map((entry) =>
  entry.files
    ? { ...entry, files: ['spikes/form/**/*.{ts,tsx}'], ignores: ['**/*.test.{ts,tsx}'] }
    : entry,
);
