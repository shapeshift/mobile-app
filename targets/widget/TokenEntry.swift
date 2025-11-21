import WidgetKit
import SwiftUI

// Timeline Entry
struct TokenEntry: TimelineEntry {
    let date: Date
    let tokens: [Token]
    let dataSource: TokenDataSource
}
