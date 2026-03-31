import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import viteConfig from './vite.config'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'

export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [
      storybookTest({ configDir: fileURLToPath(new URL('./.storybook', import.meta.url)) }),
    ],
    test: {
      browser: {
        enabled: true,
        headless: true,
        instances: [{ browser: 'chromium' }],
        provider: playwright(),
      },
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
    optimizeDeps: {
      include: ['@storybook/addon-vitest/internal/test-utils', '@vue/test-utils'],
    },
  }),
)
