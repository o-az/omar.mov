import { createFileRoute } from '@tanstack/solid-router'

const RAW_URL = 'https://raw.githubusercontent.com/o-az/omar.mov/main/src/content/posts'

export const Route = createFileRoute('/posts/{$slug}.md')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const response = await fetch(`${RAW_URL}/${params.slug}/index.mdx`)

        if (!response.ok) return new Response('Not found', { status: 404 })

        return new Response(response.body, {
          headers: { 'content-type': 'text/markdown; charset=utf-8' }
        })
      }
    }
  }
})
