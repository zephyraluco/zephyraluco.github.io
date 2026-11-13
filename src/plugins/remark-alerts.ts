import { fromHtml } from 'hast-util-from-html'
import type { Blockquote, Paragraph, Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

import { Icons } from '../lib/icons'

const labels = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution'
} as const

/** Standard GitHub alert markers on a standalone first line of a blockquote. */
const remarkAlerts: Plugin<[], Root> = () => (tree) => {
  visit(tree, 'blockquote', (node: Blockquote) => {
    const first = node.children[0]
    if (first?.type !== 'paragraph') return
    const marker = first.children[0]
    if (marker?.type !== 'text') return
    const match = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:[ \t]*\r?\n|$)/i.exec(marker.value)
    if (!match) return

    const kind = match[1].toLowerCase() as keyof typeof labels
    const title = labels[kind]
    marker.value = marker.value.slice(match[0].length)
    if (!marker.value) first.children.shift()
    if (!first.children.length) node.children.shift()

    const iconName = {
      note: 'info',
      tip: 'bulb',
      important: 'info',
      warning: 'alert',
      caution: 'octangon'
    } as const
    const icon = fromHtml(
      `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${Icons[iconName[kind]]}</svg>`,
      { fragment: true }
    ).children.find((child) => child.type === 'element')
    const heading: Paragraph = {
      type: 'paragraph',
      data: {
        hProperties: { className: ['markdown-alert-title', 'not-prose'] },
        hChildren: [...(icon ? [icon] : []), { type: 'text', value: title }]
      },
      children: [{ type: 'text', value: title }]
    }
    const content: Blockquote = {
      type: 'blockquote',
      data: { hName: 'div', hProperties: { className: ['markdown-alert-content'] } },
      children: node.children
    }
    node.children = [
      {
        type: 'blockquote',
        data: { hName: 'div', hProperties: { className: ['markdown-alert-container'] } },
        children: [heading, content]
      }
    ]
    node.data = {
      ...node.data,
      hName: 'aside',
      hProperties: {
        ...node.data?.hProperties,
        className: ['markdown-alert', `markdown-alert-${kind}`],
        role: 'note',
        ariaLabel: title
      }
    }
  })
}

export default remarkAlerts
