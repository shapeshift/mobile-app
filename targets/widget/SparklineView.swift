import SwiftUI

struct SparklineView: View {
    let data: [Double]
    let isPositive: Bool
    let lineWidth: CGFloat

    init(data: [Double], isPositive: Bool, lineWidth: CGFloat = 1.5) {
        self.data = data
        self.isPositive = isPositive
        self.lineWidth = lineWidth
    }

    var body: some View {
        GeometryReader { geometry in
            Path { path in
                guard !data.isEmpty else { return }

                let minValue = data.min() ?? 0
                let maxValue = data.max() ?? 1
                let range = maxValue - minValue

                // Avoid division by zero
                guard range > 0 else { return }

                let width = geometry.size.width
                let height = geometry.size.height
                let stepX = width / CGFloat(data.count - 1)

                // Start path
                let firstY = height - (CGFloat((data[0] - minValue) / range) * height)
                path.move(to: CGPoint(x: 0, y: firstY))

                // Draw line through all points
                for (index, value) in data.enumerated() {
                    let x = CGFloat(index) * stepX
                    let y = height - (CGFloat((value - minValue) / range) * height)
                    path.addLine(to: CGPoint(x: x, y: y))
                }
            }
            .stroke(isPositive ? Color.green : Color.red, lineWidth: lineWidth)
        }
    }
}

// Preview
struct SparklineView_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 20) {
            // Positive trend
            SparklineView(
                data: [100, 105, 103, 108, 112, 110, 115],
                isPositive: true
            )
            .frame(height: 30)
            .padding()

            // Negative trend
            SparklineView(
                data: [100, 95, 97, 92, 88, 90, 85],
                isPositive: false
            )
            .frame(height: 30)
            .padding()
        }
        .background(Color(hex: "#181C27"))
    }
}
