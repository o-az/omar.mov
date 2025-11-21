import NodePath from 'node:path'
import NodeProcess from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import VitePluginInfo from 'unplugin-info/vite'
import { default as VitePluginSolid } from 'vite-plugin-solid'
import { default as VitePluginTailwindCSS } from '@tailwindcss/vite'
import { cloudflare as VitePluginCloudflare } from '@cloudflare/vite-plugin'
import { devtools as VitePluginTanstackDevtools } from '@tanstack/devtools-vite'
import { tanstackStart as VitePluginTanstackStart } from '@tanstack/solid-start/plugin/vite'

export default defineConfig(config => {
  const env = loadEnv(config.mode, NodeProcess.cwd(), '')

  return {
    resolve: {
      alias: {
        '#': NodePath.resolve(import.meta.dirname, 'src')
      }
    },
    plugins: [
      VitePluginTanstackDevtools({ removeDevtoolsOnBuild: true }),
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
      VitePluginSolid({ ssr: true })
    ],
    server: {
      port: Number(env.PORT || randomIntInclusive(3_100, 8_100))
    },
    build: {
      minify: 'oxc',
      target: 'esnext',
      emptyOutDir: true,
      rolldownOptions: {
        output: {
          cleanDir: true,
          minify: {
            compress:
              config.mode === 'production' ? { dropConsole: true, dropDebugger: true } : undefined
          }
        }
      }
    }
  }
})

function randomIntInclusive(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}
