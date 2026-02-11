import WidgetKit
import SwiftUI
import ActivityKit

@main
struct ShapeShiftWidgets: Widget {
    let kind: String = "widget"

    var body: some WidgetConfiguration {
        ActivityConfiguration(for: DemoActivityAttributes.self) { context in
            // Lock screen/banner UI
            LiveActivityView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                        .foregroundColor(.blue)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.state.message)
                        .font(.caption)
                        .lineLimit(1)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.state.message)
                        .font(.body)
                        .foregroundColor(.white)
                }
            } compactLeading: {
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .foregroundColor(.blue)
            } compactTrailing: {
                Text("ShapeShift")
                    .font(.caption2)
                    .foregroundColor(.white)
            } minimal: {
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .foregroundColor(.blue)
            }
        }
    }
}

// Live Activity View for Lock Screen and Banner
struct LiveActivityView: View {
    let context: ActivityViewContext<DemoActivityAttributes>

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                        .font(.title2)
                        .foregroundColor(.blue)

                    Text("ShapeShift")
                        .font(.headline)
                        .foregroundColor(.white)
                }

                Text(context.state.message)
                    .font(.body)
                    .foregroundColor(.white)
                    .lineLimit(2)
            }

            Spacer()
        }
        .padding()
        .background(
            LinearGradient(
                gradient: Gradient(colors: [Color.blue.opacity(0.3), Color.purple.opacity(0.3)]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .activityBackgroundTint(Color.black.opacity(0.8))
    }
}

// MARK: - Activity Attributes (must match the main app)
@available(iOS 16.2, *)
struct DemoActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var message: String
    }

    var name: String
}
