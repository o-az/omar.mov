import { createFileRoute } from '@tanstack/solid-router'

import { allPosts } from '#content-collections'

export const Route = createFileRoute('/posts/{$slug}.md')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const post = allPosts.find(item => item.slug === params.slug)

        if (!post) return new Response('Not found', { status: 404 })

        return new Response(post.content, {
          headers: { 'content-type': 'text/markdown; charset=utf-8' }
        })
      }
    }
  }
})
