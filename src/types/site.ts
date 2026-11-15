export type { IntegrationUserConfig } from '../config/integrations'
export type { ThemeUserConfig } from '../config/theme'
export type { UserConfig as ConfigOutput, UserInputConfig as Config } from '../config/schema'

export type { IconsType } from '../lib/icons'

export interface SiteMeta {
  title: string
  description?: string
  ogImage?: string | undefined
  articleDate?: string | undefined
}

export type CardListData = {
  title: string
  list: CardList
}

export type CardList = {
  title: string
  link?: string
  children?: CardList
}[]

export type TimelineEvent = {
  date: string
  content: string
}
