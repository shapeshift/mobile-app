# WalletConnect Android Deep Linking Investigation
## Understanding Issue #86: ShapeShift Missing from Android Wallet Selector

**Date**: October 23, 2025
**Issue**: [shapeshift/mobile-app#86](https://github.com/shapeshift/mobile-app/issues/86)
**Status**: Research Complete

---

## Table of Contents
1. [Executive Summary (ELI5)](#executive-summary-eli5)
2. [The Problem](#the-problem)
3. [How WalletConnect Protocol Works](#how-walletconnect-protocol-works)
4. [Wallet Discovery Mechanisms](#wallet-discovery-mechanisms)
5. [Platform Differences: Android vs iOS](#platform-differences-android-vs-ios)
6. [Current ShapeShift Implementation](#current-shapeshift-implementation)
7. [Technical Deep Dive](#technical-deep-dive)
8. [The Solution](#the-solution)

---

## Executive Summary (ELI5)

### What's the Problem?
When users try to connect to a dApp on Android using WalletConnect (specifically with older dApps that haven't upgraded their modal), Android shows a native "Open with" dialog listing wallets that can handle the connection. **ShapeShift doesn't appear in this list**, even though other wallets like Backpack and Jupiter do.

### Why Does This Happen?
Think of it like mail delivery:
- **WalletConnect** is like sending a letter to a wallet
- The letter has a special address format: `wc://...`
- **Android's "Open with" dialog** is like the postal service checking "which apps on this phone can receive mail addressed to `wc://`?"
- **Other wallets** told Android "Hey, we can handle `wc://` addresses!" (via an `intent-filter` in their `AndroidManifest.xml`)
- **ShapeShift** only said "We can handle `shapeshift://` addresses!" but forgot to also register for `wc://`

### Why Is This Android-Only?
- **iOS** uses a different system - it checks the WalletConnect Cloud Registry to show available wallets
- **Newer WalletConnect modals** (Reown/v2 modal) also use the registry on both platforms
- **Older modals on Android** rely on native Android deep linking, which requires the `wc://` intent filter

### The Fix
Add an Android `intent-filter` for the `wc://` scheme so Android knows ShapeShift can handle WalletConnect URIs directly.

---

## The Problem

### User Experience Issue
**Location**: Android Chrome/Firefox browsers
**Scenario**: User visits a dApp (e.g., zapper.xyz, cow.fi) that uses an older WalletConnect modal
**Expected**: ShapeShift appears in the "Open with" dialog
**Actual**: ShapeShift is missing, forcing users to manually copy/paste QR codes

### Affected Scenarios
✅ **Works Fine**:
- iOS (all modals)
- New WalletConnect/Reown modals (Android & iOS)
- Desktop browsers
- Manual QR code scanning

❌ **Broken**:
- Android native "Open with" dialog
- Older WalletConnect modals on Android
- dApps that haven't upgraded to new modal

### Impact
- **UX Degradation**: Users must use the non-intuitive QR code copy/paste flow
- **Discoverability**: ShapeShift isn't visible as a connection option
- **Competitive Disadvantage**: Other wallets appear in the list; ShapeShift doesn't

---

## How WalletConnect Protocol Works

### Architecture Overview
```
┌─────────────┐         ┌───────────────┐         ┌──────────────┐
│   dApp      │────────▶│ Relay Server  │◀────────│  Wallet App  │
│ (Browser)   │         │  (WebSocket)  │         │  (Mobile)    │
└─────────────┘         └───────────────┘         └──────────────┘
                              ▲                           ▲
                              │                           │
                         Encrypted Communication
                         Topic-based routing
```

### Connection Flow

#### 1. **Pairing URI Generation**
The dApp generates a URI containing:
```
wc:7f6e504b...@2?relay-protocol=irn&symKey=587d5484ce2a...
```

**Components**:
- `wc:` - Protocol scheme
- `7f6e504b...` - Topic (unique session identifier)
- `@2` - Version (WalletConnect v2)
- `relay-protocol=irn` - Relay server protocol
- `symKey=...` - Symmetric encryption key

#### 2. **URI Distribution**
The dApp can present this URI via:
- **QR Code** - For desktop → mobile flow
- **Deep Link** - For mobile → mobile flow
- **Universal Link** - For web → app flow

#### 3. **Wallet Opens URI**
The wallet app:
1. Parses the URI
2. Extracts topic, symKey, relay info
3. Establishes WebSocket connection to relay
4. Initiates encrypted session

#### 4. **Session Establishment**
- Wallet sends session approval/rejection
- dApp and wallet exchange account info, supported chains
- Relay server forwards encrypted messages
- Both parties maintain persistent connection

### Key Insight: The Modal is Optional
The WalletConnect modal (that shows wallet options) is **purely UI**. The core protocol works with `showQrModal: false` - you just need to handle the `display_uri` event yourself and build your own deep link.

---

## Wallet Discovery Mechanisms

There are **two completely separate** ways wallets become discoverable:

### 1. WalletConnect Cloud Registry (Online)
**What**: A centralized database of wallets registered with WalletConnect
**URL**: `https://explorer.walletconnect.com/` (now `https://walletguide.walletconnect.network/`)
**API**: `https://explorer-api.walletconnect.com/v3/wallets`

**How It Works**:
1. Wallet developer creates project in [Reown Dashboard](https://cloud.reown.com/)
2. Fills out WalletGuide form with:
   - Wallet name, description
   - Supported chains
   - Platform availability (iOS, Android, desktop, web)
   - Deep link schemes
   - Logo/icon
3. WalletConnect approves and adds to registry
4. dApps query the API to populate their wallet selection modals

**Example API Response**:
```json
{
  "listings": {
    "abc123": {
      "id": "abc123",
      "name": "MetaMask",
      "homepage": "https://metamask.io",
      "image_id": "xyz789",
      "mobile": {
        "native": "metamask://",
        "universal": "https://metamask.app.link"
      },
      "desktop": {
        "native": "metamask://",
        "universal": null
      }
    }
  }
}
```

**ShapeShift Status**:
- ✅ Listed at `https://explorer.walletconnect.com/shapeshift`
- ❌ WalletGuide page returns 404: `https://walletguide.walletconnect.network/shapeshift`
- **Implication**: May need to update/resubmit listing

### 2. Android Intent Filters (Native OS)
**What**: Operating system-level deep link handling
**File**: `android/app/src/main/AndroidManifest.xml`

**How It Works**:
1. App declares supported URI schemes in `<intent-filter>`
2. When user clicks a link (e.g., `wc://...`), Android OS:
   - Scans all installed apps for matching intent filters
   - Shows "Open with" dialog if multiple apps match
   - Opens the app directly if only one matches
3. **This happens entirely offline** - no API calls, no internet required

**Example Intent Filter**:
```xml
<activity android:name=".MainActivity">
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="wc" />
  </intent-filter>
</activity>
```

**Critical Components**:
- `android.intent.action.VIEW` - Allows opening from external sources
- `android.intent.category.BROWSABLE` - Allows opening from browsers
- `android:scheme="wc"` - The URI scheme to handle

**ShapeShift Status**:
- ✅ Has `shapeshift://` scheme registered
- ❌ Missing `wc://` scheme registration
- **Result**: Doesn't appear in Android's "Open with" dialog

---

## Platform Differences: Android vs iOS

### Android Behavior

#### Old WalletConnect Modal
```
User clicks "Connect Wallet"
    ↓
Modal generates wc:// URI
    ↓
Modal tries to open: wc://...
    ↓
Android OS checks: "Which apps handle wc://?"
    ↓
Shows "Open with" dialog
    ↓
User selects wallet
    ↓
Wallet opens with URI
```

**Requirement**: App must have `intent-filter` for `wc://`

#### New Reown Modal
```
User clicks "Connect Wallet"
    ↓
Modal queries WalletConnect Cloud Registry
    ↓
Shows list of registered wallets
    ↓
User selects wallet
    ↓
Modal opens: {wallet-scheme}://wc?uri=wc://...
    ↓
Android opens wallet via custom scheme
```

**Requirement**: Wallet registered in Cloud Registry

### iOS Behavior

#### Both Old and New Modals
```
User clicks "Connect Wallet"
    ↓
Modal queries WalletConnect Cloud Registry
    ↓
Modal checks LSApplicationQueriesSchemes
    ↓
Shows installed + available wallets
    ↓
User selects wallet
    ↓
Opens: {wallet-scheme}://wc?uri=wc://...
```

**Requirements**:
1. Wallet registered in Cloud Registry
2. Wallet scheme listed in dApp's `LSApplicationQueriesSchemes` (for detection)

**Key Difference**: iOS never had the "raw `wc://` scheme" approach - it always used the registry + custom schemes pattern.

### Why This Inconsistency Exists

**Historical Context**:
- WalletConnect v1 (pre-2023): Relied on native deep linking on Android
- WalletConnect v2 (2023+): Introduced Cloud Registry for better UX
- Many dApps haven't updated from v1 modal
- Android OS allows multiple apps to handle the same scheme (hence "Open with" dialog)
- iOS requires explicit scheme declarations in `Info.plist`, making the registry approach necessary from the start

---

## Current ShapeShift Implementation

### Mobile App Architecture
**Type**: React Native Expo app
**Core**: WebView wrapper around `app.shapeshift.com`

```
┌────────────────────────────────────────┐
│      React Native App (Expo)          │
│  ┌──────────────────────────────────┐ │
│  │                                  │ │
│  │    WebView                       │ │
│  │    (app.shapeshift.com)          │ │
│  │                                  │ │
│  └──────────────────────────────────┘ │
│           ▲                            │
│           │ Deep Link Handler          │
│           │ (App.tsx:117-143)          │
└───────────┼────────────────────────────┘
            │
    shapeshift://wc?uri=...
```

### Deep Link Flow

#### Current Implementation (`App.tsx:117-143`)
```typescript
const deepLinkHandler = ({ url }: { url: string }) => {
  if (!url) return
  if (isRunningInExpoGo) return

  // Extract path from URL
  const URL_DELIMITER = url.includes('expo-development-client')
    ? 'shapeshift://expo-development-client/'
    : 'shapeshift://'

  const path = url.split(URL_DELIMITER)[1]
  if (!path) return

  // Navigate WebView to path
  const newUri = `${settings?.EXPO_PUBLIC_SHAPESHIFT_URI}/#/${path}?${Date.now()}`
  setUri(newUri)
}
```

**Example**:
```
Input:  shapeshift://wc?uri=wc://abc123...
            ↓
Extract: wc?uri=wc://abc123...
            ↓
Navigate: https://app.shapeshift.com/#/wc?uri=wc://abc123...
            ↓
WebView: Handles WC connection
```

### Configuration Files

#### `app.json`
```json
{
  "scheme": "shapeshift",
  "android": {
    "package": "com.shapeshift.droid_shapeshift"
  },
  "ios": {
    "bundleIdentifier": "com.shapeShift.shapeShift"
  }
}
```

#### `ios/ShapeShift/Info.plist`
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>shapeshift</string>
      <string>com.shapeShift.shapeShift</string>
    </array>
  </dict>
</array>
```

**Missing**: `LSApplicationQueriesSchemes` for detecting other wallets

#### Android Manifest
Currently generated by Expo - **does not include `wc://` intent filter**

### Web App Implementation

#### WalletConnect v2 Config (`config.ts:86-116`)
```typescript
export const walletConnectV2ProviderConfig: EthereumProviderOptions = {
  projectId: VITE_WALLET_CONNECT_WALLET_PROJECT_ID,
  chains: [1], // Ethereum mainnet required
  optionalChains: [10, 56, 100, 137, 43114, 42161, 42170, 8453],
  optionalMethods: [
    'eth_signTypedData',
    'eth_signTypedData_v4',
    'eth_sign',
    'ethVerifyMessage',
    'eth_accounts',
    'eth_sendTransaction',
    'eth_signTransaction',
  ],
  showQrModal: true,  // Uses WalletConnect's built-in modal
  qrModalOptions: {
    themeVariables: {
      '--wcm-z-index': '2000',
    },
  },
  rpcMap: {
    // RPC endpoints for all supported chains
  },
}
```

#### Connection Flow (`Connect.tsx:25-69`)
```typescript
const pairDevice = useCallback(async () => {
  setLoading(true)
  const adapter = await getAdapter(KeyManager.WalletConnectV2)

  if (adapter) {
    // This triggers the WalletConnect modal
    const wallet = await adapter.pairDevice()

    if (!wallet) throw new WalletNotFoundError()

    // Store wallet in app state
    dispatch({
      type: WalletActions.SET_WALLET,
      payload: { wallet, name, icon, deviceId, connectedType: KeyManager.WalletConnectV2 },
    })
  }
}, [dispatch, getAdapter])
```

**Key Points**:
- Web app uses standard WalletConnect v2 modal with `showQrModal: true`
- Modal handles wallet discovery via Cloud Registry
- Mobile app wraps this web app, so it inherits the same connection logic
- Deep links from Android/iOS open the mobile app → which loads the web app in WebView → which shows the WalletConnect modal

---

## Technical Deep Dive

### Android Intent System

#### How Intent Filters Work
Android uses a **broadcast-style** intent resolution system:

1. **Intent Created**: App/browser creates an intent like `Intent(Intent.ACTION_VIEW, Uri.parse("wc://..."))`
2. **System Query**: Android queries `PackageManager` for all apps with matching intent filters
3. **Resolution**:
   - **0 matches**: Error/nothing happens
   - **1 match**: Opens that app directly
   - **2+ matches**: Shows disambiguation dialog ("Open with")
4. **App Receives**: Winning app receives intent in `onCreate()/onNewIntent()`

#### ShapeShift's Current Intent Filter
Generated by Expo from `app.json`:
```xml
<activity android:name=".MainActivity">
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="shapeshift" />
  </intent-filter>
</activity>
```

**Handles**: `shapeshift://...`
**Doesn't Handle**: `wc://...`

### WalletConnect URI Structure

#### V2 Pairing URI Format
```
wc:7f6e504bfad60b485450578e05678ed3e8e8c4751d3c6160be17160d63ec90f9@2
  ?relay-protocol=irn
  &symKey=587d5484ce2a2a6ee3ba1962fdd7e8588e06200c46823bd18fbd67def96ad303
  &methods=[wc_sessionPropose],[wc_authRequest,wc_authBatchRequest]
  &expiryTimestamp=1705667684
```

**Breakdown**:
- `wc:` - Scheme
- `7f6e504b...` - Topic (64 hex chars)
- `@2` - Version
- `relay-protocol=irn` - Reown's Internet Relay Network
- `symKey=...` - Symmetric encryption key (64 hex chars)
- `methods=...` - Supported RPC methods
- `expiryTimestamp` - Unix timestamp (typically 5 minutes)

#### Deep Link Wrapping
Wallets typically wrap the raw WC URI:
```
metamask://wc?uri=wc://7f6e504b...@2?relay-protocol=irn&symKey=...
           ↑        ↑
         Wallet   Encoded WC URI
         scheme
```

**Why?**
- Android browsers auto-encode URIs, which breaks WC parsing
- Wrapping in a custom scheme prevents encoding issues
- Wallet can extract and decode the original WC URI

### Why Android Browsers Use Native Intent Resolution

#### The Mobile Browser Challenge
Mobile browsers face a UX dilemma:
1. **Security**: Can't directly open apps without user consent
2. **UX**: Need seamless app → browser → app flow
3. **Standard**: Should follow OS conventions

#### Android's Solution
1. Browser sees `<a href="wc://...">Connect</a>`
2. Fires `Intent(ACTION_VIEW, "wc://...")`
3. System shows "Open with" dialog
4. User selects app
5. App opens with URI

**This is why the intent filter matters** - without it, Android doesn't know ShapeShift can handle `wc://` URIs.

### iOS Differences

#### LSApplicationQueriesSchemes
iOS requires explicit declaration to even *check* if a scheme exists:

```xml
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>metamask</string>
  <string>trust</string>
  <string>rainbow</string>
  <string>wc</string>
</array>
```

**Without this**, calling `UIApplication.shared.canOpenURL(URL(string: "wc://...")!)` returns `false` even if an app supports `wc://`.

**This forced WalletConnect** to use the Cloud Registry approach on iOS from the start.

### Real-World Wallet Examples

#### MetaMask (`metamask-mobile` GitHub)
**Issue #5212**: WalletConnect URIs don't connect on Android

**Solution**:
- Use wallet-specific wrapper: `metamask://wc?uri=${wcUri}`
- Extract and decode in app
- Handle URL encoding issues

#### Trust Wallet
**Scheme**: `trust://wc?uri=${wcUri}`
**Android Manifest**: Has both `trust` and `wc` intent filters

#### Zerion
**Scheme**: `zerion://wc?uri=${wcUri}`
**Registry**: Listed in WalletConnect Cloud Explorer

---

## The Solution

### Required Changes

#### 1. Add `wc://` Intent Filter (Android)

**File**: Custom Expo config plugin
**Location**: `plugins/withWalletConnectScheme.js` (new file)

```javascript
const { withAndroidManifest } = require("@expo/config-plugins");

function withWalletConnectScheme(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    // Find MainActivity
    const mainApplication = manifest.application?.find(
      (app) => app.$?.["android:name"] === ".MainApplication"
    );

    const mainActivity = mainApplication?.activity?.find(
      (activity) => activity.$?.["android:name"] === ".MainActivity"
    );

    if (!mainActivity["intent-filter"]) {
      mainActivity["intent-filter"] = [];
    }

    // Add wc:// intent filter
    mainActivity["intent-filter"].push({
      action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
      category: [
        { $: { "android:name": "android.intent.category.DEFAULT" } },
        { $: { "android:name": "android.intent.category.BROWSABLE" } }
      ],
      data: [{ $: { "android:scheme": "wc" } }]
    });

    return config;
  });
}

module.exports = withWalletConnectScheme;
```

**Register Plugin** in `app.json`:
```json
{
  "plugins": [
    ["./plugins/withCustomGradleProperties"],
    ["./plugins/withWalletConnectScheme"]
  ]
}
```

#### 2. Update Deep Link Handler (React Native)

**File**: `src/App.tsx` (lines 117-143)

Add handler for raw `wc://` URIs:
```typescript
const deepLinkHandler = ({ url }: { url: string }) => {
  if (!url) return
  if (isRunningInExpoGo) return

  // Handle native WalletConnect URIs
  if (url.startsWith("wc://")) {
    // Convert wc:// to shapeshift://wc?uri=wc://...
    const encodedUri = encodeURIComponent(url)
    const newUrl = `shapeshift://wc?uri=${encodedUri}`
    return deepLinkHandler({ url: newUrl })
  }

  // Existing logic...
  const URL_DELIMITER = url.includes('expo-development-client')
    ? 'shapeshift://expo-development-client/'
    : 'shapeshift://'

  const path = url.split(URL_DELIMITER)[1]
  if (!path) return

  const newUri = `${settings?.EXPO_PUBLIC_SHAPESHIFT_URI}/#/${path}?${Date.now()}`
  setUri(newUri)
}
```

#### 3. Update iOS LSApplicationQueriesSchemes (Optional but Recommended)

**File**: `ios/ShapeShift/Info.plist`

Add for better iOS detection:
```xml
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>wc</string>
  <string>metamask</string>
  <string>trust</string>
  <string>rainbow</string>
</array>
```

#### 4. Update/Re-register in WalletConnect Cloud

**Action**: Visit [Reown Dashboard](https://cloud.reown.com/)
1. Find ShapeShift project (if exists) or create new
2. Update WalletGuide form:
   - Mobile deep link: `shapeshift://`
   - Supported platforms: iOS, Android
   - Logo/branding
3. Submit for approval

**Why**:
- Currently returns 404 at `walletguide.walletconnect.network/shapeshift`
- Ensures ShapeShift appears in new modals on all platforms

### Testing

#### Local Testing with ADB
```bash
# Rebuild with new intent filter
cd android && ./gradlew clean && cd ..
expo prebuild --clean

# Build and install
eas build --profile development --platform android --local
adb install path/to/build.apk

# Test deep link
adb shell am start -a android.intent.action.VIEW \
  -d "wc://7f6e504b...@2?relay-protocol=irn&symKey=..." \
  com.shapeshift.droid_shapeshift
```

#### Real-World Testing
1. Deploy to ephemeral environment (e.g., `private.shapeshift.com`)
2. Test on physical Android device
3. Visit dApp with old WalletConnect modal (e.g., `zapper.xyz`)
4. Click "Connect Wallet"
5. Verify ShapeShift appears in "Open with" dialog
6. Select ShapeShift
7. Confirm connection completes

**Note**: Deep link testing requires real devices - emulators/simulators don't accurately reflect OS-level intent resolution.

### Expected Result

After implementation:

#### Android Old Modal
```
User clicks "Connect Wallet"
    ↓
Modal generates wc:// URI
    ↓
Browser opens wc://...
    ↓
Android shows "Open with" dialog:
  • MetaMask
  • Trust Wallet
  • ShapeShift ✨ (NEW!)
  • Zerion
    ↓
User selects ShapeShift
    ↓
ShapeShift opens and connects
```

#### All Other Scenarios
No change - continue working as before.

---

## Additional Considerations

### Backward Compatibility
- ✅ Existing `shapeshift://` deep links continue working
- ✅ QR code flow unchanged
- ✅ iOS behavior unchanged
- ✅ New modal behavior unchanged

### Security
- Intent filters are declarative and validated by OS
- No additional permissions required
- WalletConnect's encrypted relay ensures secure communication
- Deep links don't expose sensitive data (only connection metadata)

### Maintenance
- Expo config plugin runs during `expo prebuild`
- Update plugin if Expo/React Native changes manifest structure
- Monitor WalletConnect docs for protocol changes

### Performance
- No runtime overhead (intent resolution is OS-level)
- No additional network requests
- WebView navigation remains the same

---

## References

### Official Documentation
- [WalletConnect v2 Docs](https://docs.reown.com/)
- [WalletConnect Explorer API](https://docs.reown.com/cloud/explorer)
- [Android Deep Linking](https://developer.android.com/training/app-links/deep-linking)
- [Expo Config Plugins](https://docs.expo.dev/modules/config-plugin-and-native-module-tutorial/)

### Related Issues
- [shapeshift/mobile-app#86](https://github.com/shapeshift/mobile-app/issues/86) - This issue
- [shapeshift/mobile-app#85](https://github.com/shapeshift/mobile-app/issues/85) - Deep link support
- [shapeshift/web#10832](https://github.com/shapeshift/web/issues/10832) - Related web issue
- [MetaMask/metamask-mobile#5212](https://github.com/MetaMask/metamask-mobile/issues/5212) - Similar issue

### Code Examples
- [WalletConnect Unity AndroidManifest](https://github.com/WalletConnect/WalletConnectUnity/blob/project/modal-sample/Assets/Plugins/Android/AndroidManifest.xml)
- [KILTprotocol demo-mobile-wallet](https://github.com/KILTprotocol/demo-mobile-wallet/blob/master/android/app/src/debug/AndroidManifest.xml)

---

## Glossary

**dApp**: Decentralized Application - a web app that interacts with blockchain
**Deep Link**: A URL that opens a specific app (e.g., `shapeshift://`)
**Intent Filter**: Android's way of declaring which URLs/actions an app handles
**Relay Server**: WalletConnect's intermediary server for encrypted communication
**Topic**: Unique identifier for a WalletConnect session
**URI**: Uniform Resource Identifier (e.g., `wc://...`)
**WebView**: Embedded browser component in a native app
**Expo**: React Native framework for building cross-platform apps
**Pairing URI**: WalletConnect's connection string containing session metadata

---

**End of Investigation Report**
