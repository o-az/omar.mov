import { createEffect, onCleanup, onMount } from 'solid-js'

type UtterancesIssueTerm = 'pathname' | 'url' | 'title' | 'og:title'

export function Comments(props: {
  repo: string
  theme?: string
  label?: string
  reloadKey?: string
  issueNumber?: number
  issueTerm?: UtterancesIssueTerm
}) {
  let container: HTMLDivElement | undefined

  onMount(() => {
    createEffect(() => {
      props.reloadKey

      if (!container) return

      container.replaceChildren()

      const script = document.createElement('script')
      Object.assign(script, {
        async: true,
        crossorigin: 'anonymous',
        src: 'https://utteranc.es/client.js'
      })

      script.setAttribute('repo', props.repo)
      script.setAttribute('theme', props.theme ?? 'preferred-color-scheme')

      if (props.issueNumber) script.setAttribute('issue-number', props.issueNumber.toString())
      else script.setAttribute('issue-term', props.issueTerm ?? 'pathname')

      if (props.label) script.setAttribute('label', props.label)

      container.appendChild(script)
    })
  })

  onCleanup(() => {
    container?.replaceChildren()
  })

  return (
    <div class='relative'>
      <div ref={element => (container = element)} />
      <div class='pointer-events-none absolute -top-px left-0 right-0 z-10 h-10 bg-[#121212]' />
    </div>
  )
}

export function CommentsSection(props: { slug: string }) {
  const repo = import.meta.env.PUBLIC_UTTERANCES_REPO
  const label = import.meta.env.PUBLIC_UTTERANCES_LABEL
  const theme = import.meta.env.PUBLIC_UTTERANCES_THEME

  if (!repo) {
    return import.meta.env.DEV ? (
      <section class='max-w-170 mx-auto mt-4 pt-2 border-t border-slate-200/70 dark:border-slate-800 text-sm text-slate-500'>
        Set <code class='font-mono'>PUBLIC_UTTERANCES_REPO</code> to enable comments.
      </section>
    ) : null
  }

  return (
    <section class='max-w-170 mx-auto mt-4 pt-2 border-t border-slate-200/70 dark:border-slate-800'>
      <Comments
        repo={repo}
        label={label}
        theme={theme}
        reloadKey={props.slug}
      />
    </section>
  )
}
