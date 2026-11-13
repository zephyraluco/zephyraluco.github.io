import type { RemarkPlugins } from 'astro'
import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import mdx from '@astrojs/mdx'
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
import { remarkAddZoomable, remarkReadingTime } from './src/plugins/remark-plugins.ts'
// Shiki
import {
  addCollapse,
  addCopyButton,
  addLanguage,
  addTitle,
  updateStyle
} from './src/plugins/shiki-custom-transformers.ts'
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
    remarkPlugins: [
      remarkMath,
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
      rehypeHeadingIds,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: { className: ['anchor'] },
          content: { type: 'text', value: '#' }
        }
      ]
    ],
    // https://docs.astro.build/en/guides/syntax-highlighting/
    shikiConfig: {
      themes: {
        light: 'one-light',
        dark: 'one-dark-pro'
      },
      transformers: [
        // Two copies of @shikijs/types (one under node_modules
        // and another nested under @astrojs/markdown-remark → shiki).
        // Official transformers
        // @ts-ignore this happens due to multiple versions of shiki types
        transformerNotationDiff(),
        // @ts-ignore this happens due to multiple versions of shiki types
        transformerNotationHighlight(),
        // @ts-ignore this happens due to multiple versions of shiki types
        transformerRemoveNotationEscape(),
        // Custom transformers
        // @ts-ignore this happens due to multiple versions of shiki types
        updateStyle(),
        // @ts-ignore this happens due to multiple versions of shiki types
        addTitle(),
        // @ts-ignore this happens due to multiple versions of shiki types
        addLanguage(),
        // @ts-ignore this happens due to multiple versions of shiki types
        addCopyButton(2000), // timeout in ms
        // @ts-ignore this happens due to multiple versions of shiki types
        addCollapse(15) // max lines that needs to collapse
      ]
    }
  },

  // [Integrations]
  integrations: [
    mdx({ optimize: true }),
    sitemap(),
    UnoCSS({ injectReset: true }),
    searchIndex(config.integ.pagefind)
  ],

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
    clientPrerender: true,
    // https://docs.astro.build/en/reference/experimental-flags/queued-rendering/
    queuedRendering: {
      enabled: true
    }
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
