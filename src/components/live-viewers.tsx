import * as z from 'zod/mini'
import type PartySocketType from 'partysocket'
import { usePageVisibility } from '@solid-primitives/page-visibility'
import { createConnectivitySignal } from '@solid-primitives/connectivity'
import { createEffect, createSignal, on, onCleanup, onMount, Show } from 'solid-js'

import { cx } from '#lib/style.ts'

export function LiveViewers() {
  const isVisible = usePageVisibility()
  const isOnline = createConnectivitySignal()

  const [mounted, setMounted] = createSignal(false)
  const [socket, setSocket] = createSignal<PartySocketType | null>(null)
  const [viewerCount, setViewerCount] = createSignal<number | null>(null)

  onMount(async () => {
    setMounted(true)
    const { PartySocket } = await import('partysocket')

    const partySocket = new PartySocket({
      room: 'global',
      party: 'live-viewers-do',
      host: window.location.host
    })

    function listener(event: MessageEvent) {
      const result = z.safeParse(
        z.object({ type: z.string(), count: z.number() }),
        JSON.parse(event.data)
      )
      if (!result.success) return
      if (result.data.type === 'viewer-count') setViewerCount(result.data.count)
    }

    partySocket.addEventListener('message', listener)

    setSocket(partySocket)
    onCleanup(() => {
      partySocket.close()
      partySocket.removeEventListener('message', listener)
    })
  })

  createEffect(
    on(
      [isOnline, isVisible],
      ([online, visible]) => {
        const currentSocket = socket()
        if (!currentSocket) return

        if (online && visible) currentSocket.reconnect()
        else {
          currentSocket.close()
          setViewerCount(null)
        }
      },
      { defer: true }
    )
  )

  const showLive = () => mounted() && isOnline()

  return (
    <Show when={mounted()}>
      <div
        title={`${Number(viewerCount() ?? 0) > 1 ? `${viewerCount()} users` : `${viewerCount()} user`} currently on this page`}
        class='max-w-min flex items-center justify-end gap-1 text-xs text-white opacity-55 hover:opacity-100 py-py'>
        <p class='relative flex size-1.5 shrink-0'>
          <span
            class={cx('absolute inline-flex size-full rounded-full', {
              'bg-transparent': !showLive(),
              'animate-ping bg-emerald-300 animation-duration-[1.75s]': showLive()
            })}
          />
          <span
            class={cx('relative inline-flex size-1.5 rounded-full', {
              'bg-emerald-400': showLive(),
              'bg-neutral-400': !showLive()
            })}
          />
        </p>
        <span class='min-w-[3ch] tabular-nums text-[9px]'>{viewerCount() ?? '0'}</span>
      </div>
    </Show>
  )
}
