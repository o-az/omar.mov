import type { JSX } from 'solid-js/jsx-runtime'

import { cx } from '#lib/style.ts'
import type { Frontmatter } from '#lib/frontmatter.ts'
import { MDXProvider as SolidMDXProvider } from '#lib/solid-jsx/jsx-runtime.ts'

export type MDXModule = {
  default: () => unknown
  frontmatter: Frontmatter.Frontmatter
}

export function MDXProvider(props: { children: JSX.Element }) {
  return (
    <SolidMDXProvider
      components={{
        h1: (props: JSX.HTMLAttributes<HTMLHeadingElement>) => (
          <h1
            {...props}
            class={cx('text-2xl! text-red-400 font-bold', props.class)}
          />
        ),
        Log: (data: Record<string, unknown>) => <pre>{JSON.stringify(data, null, 2)}</pre>
      }}>
      <article
        class={cx(
          'max-w-[680px] mx-auto prose dark:prose-invert',
          'prose-img:rounded-xl prose-img:my-3 prose-img:py-4 prose-img:mb-6'
        )}>
        {props.children}
      </article>
    </SolidMDXProvider>
  )
}
