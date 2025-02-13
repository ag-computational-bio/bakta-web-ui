import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'
import { storybookTest } from '@storybook/experimental-addon-test/vitest-plugin'
import { storybookVuePlugin } from '@storybook/vue3-vite/vite-plugin'
export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [
      // See options at: https://storybook.js.org/docs/writing-tests/vitest-plugin#storybooktest
      storybookTest(),
      storybookVuePlugin(),
    ],
    test: {
      browser: {
        enabled: true,
        headless: true,
        instances: [{ browser: 'chromium', headless: true }],
        provider: 'playwright',
      },
      // Make sure to adjust this pattern to match your stories files.
      setupFiles: ['./.storybook/vitest.setup.ts'],
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
    optimizeDeps: {
      include: ['@storybook/experimental-addon-test/internal/test-utils', '@vue/test-utils'],
    },
  }),
)
