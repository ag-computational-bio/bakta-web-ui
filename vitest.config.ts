import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import viteConfig from './vite.config'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      browser: {
        enabled: true,
        headless: true,
        instances: [{ browser: 'chromium' }],
        provider: playwright(),
      },
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      projects: [
        {
          extends: true,
          plugins: [
            storybookTest({ configDir: fileURLToPath(new URL('./.storybook', import.meta.url)) }),
          ],
          test: { name: 'storybook' },
        },
        {
          extends: true,
          test: { name: 'unit', include: ['src/**/*.spec.ts'] },
        },
      ],
    },
    optimizeDeps: {
      include: ['@storybook/addon-vitest/internal/test-utils', '@vue/test-utils'],
    },
  }),
)
