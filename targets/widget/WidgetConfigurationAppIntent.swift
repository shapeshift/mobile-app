import AppIntents
import WidgetKit

@available(iOS 17.0, *)
struct ConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Configuration"
    static var description = IntentDescription("Choose your widget data source")

    @Parameter(title: "Data Source", default: .marketCap)
    var dataSource: DataSourceAppEnum
}

@available(iOS 17.0, *)
enum DataSourceAppEnum: String, AppEnum, CaseDisplayRepresentable {
    case marketCap
    case tradingVolume

    static var typeDisplayRepresentation: TypeDisplayRepresentation {
        TypeDisplayRepresentation(name: "Data Source")
    }

    static var caseDisplayRepresentations: [DataSourceAppEnum: DisplayRepresentation] {
        [
            .marketCap: DisplayRepresentation(
                title: "Market Cap",
                subtitle: "Top tokens by market capitalization",
                image: .init(systemName: "chart.bar.fill")
            ),
            .tradingVolume: DisplayRepresentation(
                title: "Trading Volume",
                subtitle: "Top tokens by 24h trading volume",
                image: .init(systemName: "chart.line.uptrend.xyaxis")
            )
        ]
    }
}

// Show selection menu intent
@available(iOS 17.0, *)
struct ShowSelectionIntent: AppIntent {
    static var title: LocalizedStringResource = "Show Selection"
    static var description = IntentDescription("Show data source selection")

    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult {
        print("[Widget Intent] ShowSelectionIntent triggered!")

        let defaults = UserDefaults(suiteName: "group.com.shapeShift.shapeShift")
        defaults?.set(true, forKey: "widgetShowingSelection")
        defaults?.synchronize()

        WidgetCenter.shared.reloadAllTimelines()

        return .result()
    }
}

// Select data source intent
@available(iOS 17.0, *)
struct SelectDataSourceIntent: AppIntent {
    static var title: LocalizedStringResource = "Select Data Source"
    static var description = IntentDescription("Select a data source")

    static var openAppWhenRun: Bool = false

    @Parameter(title: "Data Source")
    var dataSource: String

    init() {
        self.dataSource = "market_cap"
    }

    init(dataSource: String) {
        self.dataSource = dataSource
    }

    func perform() async throws -> some IntentResult {
        print("[Widget Intent] SelectDataSourceIntent triggered with: \(dataSource)")

        let defaults = UserDefaults(suiteName: "group.com.shapeShift.shapeShift")
        defaults?.set(dataSource, forKey: "widgetDataSource")
        defaults?.set(false, forKey: "widgetShowingSelection")
        defaults?.synchronize()

        WidgetCenter.shared.reloadAllTimelines()

        return .result()
    }
}

// Toggle Intent for in-widget button (keeping for backward compatibility)
@available(iOS 17.0, *)
struct ToggleDataSourceIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Data Source"
    static var description = IntentDescription("Switch between Market Cap and Trading Volume")

    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult {
        print("[Widget Intent] ToggleDataSourceIntent triggered!")

        // Get current configuration from UserDefaults
        let defaults = UserDefaults(suiteName: "group.com.shapeShift.shapeShift")
        let currentSource = defaults?.string(forKey: "widgetDataSource") ?? "market_cap"

        print("[Widget Intent] Current source: \(currentSource)")

        // Toggle the data source
        let newSource = currentSource == "market_cap" ? "trading_volume" : "market_cap"
        defaults?.set(newSource, forKey: "widgetDataSource")
        defaults?.synchronize()

        print("[Widget Intent] New source: \(newSource)")

        // Reload all widgets
        WidgetCenter.shared.reloadAllTimelines()

        print("[Widget Intent] Reloaded all timelines")

        return .result()
    }
}
