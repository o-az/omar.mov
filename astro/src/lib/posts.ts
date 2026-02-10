export function getPostSlug(entryId: string) {
  return entryId.replace(/\/index$/, '').replace(/\.mdx?$/, '')
}
