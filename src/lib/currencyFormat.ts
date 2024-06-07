/**
 * Needed to change the default format configuration of the shapeshift web app
 */
import { getNumberFormatSettings } from 'react-native-localize'

export const currencyFormatSettingsInjectedJavascript = `
globalThis.mobileCurrencyFormat = ${JSON.stringify(getNumberFormatSettings())}
`
