import { NativeModulesProxy } from 'expo-modules-core'

const ExpoWidgetBridge = NativeModulesProxy.ExpoWidgetBridgeModule

export enum TokenDataSource {
  MarketCap = 'market_cap',
  TradingVolume = 'trading_volume',
  Watchlist = 'watchlist',
}

export interface Token {
  id: string
  symbol: string
  name: string
  price: number
  priceChange24h: number
  iconUrl?: string
}

export async function updateWidgetData(
  tokens: Token[],
  dataSource: TokenDataSource = TokenDataSource.MarketCap,
): Promise<{ success: boolean; message: string }> {
  const tokensJSON = JSON.stringify(tokens)
  return await ExpoWidgetBridge.updateWidgetData(tokensJSON, dataSource)
}

export async function getWidgetData(): Promise<{
  tokens: string
  dataSource: string
  lastUpdated: string
}> {
  return await ExpoWidgetBridge.getWidgetData()
}
