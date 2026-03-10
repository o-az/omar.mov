import * as z from 'zod/mini'
import NodePath from 'node:path'
import NodeProcess from 'node:process'
import VitePluginInfo from 'unplugin-info/vite'
import nodePolyfills from '@rolldown/plugin-node-polyfills'
import { default as VitePluginSolid } from 'vite-plugin-solid'
import VitePluginDevtoolsJson from 'vite-plugin-devtools-json'
import { defineConfig, loadEnv, type PluginOption } from 'vite'
import { default as VitePluginInspect } from 'vite-plugin-inspect'
import { default as VitePluginTailwindCSS } from '@tailwindcss/vite'
import { cloudflare as VitePluginCloudflare } from '@cloudflare/vite-plugin'
import { devtools as VitePluginTanstackDevtools } from '@tanstack/devtools-vite'
import { default as VitePluginContentCollection } from '@content-collections/vite'
import { default as VitePluginCloudflareTunnel } from 'unplugin-cloudflare-tunnel/vite'
import { tanstackStart as VitePluginTanstackStart } from '@tanstack/solid-start/plugin/vite'

import { esmExternalRequirePlugin } from 'rolldown/plugins'

const enabledSchema = z.stringbool({
  truthy: ['true', '1', 'yes', 'on', 'y', 'enabled'],
  falsy: ['false', '0', 'no', 'off', 'n', 'disabled']
})

const devFlagsSchema = z.object({
  VITE_ENABLE_INSPECT: z.prefault(enabledSchema, 'false'),
  VITE_ENABLE_CLOUDFLARE_TUNNEL: z.prefault(enabledSchema, 'false')
})

export default defineConfig(config => {
  const env = loadEnv(config.mode, NodeProcess.cwd(), '')

  const { data: devFlags, success, error } = devFlagsSchema.safeParse(env)
  if (!success) throw new Error(`Invalid dev flags - ${z.prettifyError(error)}`)

  const plugins: Array<PluginOption> = [
    VitePluginCloudflare({
      viteEnvironment: { name: 'ssr' },
      remoteBindings: false
    }),
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
    VitePluginContentCollection({
      configPath: NodePath.resolve(import.meta.dirname, 'src/lib/content-collections.ts')
    }),
    VitePluginTailwindCSS(),
    VitePluginTanstackStart({
      start: { entry: './src/start.ts' },
      server: { entry: './src/server.ts' },
      client: { entry: './src/client.ts' }
    }),
    VitePluginSolid({ ssr: true })
  ]

  if (devFlags.VITE_ENABLE_CLOUDFLARE_TUNNEL)
    plugins.push(
      VitePluginCloudflareTunnel({
        enabled: true,
        ssl: '*.sauce.wiki',
        tunnelName: 'omar-mov',
        hostname: 'dev.sauce.wiki',
        apiToken: env.CLOUDFLARE_API_KEY,
        accountId: env.CLOUDFLARE_ACCOUNT_ID,
        logFile: `./logs/${Date.now()}-cloudflare-tunnel.log`
      })
    )

  if (devFlags.VITE_ENABLE_INSPECT) plugins.push(VitePluginInspect())

  const allowedHosts = config.mode === 'development' ? (env?.ALLOWED_HOSTS?.split(',') ?? []) : []
  return {
    optimizeDeps: {
      exclude: ['bash-tool', 'just-bash']
    },
    resolve: {
      alias: {
        '#': NodePath.resolve(import.meta.dirname, 'src')
      }
    },
    server: {
      allowedHosts,
      port: Number(env.PORT || randomIntInclusive(3_100, 8_100))
    },
    build: {
      target: 'esnext',
      emptyOutDir: true,
      rolldownOptions: {
        shimMissingExports: true,
        plugins: [
          nodePolyfills(),
          esmExternalRequirePlugin({
            external: ['os', 'fs', 'path', 'util', 'stream', 'events', 'process']
          })
        ],
        experimental: {
          nativeMagicString: true
        }
      }
    },
    plugins
  }
})

function randomIntInclusive(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}
