import { App } from 'astro/app'
import { handle } from '@astrojs/cloudflare/handler'
import { routePartykitRequest } from 'partyserver'
import { LiveViewersDO } from './lib/live-viewers/durable-object.ts'

export { LiveViewersDO }

type AstroManifest = ConstructorParameters<typeof App>[0]

export function createExports(manifest: AstroManifest) {
  const app = new App(manifest)
  return {
    default: {
      async fetch(
        request: Request,
        env: Record<string, unknown>,
        context: ExecutionContext
      ): Promise<Response> {
        const url = new URL(request.url)

        if (url.pathname.startsWith('/parties/')) {
          const response = await routePartykitRequest(request, env as never)
          if (response) return response
        }

        return handle(manifest, app, request as never, env as never, context)
      }
    },
    LiveViewersDO
  }
}
