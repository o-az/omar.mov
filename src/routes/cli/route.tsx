import { Bash, defineCommand } from 'just-bash'
import { createFileRoute } from '@tanstack/solid-router'
import { For, Show, createEffect, createSignal, onMount } from 'solid-js'

export const Route = createFileRoute('/cli')({
  component: RouteComponent
})

type CurlParseResult =
  | {
      ok: true
      value: {
        url: string
        method: string
        headers: Record<string, string>
        body?: string
        includeHeaders: boolean
        followRedirects: boolean
      }
    }
  | {
      ok: false
      error: string
    }

const parseCurlArgs = (args: string[]): CurlParseResult => {
  const headers: Record<string, string> = {}
  let method: string | undefined
  let body: string | undefined
  let includeHeaders = false
  let followRedirects = false
  let url: string | undefined

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (!arg) continue

    if (arg === '-X' || arg === '--request') {
      const next = args[index + 1]
      if (!next) return { ok: false, error: 'curl: option requires an argument -- X' }
      method = next.toUpperCase()
      index += 1
      continue
    }

    if (arg === '-H' || arg === '--header') {
      const next = args[index + 1]
      if (!next) return { ok: false, error: 'curl: option requires an argument -- H' }
      const separatorIndex = next.indexOf(':')
      if (separatorIndex === -1) {
        return { ok: false, error: 'curl: header must be in "Key: Value" format' }
      }
      const key = next.slice(0, separatorIndex).trim().toLowerCase()
      const value = next.slice(separatorIndex + 1).trim()
      if (!key) return { ok: false, error: 'curl: header key cannot be empty' }
      headers[key] = value
      index += 1
      continue
    }

    if (arg === '-d' || arg === '--data' || arg === '--data-raw' || arg === '--data-binary') {
      const next = args[index + 1]
      if (!next) return { ok: false, error: 'curl: option requires an argument -- d' }
      body = next
      index += 1
      continue
    }

    if (arg === '-I' || arg === '--head') {
      method = 'HEAD'
      includeHeaders = true
      continue
    }

    if (arg === '-i' || arg === '--include') {
      includeHeaders = true
      continue
    }

    if (arg === '-L' || arg === '--location') {
      followRedirects = true
      continue
    }

    if (arg === '-s' || arg === '--silent' || arg === '--compressed') continue

    if (arg.startsWith('-')) {
      return { ok: false, error: `curl: unsupported option ${arg}` }
    }

    if (!url) {
      url = arg
    }
  }

  if (!url) return { ok: false, error: 'curl: no URL specified' }

  const resolvedMethod = method ?? (body ? 'POST' : 'GET')

  return {
    ok: true,
    value: {
      url,
      method: resolvedMethod,
      headers,
      body,
      includeHeaders,
      followRedirects
    }
  }
}

const formatHeaderBlock = (status: number, statusText: string, headers: Record<string, string>) => {
  const lines = [`HTTP/1.1 ${status} ${statusText}`]
  for (const [key, value] of Object.entries(headers)) {
    lines.push(`${key}: ${value}`)
  }
  return `${lines.join('\n')}\n\n`
}

