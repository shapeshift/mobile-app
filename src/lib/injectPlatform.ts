/**
 * Needed to change the default format configuration of the shapeshift web app
 */

import { Platform } from 'react-native'

export const injectMobilePlatform = `
globalThis.mobilePlatform = ${JSON.stringify(Platform.OS)}
`
