/// <reference types="vite/client" />

import * as Solid from 'solid-js'
import { HydrationScript } from 'solid-js/web'
import { Outlet, Scripts, HeadContent, createRootRoute } from '@tanstack/solid-router'

import appCss from '#style/index.css?url'
import { DevTools, useDevTools } from '#components/dev-tools.tsx'
import { DefaultCatchBoundary } from '#components/default-catch-boundary.tsx'

export const Route = createRootRoute({
  head: () => ({
    charset: 'utf-8',
    title: 'omar.mov',
    description: "how to reach me and see what I'm up to",
    keywords: 'o-az, amorfati, site, blog, dev',

    meta: [
      { charset: 'utf-8' },
      { name: 'description', content: 'me site' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1.0, interactive-widget=resizes-content'
      },
      { name: 'robots', content: 'index, follow' }
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'icon',
        href: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌩️</text></svg>'
      }
    ]
  }),
  component: AppShell,
  shellComponent: RootDocument,
  errorComponent: DefaultCatchBoundary,
  // TODO: better 404 page
  notFoundComponent: () => <section>404</section>
})

function AppShell() {
  useDevTools()
  return (
    <Solid.Suspense>
      <Outlet />
    </Solid.Suspense>
  )
}

function RootDocument({ children }: { children: Solid.JSX.Element }) {
  return (
    <html
      lang='en'
      class="h-full cursor-[url('/icons/cursor.png'),pointer]">
      <head>
        <HydrationScript />
      </head>
      <body class='size-full bg-[#121212] p-6 text-white selection:bg-fuchsia-300 selection:text-black flex min-h-screen flex-col'>
        <HeadContent />
        {children}
        <DevTools />
        <Scripts />
      </body>
    </html>
  )
}
