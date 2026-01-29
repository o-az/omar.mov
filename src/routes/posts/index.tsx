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
    <For each={allPosts.filter(item => !item.draft)}>
      {item => (
        <div class='py-2 cursor-pointer'>
          <Link
            preload='render'
            to={'/posts/$id'}
            params={{ id: item.slug }}>
            <span class='text-neutral-500 text-sm mr-2'>
              {new Date(item.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
            <span>{item.title}</span>
          </Link>
          <p class='text-neutral-400 text-sm mt-1'>{item.description}</p>
        </div>
      )}
    </For>
  )
}
