import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfigExport from './vite.config'

export default defineConfig((configEnv) => {
  const viteConfig = typeof viteConfigExport === 'function'
    ? viteConfigExport(configEnv)
    : viteConfigExport

  return mergeConfig(
    viteConfig,
    defineConfig({
      test: {
        environment: 'jsdom',
        exclude: [...configDefaults.exclude, 'e2e/**'],
        root: fileURLToPath(new URL('./', import.meta.url)),
      },
    })
  )
})
