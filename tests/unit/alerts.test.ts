import { describe, expect, test } from 'bun:test'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

import remarkAlerts from '../../src/plugins/remark-alerts'

const render = async (markdown: string) =>
  String(
    await unified()
      .use(remarkParse)
      .use(remarkAlerts)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(markdown)
  )

describe('Markdown alerts', () => {
  for (const type of ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION']) {
    test(`renders ${type} as a labeled semantic note`, async () => {
      const html = await render(`> [!${type}]\n> Keep this message.`)
      expect(html).toContain(`markdown-alert-${type.toLowerCase()}`)
      expect(html).toContain('role="note"')
      expect(html).toContain('Keep this message.')
      expect(html).not.toContain(`[!${type}]`)
    })
  }

  test('preserves localized content and nested Markdown formatting', async () => {
    const html = await render(
      '> [!WARNING]\n> **注意**\n>\n> Read **this** and `that`.\n>\n> - First\n> - Second'
    )
    expect(html).toContain('aria-label="Warning"')
    expect(html).toContain('<strong>this</strong>')
    expect(html).toContain('<code>that</code>')
    expect(html).toContain('<li>Second</li>')
  })

  test('keeps normal blockquotes, unknown markers and fenced code unchanged', async () => {
    const quote = await render('> A regular quotation.\n\n> [!UNKNOWN]\n> Ordinary text.')
    expect(quote).not.toContain('markdown-alert')
    expect(quote).toContain('[!UNKNOWN]')
    expect(await render('> [!NOTE] Not a standalone marker')).not.toContain('markdown-alert')
    const code = await render('```md\n> [!NOTE]\n> This is source code.\n```')
    expect(code).not.toContain('<aside')
    expect(code).toContain('[!NOTE]')
  })
})
