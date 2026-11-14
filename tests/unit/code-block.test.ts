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

test('diff annotations mark changed lines and stay out of rendered/copied code', async () => {
  const { transformerNotationDiff } = await import('../../src/plugins/shiki-official/transformers')
  const html = await codeToHtml(
    'const oldValue = 1 // [!code --]\nconst newValue = 2 // [!code ++]',
    {
      lang: 'ts',
      themes: { light: 'one-light', dark: 'one-dark-pro' },
      transformers: [transformerNotationDiff(), updateStyle(), addCodeHeader()]
    }
  )
  expect(html).toContain('has-diff')
  expect(html).toContain('line diff remove')
  expect(html).toContain('line diff add')
  expect(html).not.toContain('[!code')
  expect(html).toContain('data-code="const oldValue = 1')
})

test('long diff blocks retain highlighting classes and accessible collapse state', async () => {
  const { addCollapse } = await import('../../src/plugins/shiki-custom-transformers')
  const { transformerNotationDiff } = await import('../../src/plugins/shiki-official/transformers')
  const html = await codeToHtml(
    Array.from({ length: 20 }, (_, i) => `const v${i} = ${i} // [!code ++]`).join('\n'),
    {
      lang: 'ts',
      theme: 'one-light',
      transformers: [transformerNotationDiff(), updateStyle(), addCodeHeader(), addCollapse(15)]
    }
  )
  expect(html).toContain('has-diff collapsed')
  expect(html).toContain('class="collapse-toggle"')
  expect(html).toContain('aria-expanded="false"')
  expect(html).not.toContain('rounded-lg')
})

test('Markdown groups only adjacent matching fences with unique panel associations', async () => {
  const { createMarkdownProcessor } = await import('@astrojs/markdown-remark')
  const { default: rehypeCodeTabs } = await import('../../src/plugins/rehype-code-tabs')
  const processor = await createMarkdownProcessor({
    shikiConfig: { theme: 'one-light', transformers: [updateStyle(), addCodeHeader()] },
    rehypePlugins: [rehypeCodeTabs]
  })
  const pair =
    '```ts group="hello" label="TypeScript" title="hello world.ts"\nconst value = 1\n```\n\n```js group="hello" label="JavaScript"\nconst value = 1\n```'
  const { code } = await processor.render(pair + '\n\nA separate example.\n\n' + pair)
  expect(code.match(/<code-tabs>/g)).toHaveLength(2)
  expect(code).toContain('code-tabs-0-panel-0')
  expect(code).toContain('code-tabs-1-panel-0')
  expect(code).toContain('role="tablist"')
  expect(code).toContain('aria-controls="code-tabs-0-panel-1"')
  expect(code).toContain('>TypeScript</button>')
  expect(code).toContain('>hello world.ts</span>')
  const separated = await processor.render(
    '```ts group="x"\nlet x = 1\n```\n\nParagraph\n\n```js group="x"\nlet x = 1\n```'
  )
  expect(separated.code).not.toContain('<code-tabs>')
})
