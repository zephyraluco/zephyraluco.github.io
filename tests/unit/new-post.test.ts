import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, expect, test } from 'bun:test'

const script = fileURLToPath(new URL('../../scripts/new-post.mjs', import.meta.url))
const directories: string[] = []
afterEach(async () => {
  await Promise.all(directories.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

test('creates a valid MDX draft with language and protects existing content', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'new-post-'))
  directories.push(cwd)
  const args = [script, '--draft', '--mdx', '--folder', '--lang', 'zh', 'Hello: "World"']
  expect(spawnSync('node', args, { cwd }).status).toBe(0)
  const file = join(cwd, 'src/content/blog/hello-world/index.mdx')
  const content = await readFile(file, 'utf8')
  expect(content).toContain('draft: true')
  expect(content).toContain('language: "zh"')
  expect(content).toContain(`title: ${JSON.stringify('Hello: "World"')}`)
  expect(spawnSync('node', args, { cwd }).status).not.toBe(0)
  expect(await readFile(file, 'utf8')).toBe(content)
})
