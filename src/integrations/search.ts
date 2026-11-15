import { fileURLToPath } from 'node:url'
import type { AstroIntegration } from 'astro'
import * as pagefind from 'pagefind'

/** Generate search assets from the final HTML, after all routes have been built. */
export default function searchIndex(enabled = true): AstroIntegration {
  return {
    name: 'site-search-index',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        if (!enabled) return
        const { index, errors } = await pagefind.createIndex()
        if (!index || errors.length)
          throw new Error(`Cannot create search index: ${errors.join(', ')}`)
        try {
          const added = await index.addDirectory({ path: fileURLToPath(dir) })
          if (added.errors.length) throw new Error(added.errors.join(', '))
          const written = await index.writeFiles({
            outputPath: fileURLToPath(new URL('pagefind/', dir))
          })
          if (written.errors.length) throw new Error(written.errors.join(', '))
          logger.info(`Indexed ${added.page_count} pages`)
        } finally {
          await pagefind.close()
        }
      }
    }
  }
}
