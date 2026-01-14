import '#style/markdown.css'

import { For } from 'solid-js'
import { createFileRoute, Link } from '@tanstack/solid-router'

import { allPosts } from '#content-collections'

export const Route = createFileRoute('/posts/')({
  ssr: true,
  component: RouteComponent,
  head: () => ({
    links: [{ rel: 'stylesheet', href: 'https://esm.sh/katex/dist/katex.min.css' }]
  })
})

function RouteComponent() {
  return (
    <For each={allPosts}>
      {item => (
        <div>
          <Link
            preload='render'
            to={'/posts/$id'}
            params={{ id: item.slug }}>
            {item.title}
          </Link>
        </div>
      )}
    </For>
  )
}
