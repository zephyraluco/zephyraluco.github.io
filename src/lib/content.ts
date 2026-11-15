import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content'

export const prod = import.meta.env.PROD

/** Note: this function filters out draft posts based on the environment */
export async function getBlogCollection<T extends CollectionKey = 'blog'>(
  contentType: T = 'blog' as T
) {
  return await getCollection(contentType, ({ data }: CollectionEntry<typeof contentType>) => {
    // Not in production & draft is not false
    return prod ? !data.draft : true
  })
}

export {
  groupCollectionsByYear,
  sortMDByDate,
  getAllTags,
  getUniqueTags,
  getUniqueTagsWithCount
} from './content-helpers'
