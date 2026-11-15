import type { CollectionEntry } from 'astro:content'
import { describe, expect, test } from 'bun:test'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

import config from '../../src/config'
import { UserConfigSchema } from '../../src/config/schema'
import { cn } from '../../src/lib/class-merge'
import {
  getUniqueTagsWithCount,
  groupCollectionsByYear,
  sortMDByDate
} from '../../src/lib/content-helpers'
import getReadingTime from '../../src/lib/reading-time'
import { overrideSvgAttributes } from '../../src/plugins/override-svg-attributes'
import rehypeExternalLinks from '../../src/plugins/rehype-external-links'
import { remarkAddZoomable, remarkReadingTime } from '../../src/plugins/remark-plugins'
import settings from '../../src/site.config'

describe('local site configuration', () => {
  test('normalizes favicon, metadata and feature defaults', () => {
    expect(config.favicon).toEqual({ href: '/favicon/favicon.png', type: 'image/png' })
    expect(config.header.menu?.map((item) => item.title)).toEqual([
      'Blog',
      'Notes',
      'Projects',
      'About'
    ])
    expect(config.integ.pagefind).toBe(true)
    expect(config.content.imageCaption).toBe(false)
    expect(config.integ.quote.target({ hitokoto: 'A test quote' })).toBe('A test quote')
  })

  test('rejects Pagefind without prerendered content', () => {
    expect(() => UserConfigSchema.parse({ ...settings, prerender: false })).toThrow('Pagefind')
  })
})

describe('content transformations', () => {
  test('marks Markdown images for the lightbox', async () => {
    const pipeline = unified().use(remarkParse).use(remarkAddZoomable, { className: 'zoomable' })
    const tree = await pipeline.run(pipeline.parse('![An image](/image.png)'))
    expect(JSON.stringify(tree)).toContain('zoomable')
  })

  test('generates reading metadata for Markdown and Chinese text', async () => {
    const pipeline = unified().use(remarkParse).use(remarkReadingTime)
    const file = { data: { astro: { frontmatter: {} as Record<string, unknown> } } }
    await pipeline.run(pipeline.parse('# Hello\n\nThis is a test article.'), file)
    expect(file.data.astro.frontmatter.minutesRead).toBeTruthy()
    expect(Number(file.data.astro.frontmatter.words)).toBeGreaterThan(0)
    expect(getReadingTime('中文阅读测试').words).toBeGreaterThan(0)
  })

  test('annotates external links without changing internal or mail links', () => {
    const links = ['/notes', 'https://example.com', 'mailto:hello@example.com'].map((href) => ({
      type: 'element' as const,
      tagName: 'a',
      properties: { href },
      children: []
    }))
    const tree = { type: 'root' as const, children: links }
    rehypeExternalLinks({ content: { type: 'text', value: ' ↗' } })(tree)
    expect(links[1].properties).toMatchObject({
      target: '_blank',
      rel: ['nofollow', 'noopener', 'noreferrer']
    })
    expect(links[1].children).toHaveLength(1)
    expect(links[0].properties).toEqual({ href: '/notes' })
    expect(links[2].properties).toEqual({ href: 'mailto:hello@example.com' })
  })

  test('merges SVG overrides and rejects non-SVG content', async () => {
    expect(
      await overrideSvgAttributes('<svg viewBox="0 0 24 24"></svg>', { 'aria-label': 'Test' })
    ).toContain('aria-label="Test"')
    await expect(overrideSvgAttributes('<div>Invalid</div>')).rejects.toThrow('begin with')
  })

  test('keeps conditional component classes and removes duplicates', () => {
    expect(cn('rounded p-2', ['p-2', false && 'hidden'], { active: true }).split(' ')).toEqual([
      'rounded',
      'p-2',
      'active'
    ])
  })
})

const post = (id: string, date: string, tags: string[]): CollectionEntry<'blog'> => ({
  id,
  collection: 'blog',
  data: {
    title: id,
    description: id,
    publishDate: new Date(date),
    tags,
    draft: false,
    comment: true
  }
})

test('content helpers preserve source order while sorting and grouping posts', () => {
  const posts = [
    post('older', '2024-01-01', ['astro']),
    post('newer', '2025-01-01', ['astro', 'web'])
  ]
  expect(sortMDByDate(posts).map((item) => item.id)).toEqual(['newer', 'older'])
  expect(posts.map((item) => item.id)).toEqual(['older', 'newer'])
  expect(groupCollectionsByYear(posts).map(([year]) => year)).toEqual([2025, 2024])
  expect(getUniqueTagsWithCount(posts)).toEqual([
    ['astro', 2],
    ['web', 1]
  ])
})
