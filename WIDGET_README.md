# ShapeShift iOS Widget - POC

A proof-of-concept iOS widget implementation for the ShapeShift mobile app that displays cryptocurrency prices with configurable data sources.

## Features

- **Two Widget Sizes:**
  - Small (systemSmall): Shows 1 token
  - Medium (systemMedium): Shows 3 tokens

- **Three Data Sources:**
  - Market Cap: Top tokens by market capitalization
  - Trading Volume: Top tokens by 24h trading volume
  - Watchlist: User's favorite/watchlisted tokens

- **Real-time Updates:**
  - Data synced from web app via MessageManager
  - Can fetch directly from CoinGecko API
  - Widget refreshes every 15 minutes

- **Deep Linking:**
  - Tap any token to open the app to that token's detail page
  - Uses `shapeshift://token/{tokenId}` URI scheme

## Project Structure

```
targets/widget/
├── expo-target.config.json    # Widget target configuration
├── Widget.swift                # Main widget entry point
├── TokenProvider.swift         # Timeline provider
├── TokenModel.swift            # Data models and UserDefaults manager
└── TokenWidgetView.swift       # SwiftUI views for widget UI

ios/ShapeShift/
├── WidgetDataModule.swift      # Native module for RN bridge
└── WidgetDataModule.m          # Objective-C bridge

src/lib/
├── widgetData.ts               # TypeScript API for widget updates
└── widgetIntegration.example.ts # Example integration code
```

## Setup Instructions

### 1. Rebuild iOS App

After installing the package and creating the widget files, you need to rebuild:

```bash
# Clean and rebuild
yarn prebuild --clean
cd ios && pod install && cd ..

# Or if using EAS
eas build --platform ios --profile development
```

### 2. Widget Configuration in Xcode

The widget target should be automatically created by `@bacons/apple-targets`. Verify in Xcode:

1. Open `ios/ShapeShift.xcworkspace`
2. Check that you have a "widget" target in the target list
3. Verify "ShapeShift.entitlements" includes App Groups:
   ```xml
   <key>com.apple.security.application-groups</key>
   <array>
       <string>group.com.shapeShift.shapeShift</string>
   </array>
   ```

### 3. Testing the Widget

#### Option A: Update from Web App

From your web application, send a postMessage:

```javascript
// Update widget with market cap tokens
window.ReactNativeWebView.postMessage(JSON.stringify({
  cmd: 'updateWidgetMarketCap',
  tokens: [
    {
      id: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 43250.50,
      priceChange24h: 2.45
    },
    {
      id: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      price: 2280.75,
      priceChange24h: -1.23
    }
  ]
}))
```

#### Option B: Update Programmatically from React Native

```typescript
import { updateWidgetMarketCap, TokenDataSource } from './src/lib/widgetData'

// Update with sample data
const sampleTokens = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 43250.50,
    priceChange24h: 2.45
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2280.75,
    priceChange24h: -1.23
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    price: 0.52,
    priceChange24h: 4.56
  }
]

await updateWidgetMarketCap(sampleTokens)
```

#### Option C: Fetch from CoinGecko API

```typescript
import { fetchAndUpdateMarketCapWidget } from './src/lib/widgetIntegration.example'

// This will fetch top 10 tokens by market cap and update widget
await fetchAndUpdateMarketCapWidget()
```

### 4. Adding Widget to Home Screen

1. Run the app on a physical device or simulator
2. Long-press on the home screen
3. Tap the "+" button in the top-left
4. Search for "ShapeShift"
5. Select the widget size (Small or Medium)
6. Add to home screen

## Usage Examples

### Register Widget Handlers (in App.tsx or Root.tsx)

```typescript
import { registerWidgetHandlers } from './src/lib/widgetIntegration.example'

useEffect(() => {
  registerWidgetHandlers()
}, [])
```

### Update Widget with Different Data Sources

```typescript
import {
  updateWidgetMarketCap,
  updateWidgetTradingVolume,
  updateWidgetWatchlist
} from './src/lib/widgetData'

// Market Cap
await updateWidgetMarketCap(topMarketCapTokens)

// Trading Volume
await updateWidgetTradingVolume(topVolumeTokens)

// Watchlist
await updateWidgetWatchlist(userWatchlistTokens)
```

### Get Current Widget Data

```typescript
import { getWidgetData } from './src/lib/widgetData'

const currentData = await getWidgetData()
console.log('Current widget tokens:', currentData?.tokens)
console.log('Current data source:', currentData?.dataSource)
```

## Widget Customization

### Change Colors

Edit `targets/widget/TokenWidgetView.swift`:

```swift
// Background color
Color(hex: "#181C27") // Change to your brand color

// Positive price change color
Color(hex: "#00D68F") // Green

// Negative price change color
Color(hex: "#F04747") // Red
```

### Change Update Frequency

Edit `targets/widget/TokenProvider.swift`:

```swift
// Change from 15 minutes to your desired interval
let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
```

### Add More Widget Sizes

Edit `targets/widget/Widget.swift`:

```swift
.supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
```

Then implement `LargeWidgetView` in `TokenWidgetView.swift`.

## Data Flow

```
Web App (CoinGecko/API)
    ↓
postMessage to React Native
    ↓
MessageManager Handler
    ↓
WidgetDataModule (Native Swift)
    ↓
UserDefaults (App Group Shared Container)
    ↓
Widget Extension reads data
    ↓
Widget UI Update
```

## Troubleshooting

### Widget Not Updating

1. Check that App Groups are properly configured in both targets
2. Verify the suite name matches: `group.com.shapeShift.shapeShift`
3. Call `WidgetCenter.shared.reloadAllTimelines()` after updating data
4. Check Xcode console for widget logs

### Widget Shows "No tokens available"

1. Ensure you've called `updateWidgetData()` at least once
2. Check that token data is valid (has id, symbol, price)
3. Verify UserDefaults data:
   ```swift
   let defaults = UserDefaults(suiteName: "group.com.shapeShift.shapeShift")
   print(defaults?.string(forKey: "widgetData"))
   ```

### Native Module Not Found

1. Ensure you've run `pod install` after adding the Swift files
2. Check that `WidgetDataModule.m` and `WidgetDataModule.swift` are in the Xcode project
3. Verify the bridging header is configured correctly
4. Rebuild the app completely

## Next Steps

1. **Integrate with your existing data fetching:**
   - Connect to your existing CoinGecko API calls
   - Hook into your watchlist state management
   - Add periodic background fetching

2. **Add widget configuration:**
   - Let users choose which data source to show
   - Allow customization of which tokens appear
   - Add preferences UI in the app

3. **Enhance UI:**
   - Add token icons/logos
   - Implement loading states
   - Add error states with retry

4. **Advanced Features:**
   - Live Activities for real-time price tracking
   - Interactive widgets (iOS 17+)
   - Lock screen widgets
   - Widget suggestions based on user behavior

## API Reference

See `src/lib/widgetData.ts` for the complete TypeScript API.

### Main Functions

- `updateWidgetData(tokens, dataSource)` - Update widget with new data
- `getWidgetData()` - Get current widget data
- `updateWidgetMarketCap(tokens)` - Helper for market cap data
- `updateWidgetTradingVolume(tokens)` - Helper for trading volume data
- `updateWidgetWatchlist(tokens)` - Helper for watchlist data

### Types

```typescript
interface Token {
  id: string
  symbol: string
  name: string
  price: number
  priceChange24h: number
  iconUrl?: string
}

enum TokenDataSource {
  MarketCap = 'market_cap',
  TradingVolume = 'trading_volume',
  Watchlist = 'watchlist'
}
```

## License

Same as parent project.
