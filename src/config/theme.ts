import { z } from 'astro/zod'

import { FaviconSchema } from './schemas/favicon'
import { HeadConfigSchema } from './schemas/head'
import { HeaderMenuSchema } from './schemas/header'
import { LocaleConfigSchema } from './schemas/locale'
import { LogoConfigSchema } from './schemas/logo'
import { ShareSchema } from './schemas/share'
import { SocialLinksSchema } from './schemas/social'

/** Site-wide presentation settings. Defaults are applied by config/index.ts. */
export const ThemeConfigSchema = () =>
  z.object({
    title: z.string(),
    author: z.string(),
    description: z.string().default('Built with Astro'),
    favicon: FaviconSchema(),
    socialCard: z.string().default('/images/social-card.png'),
    logo: LogoConfigSchema(),
    tagline: z.string().optional(),
    locale: LocaleConfigSchema(),
    head: HeadConfigSchema(),
    customCss: z.array(z.string()).default([]),
    titleDelimiter: z.string().default('•'),
    prerender: z.boolean().default(true),
    npmCDN: z.string().default('https://cdn.jsdelivr.net/npm'),
    header: z.object({ menu: HeaderMenuSchema() }),
    footer: z.object({
      year: z.string(),
      links: z
        .array(
          z.object({
            title: z.string(),
            link: z.string(),
            style: z.string().optional(),
            pos: z.number().default(1)
          })
        )
        .optional(),
      credits: z.boolean().default(true),
      social: SocialLinksSchema()
    }),
    content: z.object({
      externalLinks: z.object({
        content: z.string().default(' ↗'),
        properties: z.record(z.string(), z.string()).optional()
      }),
      blogPageSize: z.number().int().positive().default(8),
      share: ShareSchema(),
      imageCaption: z.boolean().default(false)
    })
  })

export type ThemeUserConfig = z.input<ReturnType<typeof ThemeConfigSchema>>
export type ThemeConfig = z.output<ReturnType<typeof ThemeConfigSchema>>
