import type { Element, Root } from 'hast'
import type { Plugin } from 'unified'
import { SKIP, visit } from 'unist-util-visit'

/** Keep the table's native column layout; scroll the surrounding frame on narrow screens. */
const rehypeTables: Plugin<[], Root> = () => (tree) => {
  visit(tree, 'element', (node, index, parent) => {
    if (node.tagName !== 'table' || !parent || typeof index !== 'number') return
    const frame: Element = {
      type: 'element',
      tagName: 'div',
      properties: {
        className: ['markdown-table'],
        tabIndex: 0,
        role: 'region',
        ariaLabel: 'Scrollable table'
      },
      children: [node]
    }
    parent.children[index] = frame
    return SKIP
  })
}
export default rehypeTables
