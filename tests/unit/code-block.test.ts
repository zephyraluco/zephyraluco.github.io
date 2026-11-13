import { expect, test } from 'bun:test'
import type { Root } from 'hast'
import { codeToHtml } from 'shiki'
import { unified } from 'unified'

import rehypeTables from '../../src/plugins/rehype-tables'
import { addCodeHeader, updateStyle } from '../../src/plugins/shiki-custom-transformers'

test('code blocks have a real language toolbar and copy the unmodified source', async () => {
  const source = 'let highlight = true;'
  const html = await codeToHtml(source, {
    lang: 'rust',
    themes: { light: 'one-light', dark: 'one-dark-pro' },
    transformers: [updateStyle(), addCodeHeader()]
  })
  expect(html).toContain('class="code-header"')
  expect(html).toContain('class="code-label">rust</span>')
  expect(html).toContain(`data-code="${source}"`)
  expect(html).toContain('aria-label="Copy code"')
  expect(html.indexOf('code-header')).toBeLessThan(html.indexOf('<pre>'))
  expect(html).toContain('one-light one-dark-pro')
  expect(html).toContain('--code-background-light:')
})

test('tables keep their native structure and alignment inside a scrollable frame', async () => {
  const tree: Root = {
    type: 'root',
    children: [{ type: 'element', tagName: 'table', properties: {}, children: [] }]
  }
  const result = await unified().use(rehypeTables).run(tree)
  const frame = result.children[0]
  expect(frame).toMatchObject({
    tagName: 'div',
    properties: { className: ['markdown-table'], tabIndex: 0 }
  })
  expect('children' in frame && frame.children[0]).toMatchObject({ tagName: 'table' })
})
