import {
  createStartHandler,
  defaultStreamHandler,
  defineHandlerCallback
} from '@tanstack/solid-start/server'
import { createServerEntry } from '@tanstack/solid-start/server-entry'

const entryHandler = defineHandlerCallback(context => defaultStreamHandler(context))

const fetch = createStartHandler(entryHandler)

export default createServerEntry({ fetch })

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
