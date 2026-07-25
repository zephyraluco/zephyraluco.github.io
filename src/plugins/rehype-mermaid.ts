import type { Element, Root } from 'hast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

const languagePattern = /\blanguage-(\S+)\b/

/**
 * Rehype plugin that converts ```mermaid fenced code blocks into
 * `<div class="mermaid">...</div>` containers so they can be rendered
 * client-side by the mermaid library.
 *
 * Must run BEFORE `rehypeStringify` and after `rehypeShiki` (which is
 * configured to skip the `mermaid` language via `syntaxHighlight.excludeLangs`).
 */
const rehypeMermaid: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || !parent || typeof index !== 'number') return
      const codeEl = node.children?.find(
        (child): child is Element =>
          child.type === 'element' && child.tagName === 'code'
      )
      if (!codeEl) return

      const className = codeEl.properties?.className
      const classes = Array.isArray(className)
        ? className
        : typeof className === 'string'
          ? [className]
          : []
      const lang = classes
        .map((cls) =>
          typeof cls === 'string' ? languagePattern.exec(cls)?.[1] : null
        )
        .find(Boolean)

      if (lang !== 'mermaid') return

      // Extract raw text content of the code block
      const text = codeEl.children
        ?.map((child) => (child.type === 'text' ? child.value : ''))
        .join('') ?? ''

      const replacement: Element = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['mermaid', 'not-prose'],
          'data-mermaid': 'true'
        },
        children: [{ type: 'text', value: text.trim() }]
      }
      parent.children.splice(index, 1, replacement)
    })
  }
}

export default rehypeMermaid
