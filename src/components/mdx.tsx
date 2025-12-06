import type { JSX } from 'solid-js/jsx-runtime'
import { MDXProvider as SolidMDXProvider } from 'solid-jsx'

import { cx } from '#lib/style.ts'

export function MDXProvider({ children }: { children: JSX.Element }) {
  return (
    <SolidMDXProvider
      components={{
        h1: (props: JSX.HTMLAttributes<HTMLHeadingElement>) => (
          <h1
            {...props}
            class={cx('text-2xl! font-bold', props.class)}
          />
        ),
        Log: (data: any) => <pre>{JSON.stringify(data, null, 2)}</pre>
      }}>
      <article
        class={cx(
          'max-w-[680px] mx-auto prose dark:prose-invert',
          'prose-img:rounded-xl prose-img:my-3 prose-img:py-4 prose-img:mb-6'
        )}>
        {children}
      </article>
    </SolidMDXProvider>
  )
}
