/// <reference types="vite/client" />

import * as Solid from 'solid-js'
import { HydrationScript } from 'solid-js/web'
import { Outlet, Scripts, HeadContent, createRootRoute } from '@tanstack/solid-router'

import appCss from '#style/index.css?url'
import { LiveViewers } from '#components/live-viewers.tsx'
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
      {
        rel: 'preload',
        href: '/fonts/Lilex.woff2',
        as: 'font',
        type: 'font/woff2',
        crossorigin: ''
      },
      {
        rel: 'preload',
        href: '/fonts/Lilex-Italic.woff2',
        as: 'font',
        type: 'font/woff2',
        crossorigin: ''
      },
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'icon',
        href: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌩️</text></svg>'
      }
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'omar.mov',
          url: 'https://omar.mov',
          publisher: {
            '@type': 'Organization',
            name: 'omar.mov',
            url: 'https://omar.mov',
            logo: 'https://omar.mov/logo.png',
            sameAs: ['https://twitter.com/omaraz', 'https://github.com/o-az']
          }
        })
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
      class='min-h-screen'>
      <head>
        <HeadContent />
        <HydrationScript />
        <style
          innerHTML={`
          .fonts-loading { opacity: 0; }
          .fonts-loaded { opacity: 1; transition: opacity 0.1s; }
        `}
        />
        <script
          innerHTML={`
          document.documentElement.classList.add('fonts-loading');
          document.fonts.ready.then(() => {
            document.documentElement.classList.remove('fonts-loading');
            document.documentElement.classList.add('fonts-loaded');
          });
        `}
        />
      </head>
      <body class='size-full bg-[#121212] p-4 text-white selection:bg-fuchsia-300 selection:text-black flex min-h-screen flex-col'>
        {children}
        <DevTools />
        <Scripts />
        <footer class='py-2 absolute bottom-0 left-0 flex justify-end w-full max-w-[99%] cursor-image'>
          <LiveViewers />
        </footer>
      </body>
    </html>
  )
}
