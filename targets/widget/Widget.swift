import WidgetKit
import SwiftUI

@main
struct ShapeShiftWidget: Widget {
    let kind: String = "ShapeShiftWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TokenProvider()) { entry in
            TokenWidgetView(entry: entry)
                .containerBackground(for: .widget) {
                    Color(hex: "#181C27")
                }
        }
        .configurationDisplayName("ShapeShift Tokens")
        .description("Track crypto prices by market cap or trading volume")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// Timeline Provider
struct TokenProvider: TimelineProvider {
    func placeholder(in context: Context) -> TokenEntry {
        TokenEntry(
            date: Date(),
            tokens: [
                Token(
                    id: "bitcoin",
                    symbol: "BTC",
                    name: "Bitcoin",
                    price: 43250.50,
                    priceChange24h: 2.45,
                    iconUrl: nil,
                    sparkline: Array(repeating: 0.0, count: 168).enumerated().map { index, _ in
                        40000 + Double(index) * 20 + Double.random(in: -500...500)
                    }
                )
            ],
            dataSource: .marketCap
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (TokenEntry) -> Void) {
        let data = WidgetDataManager.shared.loadWidgetData()
        let entry = TokenEntry(
            date: Date(),
            tokens: data.tokens.isEmpty ? [placeholder(in: context).tokens[0]] : data.tokens,
            dataSource: data.dataSource
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TokenEntry>) -> Void) {
        fetchAndCreateTimeline(dataSource: .marketCap, completion: completion)
    }

    private func fetchAndCreateTimeline(dataSource: TokenDataSource, completion: @escaping (Timeline<TokenEntry>) -> Void) {
        print("[Widget Timeline] Loading widget data for source: \(dataSource.rawValue)")

        // Load saved data from UserDefaults
        let savedData = WidgetDataManager.shared.loadWidgetData()
        print("[Widget Timeline] Loaded \(savedData.tokens.count) saved tokens, last updated: \(savedData.lastUpdated)")

        let currentDate = Date()
        let dataAge = currentDate.timeIntervalSince(savedData.lastUpdated)
        let isStale = dataAge > 600 // Consider stale if older than 10 minutes

        // Only fetch from CoinGecko if data is stale or missing
        if !savedData.tokens.isEmpty && !isStale {
            print("[Widget Timeline] Using cached data (age: \(Int(dataAge))s)")
            let entry = TokenEntry(
                date: currentDate,
                tokens: savedData.tokens,
                dataSource: savedData.dataSource
            )

            // Schedule next update in 15 minutes
            let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
            return
        }

        // Data is stale or missing - fetch from CoinGecko
        print("[Widget Timeline] Data is \(savedData.tokens.isEmpty ? "missing" : "stale (\(Int(dataAge))s old)"), fetching from CoinGecko...")

        Task {
            var tokens = savedData.tokens
            let targetDataSource = savedData.dataSource == .watchlist ? savedData.dataSource : dataSource

            do {
                let freshTokens: [Token]
                switch targetDataSource {
                case .marketCap:
                    freshTokens = try await CoinGeckoService.shared.fetchTopTokensByMarketCap(limit: 10)
                case .tradingVolume:
                    freshTokens = try await CoinGeckoService.shared.fetchTopTokensByVolume(limit: 10)
                case .watchlist:
                    let tokenIds = savedData.tokens.map { $0.id }
                    freshTokens = tokenIds.isEmpty ? [] : try await CoinGeckoService.shared.fetchTokensByIds(tokenIds)
                }

                print("[Widget Timeline] Fetched \(freshTokens.count) fresh tokens")
                if !freshTokens.isEmpty {
                    tokens = freshTokens
                    WidgetDataManager.shared.saveWidgetData(WidgetData(tokens: freshTokens, dataSource: targetDataSource))
                    print("[Widget Timeline] Saved fresh data to UserDefaults")
                }
            } catch {
                print("[Widget Timeline] Error fetching: \(error), using cached data")
            }

            let entry = TokenEntry(
                date: currentDate,
                tokens: tokens,
                dataSource: targetDataSource
            )

            if tokens.isEmpty {
                print("[Widget Timeline] WARNING: No tokens available")
            } else {
                print("[Widget Timeline] Using \(tokens.count) tokens, first: \(tokens[0].symbol) - $\(tokens[0].price)")
            }

            // Schedule next update in 15 minutes
            let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }
}

// Preview Provider
struct Widget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Small widget preview
            TokenWidgetView(entry: TokenEntry(
                date: Date(),
                tokens: [
                    Token(
                        id: "bitcoin",
                        symbol: "BTC",
                        name: "Bitcoin",
                        price: 43250.50,
                        priceChange24h: 2.45,
                        iconUrl: nil,
                        sparkline: (0..<168).map { _ in Double.random(in: 40000...45000) }
                    )
                ],
                dataSource: .marketCap
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))

            // Medium widget preview
            TokenWidgetView(entry: TokenEntry(
                date: Date(),
                tokens: [
                    Token(
                        id: "bitcoin",
                        symbol: "BTC",
                        name: "Bitcoin",
                        price: 43250.50,
                        priceChange24h: 2.45,
                        iconUrl: nil,
                        sparkline: (0..<168).map { _ in Double.random(in: 40000...45000) }
                    ),
                    Token(
                        id: "ethereum",
                        symbol: "ETH",
                        name: "Ethereum",
                        price: 2280.75,
                        priceChange24h: -1.23,
                        iconUrl: nil,
                        sparkline: (0..<168).map { _ in Double.random(in: 2000...2500) }
                    ),
                    Token(
                        id: "cardano",
                        symbol: "ADA",
                        name: "Cardano",
                        price: 0.52,
                        priceChange24h: 4.56,
                        iconUrl: nil,
                        sparkline: (0..<168).map { _ in Double.random(in: 0.45...0.60) }
                    )
                ],
                dataSource: .tradingVolume
            ))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
        }
    }
}