function RouteComponent() {
  const [history, setHistory] = createSignal<
    Array<{
      id: number
      command: string
      stdout: string
      stderr: string
      exitCode: number
      durationMs: number
    }>
  >([])
  const [input, setInput] = createSignal('')
  const [isRunning, setIsRunning] = createSignal(false)
  const [networkEnabled, setNetworkEnabled] = createSignal(false)

  let shell: Bash | undefined
  let outputRef: HTMLDivElement | undefined
  let inputRef: HTMLInputElement | undefined

  const isClearCommand = (cmd: string) => cmd === 'clear' || cmd === '/clear' || cmd === 'cls'

  const createShell = (withNetwork: boolean) => {
    const customCommands = [
      defineCommand('clear', async () => ({ stdout: '', stderr: '', exitCode: 0 })),
      defineCommand('cls', async () => ({ stdout: '', stderr: '', exitCode: 0 })),
      defineCommand('/clear', async () => ({ stdout: '', stderr: '', exitCode: 0 }))
    ]

    if (withNetwork) {
      customCommands.push(
        defineCommand('curl', async (args, ctx) => {
          const parsed = parseCurlArgs(args)
          if (!parsed.ok) {
            return { stdout: '', stderr: `${parsed.error}\n`, exitCode: 2 }
          }

          let { body } = parsed.value
          const headers = { ...parsed.value.headers }

          if (body?.startsWith('@')) {
            const filePath = body.slice(1)
            try {
              const resolved = ctx.fs.resolvePath(ctx.cwd, filePath)
              body = await ctx.fs.readFile(resolved)
            } catch (error) {
              return {
                stdout: '',
                stderr: `curl: ${filePath}: No such file or directory\n`,
                exitCode: 1
              }
            }
          }

          if (body && !headers['content-type']) {
            headers['content-type'] = 'application/x-www-form-urlencoded'
          }

          try {
            const response = await fetch('/api/cli-proxy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: parsed.value.url,
                method: parsed.value.method,
                headers,
                body,
                followRedirects: parsed.value.followRedirects
              })
            })

            const data = (await response.json()) as {
              ok: boolean
              status: number
              statusText: string
              headers: Record<string, string>
              body: string
              url: string
              error?: string
            }

            if (!response.ok || !data.ok) {
              const message = data?.error ?? 'Proxy request failed'
              return { stdout: '', stderr: `curl: ${message}\n`, exitCode: 1 }
            }

            const headerBlock = parsed.value.includeHeaders
              ? formatHeaderBlock(data.status, data.statusText, data.headers)
              : ''
            const bodyOutput = parsed.value.method === 'HEAD' ? '' : (data.body ?? '')

            return { stdout: `${headerBlock}${bodyOutput}`, stderr: '', exitCode: 0 }
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            return { stdout: '', stderr: `curl: ${message}\n`, exitCode: 1 }
          }
        })
      )
    }

    return new Bash({
      customCommands,
      files: {
        '/home/user/README.txt': [
          'Welcome to the in-memory shell.',
          'Nothing touches your real disk.',
          'Try commands like:',
          '- ls',
          '- cat README.txt',
          '- echo "hi" > notes.txt && cat notes.txt',
          '',
          'Enable network to allow curl.'
        ].join('\n')
      }
    })
  }

  onMount(() => {
    shell = createShell(networkEnabled())
    queueMicrotask(() => inputRef?.focus())
  })

  createEffect(() => {
    history()
    if (typeof window === 'undefined') return
    requestAnimationFrame(() => {
      if (!outputRef) return
      outputRef.scrollTo({ top: outputRef.scrollHeight, behavior: 'smooth' })
    })
  })

  const toggleNetwork = () => {
    const next = !networkEnabled()
    setNetworkEnabled(next)
    shell = createShell(next)
    setHistory([])
    queueMicrotask(() => inputRef?.focus())
  }

  const handleSubmit = async (event: Event) => {
    event.preventDefault()
    const command = input().trim()
    if (!command) return

    if (!shell) return

    setIsRunning(true)
    const started = performance.now()
    try {
      const result = await shell.exec(command)
      const durationMs = Math.round(performance.now() - started)
      if (isClearCommand(command)) {
        setHistory([])
      } else {
        setHistory(list => [
          ...list,
          {
            id: list.length + 1,
            command,
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
            durationMs
          }
        ])
      }
    } catch (error) {
      const durationMs = Math.round(performance.now() - started)
      const message = error instanceof Error ? error.message : String(error)
      setHistory(list => [
        ...list,
        {
          id: list.length + 1,
          command,
          stdout: '',
          stderr: `${message}\n`,
          exitCode: 1,
          durationMs
        }
      ])
    } finally {
      setIsRunning(false)
      setInput('')
      queueMicrotask(() => inputRef?.focus())
    }
  }

  return (
    <main class='mx-auto flex max-w-5xl flex-col gap-4 font-[Lilex] px-4 min-h-[70vh] max-h-screen max-[650px]:max-w-none max-[650px]:w-auto max-[650px]:min-h-[calc(100svh-2.25rem)] max-[650px]:-mx-6 max-[650px]:gap-2.5 max-[650px]:px-0 max-[650px]:pb-1'>
      <header class='flex flex-wrap items-baseline justify-between gap-2 max-[650px]:px-3'>
        <div>
          <p class='text-2xl font-bold'>sandboxed shell</p>
          <p class='text-sm text-neutral-400'>
            backed by{' '}
            <a
              class='text-blue-300 underline'
              href='https://github.com/vercel-labs/just-bash'
              target='_blank'
              rel='noreferrer'>
              just-bash
            </a>
            . files live only in memory.
          </p>
        </div>
        <div class='flex flex-wrap gap-2 text-xs text-neutral-400'>
          <span class='rounded border border-white/10 bg-white/5 px-2 py-1'>try: ls</span>
          <span class='rounded border border-white/10 bg-white/5 px-2 py-1'>cat README.txt</span>
          <span class='rounded border border-white/10 bg-white/5 px-2 py-1'>
            echo "hi" &gt; notes.txt
          </span>
        </div>
      </header>

      <section class='flex flex-1 flex-col rounded-2xl border border-white/10 bg-linear-to-br from-[#1a1a1d] to-[#0f1012] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)] min-h-[65vh] max-h-[calc(100vh-6rem)] max-[650px]:flex-1 max-[650px]:rounded-none max-[650px]:border-0 max-[650px]:p-0 max-[650px]:shadow-none max-[650px]:pb-1'>
        <div class='flex flex-wrap items-center justify-end gap-2 text-xs text-neutral-400 max-[650px]:px-3'>
          <div class='flex items-center mt-2 gap-3'>
            <button
              type='button'
              class='rounded border border-white/10 px-2 py-1 text-[11px] uppercase tracking-wide text-neutral-300 transition hover:border-fuchsia-300 hover:text-fuchsia-300 disabled:opacity-60'
              onClick={toggleNetwork}
              disabled={isRunning()}>
              {networkEnabled() ? 'disable network' : 'enable network'}
            </button>
            <span class='text-[10px] uppercase tracking-wide text-neutral-500'>bash-ish</span>
            <span class='text-[10px] text-neutral-500'>toggle resets shell</span>
          </div>
        </div>

        <div
          ref={outputRef}
          class='mt-3 h-auto flex-1 min-h-[40vh] max-h-[calc(100vh-14rem)] overflow-y-auto rounded-lg border border-white/5 bg-black/40 p-3 font-mono text-sm leading-relaxed shadow-inner max-[650px]:h-auto max-[650px]:min-h-[50vh] max-[650px]:max-h-[calc(100svh-10.5rem)] max-[650px]:flex-1 max-[650px]:rounded-none max-[650px]:border-0 max-[650px]:bg-transparent max-[650px]:shadow-none max-[650px]:px-0'>
          <Show when={history().length === 0}>
            <p class='text-neutral-500'>Ready when you are. Hit enter after typing a command.</p>
          </Show>

          <For each={history()}>
            {entry => (
              <div class='mb-3'>
                <div class='flex items-center gap-2 text-green-300'>
                  <span>$</span>
                  <span class='text-white'>{entry.command}</span>
                </div>
                <Show when={entry.stdout}>
                  <pre class='mt-1 whitespace-pre-wrap wrap-break-word text-slate-100'>
                    {entry.stdout}
                  </pre>
                </Show>
                <Show when={entry.stderr}>
                  <pre class='mt-1 whitespace-pre-wrap wrap-break-word text-red-400'>
                    {entry.stderr}
                  </pre>
                </Show>
                <p class='mt-1 text-[11px] text-neutral-500'>
                  exit {entry.exitCode} · {entry.durationMs}ms
                </p>
              </div>
            )}
          </For>
        </div>

        <form
          class='mt-4 flex items-center gap-2 font-mono text-sm max-[650px]:px-3 max-[650px]:pb-1'
          onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            value={input()}
            onInput={event => setInput(event.currentTarget.value)}
            placeholder='type a command and hit enter'
            class='w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white outline-none transition focus:border-fuchsia-300 focus:ring-1 focus:ring-fuchsia-300 disabled:opacity-60'
            disabled={isRunning()}
            autocomplete='off'
            autocapitalize='off'
            spellcheck={false}
          />
          <button
            type='submit'
            class='border border-white/10 bg-fuchsia-500 px-3 py-2 text-sm font-semibold text-black transition hover:-translate-y-px hover:shadow-[0_10px_30px_rgba(236,72,153,0.35)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60'
            disabled={isRunning()}>
            {isRunning() ? 'running…' : 'run'}
          </button>
        </form>
      </section>
    </main>
  )
}
