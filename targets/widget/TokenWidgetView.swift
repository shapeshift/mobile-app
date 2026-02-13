import SwiftUI
import WidgetKit

struct TokenWidgetView: View {
    let entry: TokenEntry
    @Environment(\.widgetFamily) var widgetFamily

    var body: some View {
        switch widgetFamily {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Small Widget (Single Token)
struct SmallWidgetView: View {
    let entry: TokenEntry

    var body: some View {
        if let token = entry.tokens.first {
            ZStack {
                Color(hex: "#0F1419")

                VStack(alignment: .leading, spacing: 0) {
                    // Token Icon + Symbol
                    HStack(spacing: 10) {
                        // Token Icon
                        CachedAsyncImage(
                            url: token.iconUrl.flatMap { URL(string: $0) },
                            fallback: AnyView(
                                TokenIconFallback(symbol: token.symbol)
                            )
                        )
                        .frame(width: 32, height: 32)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(token.name)
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(.white)
                                .lineLimit(1)
                            Text(token.symbol.uppercased())
                                .font(.system(size: 12, weight: .regular))
                                .foregroundColor(Color.white.opacity(0.6))
                        }
                        Spacer()
                    }
                    .padding(.bottom, 8)

                    Spacer()

                    // Sparkline
                    if let sparkline = token.sparkline, !sparkline.isEmpty {
                        SparklineView(
                            data: sparkline,
                            isPositive: token.isPriceUp,
                            lineWidth: 2
                        )
                        .frame(height: 45)
                        .padding(.bottom, 8)
                    }

                    // Price
                    Text(token.formattedPrice)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.bottom, 2)

                    // Price Change
                    HStack(spacing: 3) {
                        Image(systemName: token.isPriceUp ? "arrow.up" : "arrow.down")
                            .font(.system(size: 10, weight: .bold))
                        Text(token.formattedPriceChange)
                            .font(.system(size: 13, weight: .medium))
                    }
                    .foregroundColor(token.isPriceUp ? Color(hex: "#16C784") : Color(hex: "#EA3943"))
                }
                .padding(16)
            }
            .widgetURL(URL(string: CaipMapping.shared.getShapeShiftUrl(forCoinGeckoId: token.id) ?? CaipMapping.shared.getFallbackUrl()))
        } else {
            PlaceholderView(message: "No tokens available")
        }
    }
}

// MARK: - Medium Widget (3 Tokens)
struct MediumWidgetView: View {
    let entry: TokenEntry

    var body: some View {
        // Check if we should show the selection view
        let showingSelection = WidgetDataManager.shared.isShowingSelection()

        if showingSelection {
            DataSourceSelectionView()
        } else if entry.tokens.isEmpty {
            PlaceholderView(message: "No tokens available")
        } else {
            ZStack {
                Color(hex: "#0F1419")

                VStack(alignment: .leading, spacing: 0) {
                    // Header with settings button
                    HStack {
                        Text(entry.dataSource.displayName)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(.white)
                        Spacer()

                        if #available(iOS 17.0, *) {
                            Button(intent: ShowSelectionIntent()) {
                                ZStack {
                                    Circle()
                                        .fill(Color(hex: "#5B8DEE").opacity(0.2))
                                        .frame(width: 24, height: 24)
                                    Image(systemName: "gearshape.fill")
                                        .foregroundColor(Color(hex: "#5B8DEE"))
                                        .font(.system(size: 11, weight: .semibold))
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.top, 10)
                    .padding(.bottom, 6)

                    // Token List
                    VStack(spacing: 0) {
                        ForEach(Array(entry.tokens.prefix(3).enumerated()), id: \.element.id) { index, token in
                            let urlString = CaipMapping.shared.getShapeShiftUrl(forCoinGeckoId: token.id) ?? CaipMapping.shared.getFallbackUrl()
                            Link(destination: URL(string: urlString)!) {
                                TokenRowView(token: token, isLast: index == min(2, entry.tokens.count - 1))
                            }
                        }
                    }

                    Spacer(minLength: 0)
                }
            }
        }
    }
}

// MARK: - Token Row Component
struct TokenRowView: View {
    let token: Token
    let isLast: Bool

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                // Token Icon + Info
                HStack(spacing: 8) {
                    // Token Icon
                    CachedAsyncImage(
                        url: token.iconUrl.flatMap { URL(string: $0) },
                        fallback: AnyView(
                            TokenIconFallback(symbol: token.symbol)
                        )
                    )
                    .frame(width: 28, height: 28)

                    // Token Name and Symbol
                    VStack(alignment: .leading, spacing: 1) {
                        Text(token.name)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(.white)
                            .lineLimit(1)
                        Text(token.symbol.uppercased())
                            .font(.system(size: 10, weight: .regular))
                            .foregroundColor(Color.white.opacity(0.6))
                    }
                }
                .frame(width: 95, alignment: .leading)

                // Sparkline
                if let sparkline = token.sparkline, !sparkline.isEmpty {
                    SparklineView(
                        data: sparkline,
                        isPositive: token.isPriceUp,
                        lineWidth: 1.5
                    )
                    .frame(width: 70, height: 22)
                }

                Spacer(minLength: 2)

                // Price + Change
                VStack(alignment: .trailing, spacing: 1) {
                    Text(token.formattedPrice)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                        .fixedSize(horizontal: false, vertical: true)

                    HStack(spacing: 2) {
                        Image(systemName: token.isPriceUp ? "arrow.up" : "arrow.down")
                            .font(.system(size: 8, weight: .bold))
                        Text(token.formattedPriceChange)
                            .font(.system(size: 11, weight: .medium))
                    }
                    .foregroundColor(token.isPriceUp ? Color(hex: "#16C784") : Color(hex: "#EA3943"))
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)

            if !isLast {
                Divider()
                    .background(Color.white.opacity(0.08))
                    .padding(.horizontal, 12)
            }
        }
    }
}

// MARK: - Token Icon Fallback
struct TokenIconFallback: View {
    let symbol: String

