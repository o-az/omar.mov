import {
  createStartHandler,
  defaultStreamHandler,
  defineHandlerCallback
} from '@tanstack/solid-start/server'
import { env } from 'cloudflare:workers'
import { routePartykitRequest } from 'partyserver'
import { createServerEntry } from '@tanstack/solid-start/server-entry'

export { AgentDO } from '#lib/agent/durable-object.ts'
export { LiveViewersDO } from '#lib/live-viewers/durable-object.ts'

const entryHandler = defineHandlerCallback(context => defaultStreamHandler(context))

const startFetch = createStartHandler(entryHandler)

export default createServerEntry({
  fetch: async (request, options) => {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/parties/')) return startFetch(request, options)

    const response = await routePartykitRequest(request, env)
    if (!response) return startFetch(request, options)

    return response
  }
})

declare module '@tanstack/solid-start' {
  interface Register {
    server: {
      requestContext?: {
        nonce: string
        executionContext: ExecutionContext
      }
    }
  }
}
