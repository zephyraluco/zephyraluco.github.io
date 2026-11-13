import { h } from 'hastscript'
import type { ShikiTransformer } from 'shiki'

function parseMetaString(str = '') {
  return Object.fromEntries(
    str.split(' ').reduce(
      (acc: [string, string | true][], cur) => {
        const matched = cur.match(/(.+)?=("(.+)"|'(.+)')$/)
        if (matched === null) return acc
        const key = matched[1]
        const value = matched[3] || matched[4] || true
        acc.push([key, value])
        return acc
      },
      [] as [string, string | true][]
    )
  )
}

// Nest a div in the outer layer
export const updateStyle = (): ShikiTransformer => {
  return {
    name: 'shiki-transformer-update-style',
    pre(node) {
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

// Duckquill-style permanent toolbar: filename or language on the left, copy on the right.
export const addCodeHeader = (timeout = 2000): ShikiTransformer => ({
  name: 'shiki-transformer-code-header',
  pre(node) {
    const meta = parseMetaString(this.options.meta?.__raw)
    const label = meta.title?.toString() || this.options.lang || 'text'
    const button = h(
      'button',
      {
        class: 'copy',
        type: 'button',
        'aria-label': 'Copy code',
        title: 'Copy code',
        'data-code': this.source,
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
      node.properties = {
        ...node.properties,
        class: `${(node.properties?.class as string) || ''} collapsed`
      }
      const collapse = h(
        'button',
        {
          class: 'collapse-toggle bg-card text-muted-foreground rounded-lg m-2',
          'aria-label': 'Toggle collapse code block',
          onclick: "this.parentElement.classList.toggle('collapsed')"
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
