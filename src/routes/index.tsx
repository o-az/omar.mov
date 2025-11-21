import { For, onMount } from 'solid-js'
import { PowerGlitch } from 'powerglitch'
import { createFileRoute } from '@tanstack/solid-router'

export const Route = createFileRoute('/')({
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
    url: 'https://x.com/awkroot'
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
    PowerGlitch.glitch('.glitch', {playMode: 'hover'})
  })

  return (
    <main class='size-full'>
      <h1 class='text-3xl font-bold'>omar aziz</h1>
      <p class='text-lg'>
        software engineer @{' '}
        <a
          target='_blank'
          href='https://tempo.xyz'
          rel='noopener noreferrer'
          class='text-blue-300 glitch'>
          tempo.xyz
        </a>
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
                  rel='noopener noreferrer'
                  class='text-blue-300'>
                  {social.label}
                </a>
              </li>
            )}
          </For>
          <li>
            <button
              type='button'
              class='[anchor-name:--email-anchor]'
              data-button='email'
              popovertarget='email-popover'
              popovertargetaction='toggle'>
              gm@omar.mov
            </button>
            <div
              popover='auto'
              id='email-popover'
              aria-live='polite'
              class='fixed opacity-0 left-[anchor(center)] top-[anchor(bottom)] translate-x-[-50%] translate-y-[0.4rem] bg-fuchsia-300 px-1 py-0.5 text-sm text-[#0f0f0f] shadow-[0_10px_30px_rgb(0_0_0/0.35)] [position-anchor:--email-anchor] origin-[top_center] animate-none [:popover-open]:animate-[copy-pop_2s_forwards]'
              >
              copied
            </div>
          </li>
        </ul>
      </nav>
    </main>
  )
}
