import settings from '../site.config'
import { UserConfigSchema } from './schema'

/** Validated configuration with defaults. Import only from server/build modules. */
const config = UserConfigSchema.parse(settings)
export default config

export const { integ } = config
export { terms } from '../site.config'
