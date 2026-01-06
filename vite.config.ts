import NodePath from 'node:path'
import NodeProcess from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import VitePluginInfo from 'unplugin-info/vite'
import { default as VitePluginSolid } from 'vite-plugin-solid'
import VitePluginDevtoolsJson from 'vite-plugin-devtools-json'
import { default as VitePluginTailwindCSS } from '@tailwindcss/vite'
import { cloudflare as VitePluginCloudflare } from '@cloudflare/vite-plugin'
import { devtools as VitePluginTanstackDevtools } from '@tanstack/devtools-vite'
import { tanstackStart as VitePluginTanstackStart } from '@tanstack/solid-start/plugin/vite'

import { rollupPluginMdx } from './markdown.config.ts'

export default defineConfig(config => {
  const env = loadEnv(config.mode, NodeProcess.cwd(), '')

  return {
    resolve: {
      alias: {
        '#': NodePath.resolve(import.meta.dirname, 'src'),
        'solid-jsx/jsx-runtime': NodePath.resolve(
          import.meta.dirname,
          'src/lib/solid-jsx/jsx-runtime.ts'
        ),
        'solid-jsx/jsx-dev-runtime': NodePath.resolve(
          import.meta.dirname,
          'src/lib/solid-jsx/jsx-dev-runtime.ts'
        ),
        'solid-jsx': NodePath.resolve(import.meta.dirname, 'src/lib/solid-jsx/jsx-runtime.ts')
      }
    },
    plugins: [
      VitePluginDevtoolsJson(),
      VitePluginTanstackDevtools({
        removeDevtoolsOnBuild: true,
        eventBusConfig: {
          port: randomIntInclusive(3_110, 8_110)
        }
      }),
      VitePluginInfo({
        cloudflare: true,
        github: 'https://github.com/o-az/omar.mov'
      }),
      VitePluginCloudflare({
        viteEnvironment: { name: 'ssr' }
      }),
      VitePluginTailwindCSS(),
      VitePluginTanstackStart({
        start: { entry: './src/start.ts' },
        server: { entry: './src/server.ts' },
        client: { entry: './src/client.ts' }
      }),
      rollupPluginMdx(),
      VitePluginSolid({ ssr: true })
    ],
    optimizeDeps: {
      exclude: ['solid-jsx'],
      entries: ['./src/**/*.{ts,tsx}']
    },
    server: {
      port: Number(env.PORT || randomIntInclusive(3_100, 8_100))
    },
    build: {
      minify: false,
      target: 'esnext',
      emptyOutDir: true
    }
  }
})

function randomIntInclusive(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}
