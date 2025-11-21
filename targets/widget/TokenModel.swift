import Foundation

// Token data model matching what we'll receive from the app
struct Token: Codable, Identifiable {
    let id: String
    let symbol: String
    let name: String
    let price: Double
    let priceChange24h: Double
    let iconUrl: String?
    let sparkline: [Double]?

    var formattedPrice: String {
        if price >= 1 {
            return String(format: "$%.2f", price)
        } else if price >= 0.01 {
            return String(format: "$%.4f", price)
        } else {
            return String(format: "$%.6f", price)
        }
    }

    var formattedPriceChange: String {
        let sign = priceChange24h >= 0 ? "+" : ""
        return String(format: "%@%.2f%%", sign, priceChange24h)
    }

    var isPriceUp: Bool {
        return priceChange24h >= 0
    }
}

// Widget configuration for data source selection
enum TokenDataSource: String, Codable {
    case marketCap = "market_cap"
    case tradingVolume = "trading_volume"
    case watchlist = "watchlist"

    var displayName: String {
        switch self {
        case .marketCap: return "Market Cap"
        case .tradingVolume: return "Trading Volume"
        case .watchlist: return "Watchlist"
        }
    }
}

// Widget data structure stored in UserDefaults
struct WidgetData: Codable {
    let tokens: [Token]
    let dataSource: TokenDataSource
    let lastUpdated: Date

    init(tokens: [Token] = [], dataSource: TokenDataSource = .marketCap, lastUpdated: Date = Date()) {
        self.tokens = tokens
        self.dataSource = dataSource
        self.lastUpdated = lastUpdated
    }
}

// Shared defaults accessor
class WidgetDataManager {
    static let shared = WidgetDataManager()
    private let appGroupIdentifier = "group.com.shapeShift.shapeShift"
    private let dataKey = "widgetData"

    private var sharedDefaults: UserDefaults? {
        return UserDefaults(suiteName: appGroupIdentifier)
    }

    func saveWidgetData(_ data: WidgetData) {
        guard let defaults = sharedDefaults else {
            print("[Widget] Failed to access shared UserDefaults")
            return
        }

        do {
            // Encode tokens array to JSON string (matching native module format)
            let tokensEncoder = JSONEncoder()
            let tokensData = try tokensEncoder.encode(data.tokens)
            guard let tokensJSON = String(data: tokensData, encoding: .utf8) else {
                print("[Widget] Failed to convert tokens to JSON string")
                return
            }

            // Create widget data structure matching native module format
            let widgetData: [String: Any] = [
                "tokens": tokensJSON,
                "dataSource": data.dataSource.rawValue,
                "lastUpdated": ISO8601DateFormatter().string(from: data.lastUpdated)
            ]

            // Convert to JSON string
            let jsonData = try JSONSerialization.data(withJSONObject: widgetData)
            guard let jsonString = String(data: jsonData, encoding: .utf8) else {
                print("[Widget] Failed to convert widget data to JSON string")
                return
            }

            // Save JSON string to UserDefaults (matching native module format)
            defaults.set(jsonString, forKey: dataKey)
            defaults.synchronize()
            print("[Widget] Successfully saved widget data: \(data.tokens.count) tokens")
        } catch {
            print("[Widget] Failed to encode widget data: \(error)")
        }
    }

    func loadWidgetData() -> WidgetData {
        guard let defaults = sharedDefaults else {
            print("[Widget] Failed to access shared UserDefaults")
            return WidgetData()
        }

        // Try to get the JSON string saved by the native module
        guard let jsonString = defaults.string(forKey: dataKey),
              let jsonData = jsonString.data(using: .utf8) else {
            print("[Widget] No widget data found in UserDefaults")
            return WidgetData()
        }

        do {
            // Parse the outer JSON structure
            guard let dict = try JSONSerialization.jsonObject(with: jsonData) as? [String: Any] else {
                print("[Widget] Failed to parse widget data as dictionary")
                return WidgetData()
            }

            // Extract tokens JSON string
            guard let tokensJSON = dict["tokens"] as? String,
                  let tokensData = tokensJSON.data(using: .utf8) else {
                print("[Widget] Failed to extract tokens JSON")
                return WidgetData()
            }

            // Decode tokens array
            let decoder = JSONDecoder()
            let tokens = try decoder.decode([Token].self, from: tokensData)

            // Extract data source
            let dataSourceString = dict["dataSource"] as? String ?? "market_cap"
            let dataSource = TokenDataSource(rawValue: dataSourceString) ?? .marketCap

            // Extract last updated
            let lastUpdatedString = dict["lastUpdated"] as? String ?? ""
            let dateFormatter = ISO8601DateFormatter()
            let lastUpdated = dateFormatter.date(from: lastUpdatedString) ?? Date()

            print("[Widget] Successfully loaded \(tokens.count) tokens, source: \(dataSource.rawValue)")

            return WidgetData(tokens: tokens, dataSource: dataSource, lastUpdated: lastUpdated)
        } catch {
            print("[Widget] Failed to decode widget data: \(error)")
            return WidgetData()
        }
    }
}