    var body: some View {
        ZStack {
            Circle()
                .fill(
                    LinearGradient(
                        colors: [Color(hex: "#3861FB"), Color(hex: "#5B8DEE")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            Text(symbol.prefix(2).uppercased())
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(.white)
        }
    }
}

// MARK: - Placeholder View
struct PlaceholderView: View {
    let message: String

    var body: some View {
        ZStack {
            Color(hex: "#181C27")

            VStack(spacing: 12) {
                Image(systemName: "chart.bar.xaxis")
                    .font(.system(size: 32))
                    .foregroundColor(Color.white.opacity(0.4))

                Text(message)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(Color.white.opacity(0.6))
                    .multilineTextAlignment(.center)

                Text("Open ShapeShift to configure")
                    .font(.system(size: 11))
                    .foregroundColor(Color.white.opacity(0.4))
            }
            .padding()
        }
        .widgetURL(URL(string: "shapeshift://"))
    }
}

// MARK: - Data Source Selection View
@available(iOS 17.0, *)
struct DataSourceSelectionView: View {
    var body: some View {
        ZStack {
            Color(hex: "#0F1419")

            VStack(spacing: 0) {
                // Header
                HStack {
                    Text("Select Data Source")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 12)

                // Options
                VStack(spacing: 8) {
                    // Market Cap Option
                    Button(intent: SelectDataSourceIntent(dataSource: "market_cap")) {
                        HStack(spacing: 12) {
                            ZStack {
                                Circle()
                                    .fill(Color(hex: "#3861FB").opacity(0.2))
                                    .frame(width: 40, height: 40)
                                Image(systemName: "chart.bar.fill")
                                    .foregroundColor(Color(hex: "#3861FB"))
                                    .font(.system(size: 16, weight: .semibold))
                            }

                            VStack(alignment: .leading, spacing: 2) {
                                Text("Market Cap")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(.white)
                                Text("Top tokens by market cap")
                                    .font(.system(size: 11, weight: .regular))
                                    .foregroundColor(Color.white.opacity(0.6))
                            }

                            Spacer()

                            Image(systemName: "chevron.right")
                                .foregroundColor(Color.white.opacity(0.4))
                                .font(.system(size: 12, weight: .semibold))
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(Color.white.opacity(0.05))
                        .cornerRadius(12)
                    }
                    .buttonStyle(.plain)

                    // Trading Volume Option
                    Button(intent: SelectDataSourceIntent(dataSource: "trading_volume")) {
                        HStack(spacing: 12) {
                            ZStack {
                                Circle()
                                    .fill(Color(hex: "#16C784").opacity(0.2))
                                    .frame(width: 40, height: 40)
                                Image(systemName: "chart.line.uptrend.xyaxis")
                                    .foregroundColor(Color(hex: "#16C784"))
                                    .font(.system(size: 16, weight: .semibold))
                            }

                            VStack(alignment: .leading, spacing: 2) {
                                Text("Trading Volume")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(.white)
                                Text("Top tokens by 24h volume")
                                    .font(.system(size: 11, weight: .regular))
                                    .foregroundColor(Color.white.opacity(0.6))
                            }

                            Spacer()

                            Image(systemName: "chevron.right")
                                .foregroundColor(Color.white.opacity(0.4))
                                .font(.system(size: 12, weight: .semibold))
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(Color.white.opacity(0.05))
                        .cornerRadius(12)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 16)

                Spacer()
            }
        }
    }
}

// MARK: - Color Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
