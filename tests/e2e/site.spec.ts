import { expect, test } from '@playwright/test'

// Exercise offline behavior; never write to the live comment service.
test.beforeEach(async ({ page }) => {
  await page.route('https://**/*', (route) => route.abort())
})

test('navigation, theme persistence and OS preference respect', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await expect(page.locator('.brand')).toHaveAttribute('aria-current', 'page')
  const toggle = page.locator('.theme-toggle')
  await toggle.click()
  await page.getByRole('button', { name: 'Dark theme', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await toggle.click()
  await page.getByRole('button', { name: 'Light theme', exact: true }).click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await toggle.click()
  await page.getByRole('button', { name: 'System theme', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.getByRole('link', { name: 'Notes', exact: true }).first().click()
  await expect(page.locator('.nav-links a[href="/notes"]')).toHaveAttribute('aria-current', 'page')
})

test('mobile navigation fits small screens and supports keyboard dismissal', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto('/')
  const menu = page.locator('.mobile-menu')
  await menu.locator('summary').click()
  await expect(menu.locator('a[href="/blog"]')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(menu).not.toHaveAttribute('open')
  await menu.locator('summary').click()
  await menu.locator('a[href="/blog"]').click()
  await expect(page).toHaveURL(/\/blog$/)
  expect(
    await page
      .locator('.navigation')
      .evaluate((el) => el.getBoundingClientRect().right <= innerWidth)
  ).toBe(true)
})

test('production search returns indexed articles', async ({ page }) => {
  await page.goto('/search')
  const input = page.getByRole('textbox', { name: 'Search', exact: true })
  await expect(input).toBeVisible()
  await input.fill('CycloneDDS')
  await expect(page.locator('.pagefind-ui__result-link').first()).toBeVisible()
  await expect(page.locator('.pagefind-ui__result-link').first()).toContainText(/CycloneDDS/i)
})

test('Markdown alerts, reading metadata, headings and bundled lightbox remain functional', async ({
  page
}) => {
  await page.goto('/blog/tspi')
  await expect(page.locator('.markdown-alert-caution').first()).toBeVisible()
  await expect(page.locator('.article-info')).toContainText(/min/)
  await expect(page.locator('.prose h2[id]').first()).toBeVisible()
  const image = page.locator('img.zoomable.medium-zoom-image').first()
  await expect(image).toBeVisible()
  await image.click()
  await expect(page.locator('.medium-zoom-overlay')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.medium-zoom-image--opened')).toHaveCount(0)
})

test('notes render Mermaid with the local content pipeline', async ({ page }) => {
  await page.goto('/notes/embedded/' + encodeURIComponent('内存布局'))
  await expect(page.locator('.mermaid svg').first()).toBeVisible({ timeout: 30000 })
  await expect(page.locator('.mermaid svg').first()).not.toContainText('Syntax error')
  const node = page.locator('.mermaid .node rect').first()
  const lightFill = await node.evaluate((el) => getComputedStyle(el).fill)
  await page.locator('.theme-toggle').click()
  await page.getByRole('button', { name: 'Dark theme', exact: true }).click()
  await expect.poll(() => node.evaluate((el) => getComputedStyle(el).fill)).not.toBe(lightFill)
})

test('quote errors fall back without uncaught exceptions', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('quote-component')).toContainText('Stay hungry, stay foolish')
  expect(errors).toEqual([])
})

test('RSS and sitemap retain generated article routes', async ({ request }) => {
  const rss = await request.get('/rss.xml')
  expect(rss.ok()).toBe(true)
  expect(await rss.text()).toContain('<rss')
  const sitemap = await request.get('/sitemap-0.xml')
  expect(sitemap.ok()).toBe(true)
  expect(await sitemap.text()).toContain('/blog/tspi')
})

test('math, syntax highlighting and comment editor remain available', async ({ page }) => {
  await page.goto('/notes/linux/' + encodeURIComponent('linux事件处理机制'))
  await expect(page.locator('.katex').first()).toBeVisible()
  await page.goto('/blog/tspi')
  await expect(page.locator('.astro-code').first()).toBeVisible()
  await expect(page.locator('#waline .wl-editor')).toBeVisible()
})

test('quote adapter renders a successful provider response', async ({ page }) => {
  await page.route('https://v1.hitokoto.cn/**', (route) =>
    route.fulfill({ json: { hitokoto: 'A successful quote' } })
  )
  await page.goto('/')
  await expect(page.locator('quote-component')).toContainText('A successful quote')
})

test('pure Markdown alerts preserve localized content and theme-aware styling', async ({
  page
}) => {
  await page.goto('/blog/tspi')
  const danger = page.getByRole('note', { name: 'Caution', exact: true })
  await expect(danger).toBeVisible()
  await expect(danger).toContainText('MASKROM')
  await expect(page.locator('.markdown-alert-warning').first()).toContainText('注意')
  expect(
    await danger.evaluate((el) => parseFloat(getComputedStyle(el).borderInlineStartWidth))
  ).toBeGreaterThan(0)
  const container = danger.locator('.markdown-alert-container')
  await expect(container).toHaveCSS('border-inline-start-width', '8px')
  await expect(danger).toHaveCSS('border-radius', '12px')
  await expect(danger.locator('.markdown-alert-title svg')).toBeVisible()
  const lightColor = await danger.evaluate((el) => getComputedStyle(el).color)
  await page.locator('.theme-toggle').click()
  await page.getByRole('button', { name: 'Dark theme', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  expect(await danger.evaluate((el) => getComputedStyle(el).color)).not.toBe(lightColor)
})

test('tables scroll on small screens and astro-pure highlighting follows the theme', async ({
  page
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/notes/rust/' + encodeURIComponent('rust语法'))
  const table = page.locator('.prose table').first()
  await table.scrollIntoViewIfNeeded()
  expect(await table.locator('..').evaluate((el) => getComputedStyle(el).overflowX)).toBe('auto')
  expect(
    await table.locator('..').evaluate((el) => el.getBoundingClientRect().right <= innerWidth)
  ).toBe(true)
  const token = page.locator('.astro-code code span[style*="--shiki-dark"]').first()
  const lightColor = await token.evaluate((el) => getComputedStyle(el).color)
  await page.locator('.theme-toggle').click()
  await page.getByRole('button', { name: 'Dark theme', exact: true }).click()
  await expect.poll(() => token.evaluate((el) => getComputedStyle(el).color)).not.toBe(lightColor)
})

test('code toolbars stay visible and tables use native full-width layout', async ({
  page,
  context
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/notes/rust/' + encodeURIComponent('rust语法'))
  const block = page.locator('.astro-code').first()
  const toolbar = block.locator('.code-header')
  await expect(toolbar).toBeVisible()
  await expect(toolbar).toHaveCSS('height', '40px')
  await expect(block).toHaveCSS('border-radius', '12px')
  await expect(block.locator('pre')).toHaveCSS('padding', '16px')
  await expect(block).toHaveCSS('background-color', 'rgb(250, 250, 250)')
  const copy = toolbar.locator('button.copy')
  await expect(copy).toHaveCSS('opacity', '1')
  const source = await copy.getAttribute('data-code')
  await copy.click()
  await expect(copy).toHaveAttribute('aria-label', 'Code copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source)
  const table = page.locator('.markdown-table table').first()
  await expect(table).toHaveCSS('display', 'table')
  const width = await table.evaluate((el) => el.getBoundingClientRect().width)
  const frameWidth = await table.locator('..').evaluate((el) => el.clientWidth)
  expect(Math.abs(width - frameWidth)).toBeLessThan(2)
})

test('inline code remains non-interactive text', async ({ page }) => {
  await page.goto('/notes/rust/' + encodeURIComponent('rust语法'))
  const inline = page.locator('.prose :not(pre) > code').first()
  await inline.scrollIntoViewIfNeeded()
  await expect(inline).toHaveCSS('border-radius', '8px')
  await expect(inline).toHaveCSS('border-style', 'none')
  const style = await inline.evaluate((el) => {
    const css = getComputedStyle(el)
    return { background: css.backgroundColor, shadow: css.boxShadow, font: css.fontFamily }
  })
  expect(style.background).toMatch(/rgba\(.+, 0\.05\)/)
  expect(style.shadow).toContain('rgba(255, 255, 255, 0.1)')
  expect(style.font).toContain('Cascadia Code')
  await expect(inline).toHaveCSS('cursor', 'auto')
  await expect(inline).not.toHaveAttribute('tabindex')
  await expect(inline).not.toHaveAttribute('role', 'button')
  await expect(inline).not.toHaveClass(/site-button/)
  const before = await inline.evaluate((el) => getComputedStyle(el).transform)
  await inline.hover()
  expect(await inline.evaluate((el) => getComputedStyle(el).transform)).toBe(before)
})

test('navigation matches Duckquill geometry and keyboard access', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  const navigation = page.locator('.navigation')
  await expect(navigation).toHaveCSS('padding', '8px')
  await expect(navigation).toHaveCSS('border-radius', '26px')
  expect(await navigation.evaluate((el) => el.getBoundingClientRect().height)).toBe(52)
  expect(
    await navigation.evaluate((el) => getComputedStyle(el, '::before').backdropFilter)
  ).toContain('blur(12px)')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to main content' })
  await expect(skip).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
  await page.goto('/notes')
  await expect(page.locator('.brand')).not.toHaveAttribute('aria-current')
  await expect(page.locator('.brand')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(page.locator('.nav-links a[href="/notes"]')).toHaveAttribute('aria-current', 'page')
})

test('theme submenu supports keyboard, dismissal and mobile layout', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto('/')
  const toggle = page.locator('.theme-toggle')
  const options = page.locator('.theme-options')
  await toggle.focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('button', { name: 'System theme', exact: true })).toBeFocused()
  await page.keyboard.press('Home')
  await page.keyboard.press('Enter')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(toggle).toBeFocused()
  await toggle.click()
  await expect(page.getByRole('button', { name: 'Light theme', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  expect(
    await options.evaluate((el) => {
      const r = el.getBoundingClientRect()
      return r.left >= 0 && r.right <= innerWidth
    })
  ).toBe(true)
  await page.keyboard.press('Escape')
  await expect(options).toBeHidden()
  await toggle.click()
  await page.locator('h1').first().click()
  await expect(options).toBeHidden()
})
