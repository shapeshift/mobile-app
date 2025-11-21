import { NativeModulesProxy } from 'expo-modules-core'

const ExpoWidgetBridge = NativeModulesProxy.ExpoWidgetBridge

export interface Token {
  id: string
  symbol: string
  name: string
  price: number
  priceChange24h: number
  iconUrl?: string
  sparkline?: number[]
}

export enum TokenDataSource {
  MarketCap = 'market_cap',
  TradingVolume = 'trading_volume',
  Watchlist = 'watchlist',
}

export async function updateWidgetData(
  tokens: Token[],
  dataSource: TokenDataSource = TokenDataSource.MarketCap,
): Promise<{ success: boolean; message: string }> {
  const tokensJSON = JSON.stringify(tokens)
  return await ExpoWidgetBridge.updateWidgetData(tokensJSON, dataSource)
}
