export function fetchAllPosts<T>(options: { eager: boolean } = { eager: false }) {
  return options.eager
    ? import.meta.glob<T>(['../posts/**/*.mdx', '../posts/*/index.mdx'], { eager: true })
    : import.meta.glob<T>(['../posts/**/*.mdx', '../posts/*/index.mdx'], { eager: false })
}
