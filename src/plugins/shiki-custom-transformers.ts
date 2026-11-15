import type { ElementContent } from 'hast'
import { h } from 'hastscript'
import type { ShikiTransformer } from 'shiki'

function parseMetaString(str = ''): Record<string, string> {
  return Object.fromEntries(
    Array.from(str.matchAll(/([\w-]+)=(?:"([^"]*)"|'([^']*)'|([^\s]+))/g), (match) => [
      match[1],
      match[2] ?? match[3] ?? match[4]
    ])
  )
}

// Nest a div in the outer layer
export const updateStyle = (): ShikiTransformer => {
  return {
    name: 'shiki-transformer-update-style',
    pre(node) {
      // Let the component stylesheet own the panel background, while retaining
      // the original Shiki theme's exact light/dark background colors.
      node.properties.style = String(node.properties.style ?? '').replace(
        /background-color:([^;]+);?/,
        '--code-background-light:$1;'
      )
      const container = h('pre', node.children)
      node.children = [container]
      node.tagName = 'div'
    }
  }
}

// Process meta string, like ```ts title="test.ts"
export const processMeta = (): ShikiTransformer => {
  return {
    name: 'shiki-transformer-process-meta',
    preprocess() {
      if (!this.options.meta) return
      const rawMeta = this.options.meta?.__raw
      if (!rawMeta) return
      const meta = parseMetaString(rawMeta)
      Object.assign(this.options.meta, meta)
    }
  }
}

function codeText(node: ElementContent): string {
  if (node.type === 'text') return node.value
  return node.type === 'element' ? node.children.map(codeText).join('') : ''
}

// Duckquill-style permanent toolbar: filename or language on the left, copy on the right.
export const addCodeHeader = (timeout = 2000): ShikiTransformer => ({
  name: 'shiki-transformer-code-header',
  pre(node) {
    const meta = parseMetaString(this.options.meta?.__raw)
    const label = meta.title || this.options.lang || 'text'
    if (meta.group) {
      node.properties['data-code-group'] = meta.group
      node.properties['data-code-label'] = meta.label || this.options.lang || 'text'
    }
    // Notation is authoring metadata, not part of the copied program.
    const source = /\[!code (?:\+\+|--|highlight)/i.test(this.source)
      ? node.children.map(codeText).join('')
      : this.source
    const button = h(
      'button',
      {
        class: 'copy',
        type: 'button',
        'aria-label': 'Copy code',
        title: 'Copy code',
        'data-code': source,
        onclick: `navigator.clipboard.writeText(this.dataset.code).then(() => {
        this.classList.add('copied');
        this.setAttribute('aria-label', 'Code copied');
        setTimeout(() => {
          this.classList.remove('copied');
          this.setAttribute('aria-label', 'Copy code');
        }, ${timeout});
      }).catch(() => this.setAttribute('aria-label', 'Copy failed; select the code to copy'))`
      },
      [
        h('span', { class: 'ready', 'aria-hidden': 'true' }, [
          h(
            'svg',
            {
              width: 20,
              height: 20,
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 2
            },
            [
              h('rect', { x: 9, y: 9, width: 12, height: 12, rx: 2 }),
              h('path', { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' })
            ]
          )
        ]),
        h('span', { class: 'success', 'aria-hidden': 'true' }, [
          h(
            'svg',
            {
              width: 20,
              height: 20,
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 2
            },
            [h('path', { d: 'm5 12 4 4L19 6' })]
          )
        ])
      ]
    )
    node.children.unshift(
      h('div', { class: 'code-header' }, [h('span', { class: 'code-label' }, label), button])
    )
  }
})

// Add a collapse button to the code block
export const addCollapse = (displayLineCount?: number): ShikiTransformer => {
  const line = displayLineCount || 15
  return {
    name: 'shiki-transformer-add-collapse',
    pre(node) {
      if (this.lines.length <= line) return
      this.addClassToHast(node, 'collapsed')
      const collapse = h(
        'button',
        {
          class: 'collapse-toggle',
          type: 'button',
          'aria-expanded': 'false',
          'aria-label': 'Toggle collapse code block',
          onclick:
            "const collapsed = this.parentElement.classList.toggle('collapsed'); this.setAttribute('aria-expanded', String(!collapsed))"
        },
        [
          h('svg', { class: 'size-5' }, [
            h('use', { href: '/icons/code.svg#mingcute-arrow-down-line' })
          ]),
          h('span', { class: 'desc' }, ' code')
        ]
      )
      node.children.push(collapse)
      node.children.push(h('div', { class: 'collapse-fade' }))
    }
  }
}
