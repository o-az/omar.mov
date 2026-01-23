import * as z from 'zod/mini'
import { ulid } from '@std/ulid'
import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/solid-router'
import { createMiddleware } from '@tanstack/solid-start'

const EXAMPLE_REQUEST = /* md */ `AI Agent with AgentFS on Cloudflare

POST /cmd - Execute bash commands directly
POST /chat - Send a message to the AI agent

Examples:
  curl --request POST <url>/cmd?key=<key> --header 'Content-Type: text/plain' --data-binary 'echo hello > test.txt && cat test.txt'
  curl --request POST <url>/chat?key=<key> --header 'Content-Type: application/json' --data-binary '{"message": "List all files"}'
`

const authMiddleware = createMiddleware().server(({ request, next }) => {
  const url = new URL(request.url)
  const keySearchParameter = url.searchParams.get('key') ?? request.headers.get('x-api-key')

  if (keySearchParameter !== env.AGENT_DO_KEY) return new Response('missing key', { status: 401 })

  return next()
})

export const Route = createFileRoute('/api/agent/$x')({
  server: {
    middleware: [authMiddleware],
    handlers: {
      ANY: async ({ request, params }) => {
        if (!env.AGENT_DO_KEY?.length) return Response.redirect('/')

        if (params.x === 'cmd' && request.method === 'POST') {
          const command = await request.text()
          if (!command.trim()) return Response.json({ error: 'Command required' }, { status: 400 })

          const stub = env.AGENT_DO.get(env.AGENT_DO.idFromName('default'))
          const result = await stub.exec(command)

          return Response.json(result, { headers: { 'X-Request-Id': ulid() } })
        }

        if (params.x !== 'chat' || request.method !== 'POST')
          return Response.json({ data: EXAMPLE_REQUEST })

        const response = await z.safeParseAsync(
          z.object({ message: z.string() }),
          await request.json()
        )
        if (!response.success)
          return Response.json({ error: z.prettifyError(response.error) }, { status: 400 })

        const stub = env.AGENT_DO.get(env.AGENT_DO.idFromName('default'))
        const stream = await stub.chat(response.data.message)

        return new Response(stream, {
          headers: {
            'X-Request-Id': ulid(),
            'Cache-Control': 'no-cache',
            'Content-Type': 'text/event-stream'
          }
        })
      }
    }
  }
})
