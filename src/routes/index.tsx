import { For, onMount } from 'solid-js'
import { PowerGlitch } from 'powerglitch'
import { createFileRoute, Link } from '@tanstack/solid-router'

import { LiveViewers } from '#components/live-viewers.tsx'

export const Route = createFileRoute('/')({
  ssr: true,
  component: RouteComponent
})

const socials = [
  {
    id: 'github',
    label: 'GitHub',
    url: 'https://github.com/o-az'
  },
  {
    id: 'x',
    label: '𝕏',
    url: 'https://x.com/amorfati'
  },
  {
    id: 'bsky',
    label: 'Bsky',
    url: 'https://bsky.app/profile/omar.mov'
  }
] satisfies ReadonlyArray<{
  id: string
  url: string
  label: string
}>

function RouteComponent() {
  onMount(() => {
    PowerGlitch.glitch('.glitch', { playMode: 'hover' })
  })

  return (
    <main class='size-full font-display'>
      <Link
        to='/posts'
        class='text-transparent hover:text-yellow-300 absolute top-0 right-0 p-2 opacity-5 hover:opacity-100'>
        posts
      </Link>
      <header class='flex items-center justify-between'>
        <h1 class='text-3xl font-bold leading-tight'>omar aziz</h1>
      </header>
      <p class='text-lg leading-normal'>
        software engineer @{' '}
        <span class='inline-grid'>
          <a
            target='_blank'
            href='https://tempo.xyz'
            rel='noopener noreferrer'
            class='text-blue-300 glitch [grid-area:1/1/-1/-1]'>
            tempo.xyz
          </a>
        </span>
      </p>
      <nav class='mt-3 text-lg'>
        <p class='mb-1 font-semibold'>socials</p>
        <ul class='flex list-disc flex-col gap-0.5 pl-3 lowercase'>
          <For each={socials}>
            {social => (
              <li>
                <a
                  target='_blank'
                  href={social.url}
                  class='text-blue-300'
                  rel='noopener noreferrer'>
                  {social.label}
                </a>
              </li>
            )}
          </For>
          <li>
            <button
              type='button'
              data-button='email'
              popovertargetaction='toggle'
              popovertarget='email-popover'
              class='[anchor-name:--email-anchor]'
              onClick={() => navigator.clipboard.writeText('gm@omar.mov')}>
              gm@omar.mov
            </button>
            <div
              popover='auto'
              id='email-popover'
              aria-live='polite'
              class='fixed opacity-0 left-[anchor(center)] top-[anchor(bottom)] translate-x-[-50%] translate-y-[0.4rem] bg-fuchsia-300 px-1 py-0.5 text-sm text-[#0f0f0f] shadow-[0_10px_30px_rgb(0_0_0/0.35)] [position-anchor:--email-anchor] origin-[top_center] animate-none [:popover-open]:animate-[copy-pop_2s_forwards]'>
              copied
            </div>
          </li>
        </ul>
      </nav>
      <footer class='py-2 absolute bottom-0 left-0 flex justify-end w-full max-w-[99%]'>
        <LiveViewers />
      </footer>
    </main>
  )
}
