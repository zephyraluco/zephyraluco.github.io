import { createMarkdownProcessor } from '@astrojs/markdown-remark'
import { expect, test } from '@playwright/test'

import rehypeCodeTabs from '../../src/plugins/rehype-code-tabs'
import {
  addCodeHeader,
  addCollapse,
  updateStyle
} from '../../src/plugins/shiki-custom-transformers'
import { transformerNotationDiff } from '../../src/plugins/shiki-official/transformers'

let example: string

test.beforeAll(async () => {
  const processor = await createMarkdownProcessor({
    shikiConfig: {
      themes: { light: 'one-light', dark: 'one-dark-pro' },
      transformers: [transformerNotationDiff(), updateStyle(), addCodeHeader(), addCollapse(15)]
    },
    rehypePlugins: [rehypeCodeTabs]
  })
  const longCode = Array.from({ length: 20 }, (_, i) => `const value${i} = ${i}`).join('\n')
  example = (
    await processor.render(
      [
        '```ts group="example" label="TypeScript" title="example.ts"',
        'const unchanged = true',
        'const value = 1 // [!code --]',
        'const value = 2 // [!code ++]',
        '```',
        '',
        '```python group="example" label="Python" title="example.py"',
        'value = 2',
        '```',
        '',
        '```ts',
        longCode,
        '```'
      ].join('\n')
    )
  ).code
})

test.beforeEach(async ({ page }) => {
  await page.route('https://**/*', (route) => route.abort())
  await page.goto('/blog/tspi')
  await page.evaluate(() => customElements.whenDefined('code-tabs'))
  await page.locator('.prose').evaluate((element, html) => {
    element.innerHTML = html
  }, example)
})

test('code tabs switch panels with pointer and keyboard and copy the active program', async ({
  page,
  context
}) => {
  const group = page.locator('code-tabs')
  const ts = group.getByRole('tab', { name: 'TypeScript' })
  const python = group.getByRole('tab', { name: 'Python' })
  await expect(group.locator('.code-header')).toHaveCount(1)
  await expect(group.locator('.code-label')).toHaveCount(0)
  await expect(ts).toHaveCSS('height', '32px')
  await expect(group.locator('button.copy:visible')).toHaveCSS('height', '32px')
  await expect(ts).toHaveAttribute('aria-selected', 'true')
  await expect(group.getByRole('tabpanel')).toHaveCount(1)
  await python.click()
  await expect(group.getByRole('tabpanel')).toContainText('value = 2')
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await group.locator('button.copy:visible').click()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('value = 2')
  await python.focus()
  await page.keyboard.press('Home')
  await expect(ts).toBeFocused()
  await expect(ts).toHaveAttribute('aria-selected', 'true')
  const panel = group.getByRole('tabpanel')
  await expect(panel.locator('.diff.remove')).toBeVisible()
  await expect(panel.locator('.diff.add')).toBeVisible()
  expect(
    await panel.locator('.diff.add').evaluate((el) => getComputedStyle(el, '::before').content)
  ).toBe('"+"')
  // Diff markers occupy the same gutter column as the generated line numbers.
  expect(
    await panel
      .locator('.line:not(.diff)')
      .first()
      .evaluate((el) => getComputedStyle(el, '::before').width)
  ).toBe(await panel.locator('.diff.add').evaluate((el) => getComputedStyle(el, '::before').width))
  expect(
    await panel
      .locator('.line:not(.diff)')
      .first()
      .evaluate((el) => getComputedStyle(el, '::before').position)
  ).toBe('sticky')
  await group.locator('button.copy:visible').click()
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toContain('const value = 1')
  expect(copied).not.toContain('[!code')
  await page.keyboard.press('End')
  await ts.focus()
  await page.keyboard.press('ArrowRight')
  await expect(python).toBeFocused()
  await page.setViewportSize({ width: 320, height: 700 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('collapse footer has square upper corners and toggles accessibly', async ({ page }) => {
  const block = page.locator('.astro-code:has(> .collapse-toggle)').last()
  const toggle = block.locator('.collapse-toggle')
  await expect(toggle).toHaveCSS('border-top-left-radius', '0px')
  await expect(toggle).toHaveCSS('border-top-right-radius', '0px')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await toggle.click()
  await expect(block).not.toHaveClass(/collapsed/)
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
})
