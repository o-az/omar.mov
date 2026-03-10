import { createFileRoute } from '@tanstack/solid-router'

export const Route = createFileRoute('/api/ping')({
  server: {
    handlers: {
      ANY: () => new Response('pong')
    }
  }
})
