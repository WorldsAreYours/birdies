import { defineConfig } from 'vitest/config';

// The core is pure, so most tests need no DOM. Anything that renders goes in a
// *.test.tsx file; the shell is tested with react-dom/server so the default run
// stays dependency-free — no jsdom, no Testing Library, until a screen needs it.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
  },
});
