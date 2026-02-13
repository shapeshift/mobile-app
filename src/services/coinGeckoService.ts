import { Token } from '../../modules/expo-widget-bridge/src'

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3'

// Helper to handle rate limiting - fail fast on 429
async function fetchWithRetry(url: string, maxRetries = 2): Promise<Response> {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url)

      // If rate limited, fail immediately - don't spam the API
      if (response.status === 429) {
        console.log(`[CoinGecko] Rate limited (429), aborting to avoid further rate limit hits`)
        throw new Error('CoinGecko API error: 429')
      }

      return response
    } catch (error) {
      lastError = error as Error
      // Only retry on network errors, not rate limits
      if (i < maxRetries - 1 && !(error as Error).message.includes('429')) {
        const waitTime = 1000 // Just 1 second between retries
        console.log(`[CoinGecko] Network error, waiting ${waitTime}ms before retry ${i + 1}/${maxRetries}`)
        await new Promise<void>(resolve => setTimeout(resolve, waitTime))
      } else {
        throw error
      }
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

export interface CoinGeckoToken {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  image: string
  market_cap: number
  total_volume: number
}

/**
 * Fetches top tokens by market cap from CoinGecko
 * @param limit Number of tokens to fetch (default: 10)
 * @returns Array of tokens
 */
export async function fetchTopTokensByMarketCap(limit: number = 10): Promise<Token[]> {
  try {
    const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`
    const response = await fetchWithRetry(url)

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data: CoinGeckoToken[] = await response.json()

    return data.map(coin => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      priceChange24h: coin.price_change_percentage_24h || 0,
      iconUrl: coin.image,
    }))
  } catch (error) {
    console.error('[CoinGecko] Error fetching market cap data:', error)
    throw error
  }
}

/**
 * Fetches top tokens by trading volume from CoinGecko
 * @param limit Number of tokens to fetch (default: 10)
 * @returns Array of tokens
 */
export async function fetchTopTokensByVolume(limit: number = 10): Promise<Token[]> {
  try {
    const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&order=volume_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`
    const response = await fetchWithRetry(url)

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data: CoinGeckoToken[] = await response.json()

    return data.map(coin => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      priceChange24h: coin.price_change_percentage_24h || 0,
      iconUrl: coin.image,
    }))
  } catch (error) {
    console.error('[CoinGecko] Error fetching volume data:', error)
    throw error
  }
}

/**
 * Fetches specific tokens by their CoinGecko IDs (for watchlist)
 * @param tokenIds Array of CoinGecko token IDs (e.g., ['bitcoin', 'ethereum'])
 * @returns Array of tokens
 */
export async function fetchTokensByIds(tokenIds: string[]): Promise<Token[]> {
  if (tokenIds.length === 0) {
    return []
  }

  try {
    const ids = tokenIds.join(',')
    const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
    const response = await fetchWithRetry(url)

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data: CoinGeckoToken[] = await response.json()

    return data.map(coin => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      priceChange24h: coin.price_change_percentage_24h || 0,
      iconUrl: coin.image,
    }))
  } catch (error) {
    console.error('[CoinGecko] Error fetching tokens by IDs:', error)
    throw error
  }
}
