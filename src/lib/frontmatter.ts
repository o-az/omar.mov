import * as z from 'zod/mini'

/**
 * helpful @link:
 * https://zod.fyi
 */

export namespace Frontmatter {
  export const FrontmatterSchema = z.object({
    title: z.string({ error: 'Title is required' }).check(z.minLength(1)),
    date: z.string({ error: 'Date is required' }),
    slug: z.string({ error: 'Slug is required' }),
    image: z.optional(
      z.object({
        url: z.string(),
        alt: z.string()
      })
    ),
    draft: z.prefault(z.boolean(), true),
    description: z.string({ error: 'Description is required' }),
    tags: z.optional(z.array(z.string()))
  })

  export type Frontmatter = z.infer<typeof FrontmatterSchema>

  export function validate(frontmatter: Frontmatter) {
    const result = FrontmatterSchema.safeParse(frontmatter)
    if (!result.success) throw new Error(z.prettifyError(result.error))

    return result.data
  }
}
