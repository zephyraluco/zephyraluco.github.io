import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    lang: { type: 'string', short: 'l' },
    draft: { type: 'boolean', short: 'd' },
    folder: { type: 'boolean', short: 'f' },
    help: { type: 'boolean', short: 'h' }
  }
})
if (values.help) {
  console.log('Usage: bun run new:post [--draft] [--folder] [--lang zh] "Post title"')
} else {
  const title = positionals.join(' ').trim() || 'Untitled'
  const slug =
    title
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-|-$/g, '') || 'untitled'
  const directory = join('src/content/blog', values.folder ? slug : '')
  const filename = `${values.folder ? 'index' : slug}.md`
  const fields = {
    title,
    description: 'Write your description here.',
    publishDate: new Date().toISOString(),
    tags: ['Example', 'Technology'],
    ...(values.draft ? { draft: true } : {}),
    ...(values.lang ? { language: values.lang } : {})
  }
  const frontmatter = Object.entries(fields)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n')
  await mkdir(directory, { recursive: true })
  // Exclusive creation protects existing posts, including concurrent invocations.
  await writeFile(
    join(directory, filename),
    `---\n${frontmatter}\n---\n\nWrite your content here.\n`,
    { flag: 'wx' }
  )
  console.log(`Created ${join(directory, filename)}`)
}
