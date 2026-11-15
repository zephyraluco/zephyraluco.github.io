import type { Element, Root } from 'hast'
import { h } from 'hastscript'

/** Adjacent fences with the same group metadata form one independently controlled tab set. */
export default function rehypeCodeTabs() {
  return (tree: Root) => {
    let sequence = 0
    const groupOf = (node: Root['children'][number]) =>
      node.type === 'element' ? node.properties['data-code-group'] : undefined
    const walk = (parent: Root | Element) => {
      for (let index = 0; index < parent.children.length; index++) {
        const first = parent.children[index]
        const group = groupOf(first)
        if (!group || first.type !== 'element') {
          if (first.type === 'element') walk(first)
          continue
        }
        const panels: Element[] = [first]
        let end = index + 1
        while (end < parent.children.length) {
          const node = parent.children[end]
          if (node.type === 'text' && !node.value.trim()) {
            end++
            continue
          }
          if (groupOf(node) !== group || node.type !== 'element') break
          panels.push(node)
          end++
        }
        if (panels.length < 2) continue
        const prefix = `code-tabs-${sequence++}`
        const tabs = panels.map((panel, position) => {
          const tabId = `${prefix}-tab-${position}`
          const panelId = `${prefix}-panel-${position}`
          Object.assign(panel.properties, {
            id: panelId,
            role: 'tabpanel',
            tabIndex: 0,
            'aria-labelledby': tabId
          })
          return h(
            'button',
            {
              id: tabId,
              type: 'button',
              role: 'tab',
              'aria-selected': position === 0 ? 'true' : 'false',
              'aria-controls': panelId,
              tabIndex: position === 0 ? 0 : -1
            },
            String(panel.properties['data-code-label'])
          )
        })
        const copies = panels.flatMap((panel, position) => {
          const headerIndex = panel.children.findIndex(
            (child) =>
              child.type === 'element' &&
              child.properties.className instanceof Array &&
              child.properties.className.includes('code-header')
          )
          if (headerIndex < 0) return []
          const header = panel.children.splice(headerIndex, 1)[0] as Element
          const copy = header.children.find(
            (child) => child.type === 'element' && child.tagName === 'button'
          )
          if (!copy || copy.type !== 'element') return []
          copy.properties.hidden = position !== 0
          return [copy]
        })
        // Panels remain readable without JavaScript; enhancement hides inactive panels.
        parent.children.splice(
          index,
          end - index,
          h('code-tabs', [
            h('div', { class: 'code-header' }, [
              h(
                'div',
                { class: 'code-tabs-list', role: 'tablist', 'aria-label': String(group) },
                tabs
              ),
              h('div', { class: 'code-tabs-copies' }, copies)
            ]),
            ...panels
          ])
        )
      }
    }
    walk(tree)
  }
}
