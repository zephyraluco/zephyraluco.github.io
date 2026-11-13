import type { RemarkPlugins } from 'astro'
import { rehypeHeadingIds, unified } from '@astrojs/markdown-remark'
import sitemap from '@astrojs/sitemap'
import UnoCSS from '@unocss/astro'
import { defineConfig, fontProviders, svgoOptimizer } from 'astro/config'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

import config from './src/config/index.ts'
import searchIndex from './src/integrations/search.ts'
// Local integrations
import rehypeAutolinkHeadings from './src/plugins/rehype-auto-link-headings.ts'
import rehypeExternalLinks from './src/plugins/rehype-external-links.ts'
import rehypeImageCaption from './src/plugins/rehype-image-caption.ts'
import rehypeMermaid from './src/plugins/rehype-mermaid.ts'
import rehypeTables from './src/plugins/rehype-tables.ts'
import remarkAlerts from './src/plugins/remark-alerts.ts'
import { remarkAddZoomable, remarkReadingTime } from './src/plugins/remark-plugins.ts'
// Shiki
import { addCodeHeader, addCollapse, updateStyle } from './src/plugins/shiki-custom-transformers.ts'
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerRemoveNotationEscape
} from './src/plugins/shiki-official/transformers.ts'

// https://astro.build/config
export default defineConfig({
  // [Basic]
  site: 'https://zephyraluco.github.io',
  // Deploy to a sub path
  // base: '/blog/',
  trailingSlash: 'never',
  // root: './my-project-directory',
  server: { host: true },
  scopedStyleStrategy: 'where',
  prefetch: { prefetchAll: true },
  // Preserve the existing spacing between inline elements across the v7 upgrade.
  compressHTML: true,

  // [Adapter]
  // https://docs.astro.build/en/guides/deploy/
  output: 'static',
  // Local (standalone)
  // adapter: node({ mode: 'standalone' }),
  // output: 'server',

  // [Assets]
  image: {
    responsiveStyles: true,
    service: {
      entrypoint: 'astro/assets/services/sharp'
    },
    remotePatterns: [
      // Allow improve Github activity chart
      {
        protocol: 'https',
        hostname: '**.rshah.org'
      }
    ]
  },

  // [Markdown]
  markdown: {
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['math', 'mermaid']
    },
    // Keep the existing Remark/Rehype extensions for Markdown.
    processor: unified({
      remarkPlugins: [
        remarkMath,
        remarkAlerts,
        remarkReadingTime,
        ...(config.integ.mediumZoom.enable
          ? [[remarkAddZoomable, config.integ.mediumZoom.options] as RemarkPlugins[number]]
          : [])
      ],
      rehypePlugins: [
        [rehypeKatex, {}],
        [
          rehypeExternalLinks,
          {
            content: { type: 'text', value: config.content.externalLinks.content },
            contentProperties: config.content.externalLinks.properties
          }
        ],
        ...(config.content.imageCaption ? [rehypeImageCaption] : []),
        rehypeMermaid,
        rehypeTables,
        rehypeHeadingIds,
        [
          rehypeAutolinkHeadings,
          {
            behavior: 'append',
            properties: { className: ['anchor'] },
            content: { type: 'text', value: '#' }
          }
        ]
      ]
    }),
    // https://docs.astro.build/en/guides/syntax-highlighting/
    shikiConfig: {
      themes: {
        light: 'solarized-light',
        dark: 'solarized-dark'
      },
      transformers: [
        // Official transformers
        transformerNotationDiff(),
        transformerNotationHighlight(),
        transformerRemoveNotationEscape(),
        // Custom transformers
        updateStyle(),
        addCodeHeader(2000),
        addCollapse(15) // max lines that needs to collapse
      ]
    }
  },

  // [Integrations]
  integrations: [sitemap(), UnoCSS({ injectReset: true }), searchIndex(config.integ.pagefind)],

  // [Experimental]
  experimental: {
    // Allow compatible editors to support intellisense features for content collection entries
    // https://docs.astro.build/en/reference/experimental-flags/content-intellisense/
    contentIntellisense: true,
    // Enable SVGO optimization for SVG assets
    // https://docs.astro.build/en/reference/experimental-flags/svg-optimization/
    svgOptimizer: svgoOptimizer(),
    // Enables pre-rendering your prefetched pages on the client in supported browsers.
    // https://docs.astro.build/en/reference/experimental-flags/client-prerender/
    clientPrerender: true
  },

  // Enable font preloading and optimization
  // https://docs.astro.build/en/guides/fonts/
  fonts: [
    {
      provider: fontProviders.fontshare(),
      name: 'Satoshi',
      cssVariable: '--font-satoshi',
      // Default included:
      // weights: [400],
      // styles: ["normal", "italics"],
      // subsets: ["cyrillic-ext", "cyrillic", "greek-ext", "greek", "vietnamese", "latin-ext", "latin"],
      // fallbacks: ["sans-serif"],
      styles: ['normal', 'italic'],
      weights: [400, 500],
      subsets: ['latin']
    }
  ]
})
