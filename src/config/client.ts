import { integ, theme } from '../site.config'

/** Public browser settings. Do not import the server schema or content helpers here. */
export default {
  npmCDN: theme.npmCDN ?? 'https://cdn.jsdelivr.net/npm',
  integ: {
    quote: integ.quote,
    waline: {
      ...integ.waline,
      additionalConfigs: integ.waline.additionalConfigs ?? {}
    }
  }
}
