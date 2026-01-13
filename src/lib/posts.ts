import type { MDXModule } from '#components/mdx.tsx'

type EagerPosts = Record<string, MDXModule>
type LazyPosts = Record<string, () => Promise<MDXModule>>

export function fetchAllPosts(options: { eager: true }): EagerPosts
export function fetchAllPosts(options?: { eager: false }): LazyPosts
export function fetchAllPosts(
  options: { eager: boolean } = { eager: false }
): EagerPosts | LazyPosts {
  return options.eager
    ? import.meta.glob<MDXModule>(['../posts/**/*.mdx', '../posts/*/index.mdx'], { eager: true })
    : import.meta.glob<MDXModule>(['../posts/**/*.mdx', '../posts/*/index.mdx'], { eager: false })
}
