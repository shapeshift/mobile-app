import Foundation

class CoinGeckoService {
    static let shared = CoinGeckoService()

    private let baseURL = "https://api.coingecko.com/api/v3"

    private init() {}

    enum FetchError: Error {
        case invalidURL
        case networkError(Error)
        case invalidResponse
        case decodingError(Error)
        case rateLimited
    }

    /// Helper to fetch with retry logic for rate limiting
    private func fetchWithRetry(url: URL, maxRetries: Int = 3) async throws -> Data {
        var lastError: Error?

        for attempt in 0..<maxRetries {
            do {
                let (data, response) = try await URLSession.shared.data(from: url)

                guard let httpResponse = response as? HTTPURLResponse else {
                    throw FetchError.invalidResponse
                }

                // Handle rate limiting
                if httpResponse.statusCode == 429 {
                    // Don't retry on rate limit - just fail fast and use cached data
                    print("[CoinGecko] Rate limited (429), using cached data instead")
                    throw FetchError.rateLimited
                }

                guard (200...299).contains(httpResponse.statusCode) else {
                    throw FetchError.invalidResponse
                }

                return data
            } catch {
                lastError = error
                if attempt < maxRetries - 1 {
                    let waitTime = pow(2.0, Double(attempt))
                    print("[CoinGecko] Error on attempt \(attempt + 1), waiting \(waitTime)s")
                    try await Task.sleep(nanoseconds: UInt64(waitTime * 1_000_000_000))
                }
            }
        }

        throw lastError ?? FetchError.networkError(NSError(domain: "CoinGecko", code: -1))
    }

    struct CoinGeckoToken: Codable {
        let id: String
        let symbol: String
        let name: String
        let current_price: Double
        let price_change_percentage_24h: Double?
        let image: String?
        let market_cap: Double
        let total_volume: Double
        let sparkline_in_7d: SparklineData?
    }

    struct SparklineData: Codable {
        let price: [Double]
    }

    /// Fetches top tokens by market cap from CoinGecko
    func fetchTopTokensByMarketCap(limit: Int = 10) async throws -> [Token] {
        let urlString = "\(baseURL)/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=\(limit)&page=1&sparkline=true&price_change_percentage=24h"

        guard let url = URL(string: urlString) else {
            throw FetchError.invalidURL
        }

        do {
            let data = try await fetchWithRetry(url: url)

            let decoder = JSONDecoder()
            let coins = try decoder.decode([CoinGeckoToken].self, from: data)

            return coins.map { coin in
                Token(
                    id: coin.id,
                    symbol: coin.symbol.uppercased(),
                    name: coin.name,
                    price: coin.current_price,
                    priceChange24h: coin.price_change_percentage_24h ?? 0,
                    iconUrl: coin.image,
                    sparkline: coin.sparkline_in_7d?.price
                )
            }
        } catch let error as DecodingError {
            throw FetchError.decodingError(error)
        } catch {
            throw FetchError.networkError(error)
        }
    }

    /// Fetches top tokens by trading volume from CoinGecko
    func fetchTopTokensByVolume(limit: Int = 10) async throws -> [Token] {
        let urlString = "\(baseURL)/coins/markets?vs_currency=usd&order=volume_desc&per_page=\(limit)&page=1&sparkline=true&price_change_percentage=24h"

        guard let url = URL(string: urlString) else {
            throw FetchError.invalidURL
        }

        do {
            let data = try await fetchWithRetry(url: url)

            let decoder = JSONDecoder()
            let coins = try decoder.decode([CoinGeckoToken].self, from: data)

            return coins.map { coin in
                Token(
                    id: coin.id,
                    symbol: coin.symbol.uppercased(),
                    name: coin.name,
                    price: coin.current_price,
                    priceChange24h: coin.price_change_percentage_24h ?? 0,
                    iconUrl: coin.image,
                    sparkline: coin.sparkline_in_7d?.price
                )
            }
        } catch let error as DecodingError {
            throw FetchError.decodingError(error)
        } catch {
            throw FetchError.networkError(error)
        }
    }

    /// Fetches specific tokens by their IDs (for watchlist)
    func fetchTokensByIds(_ tokenIds: [String]) async throws -> [Token] {
        if tokenIds.isEmpty {
            return []
        }

        let ids = tokenIds.joined(separator: ",")
        let urlString = "\(baseURL)/coins/markets?vs_currency=usd&ids=\(ids)&order=market_cap_desc&sparkline=true&price_change_percentage=24h"

        guard let url = URL(string: urlString) else {
            throw FetchError.invalidURL
        }

        do {
            let data = try await fetchWithRetry(url: url)

            let decoder = JSONDecoder()
            let coins = try decoder.decode([CoinGeckoToken].self, from: data)

            return coins.map { coin in
                Token(
                    id: coin.id,
                    symbol: coin.symbol.uppercased(),
                    name: coin.name,
                    price: coin.current_price,
                    priceChange24h: coin.price_change_percentage_24h ?? 0,
                    iconUrl: coin.image,
                    sparkline: coin.sparkline_in_7d?.price
                )
            }
        } catch let error as DecodingError {
            throw FetchError.decodingError(error)
        } catch {
            throw FetchError.networkError(error)
        }
    }
}
