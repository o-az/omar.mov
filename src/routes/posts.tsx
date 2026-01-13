import { createFileRoute, Outlet } from '@tanstack/solid-router'

import markdownCss from '#style/markdown.css?url'

export const Route = createFileRoute('/posts')({
  component: Outlet,
  head: () => ({
    links: [
      { rel: 'stylesheet', href: markdownCss },
      { rel: 'stylesheet', href: 'https://esm.sh/katex/dist/katex.min.css' }
    ]
  })
})
