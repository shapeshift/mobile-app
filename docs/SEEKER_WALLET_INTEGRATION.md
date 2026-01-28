# Seeker Wallet Integration - Mobile App

## Overview

This document describes how Seeker wallet (Solana Mobile's MWA protocol) is integrated into the ShapeShift mobile app.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    useSeekerWallet Hook                 │ │
│  │  - Registers message handlers                          │ │
│  │  - Tracks authorization state                          │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────▼───────────────────────────────┐ │
│  │                 SeekerWalletManager                     │ │
│  │  - authorize() -> Opens Seeker wallet UI               │ │
│  │  - signTransaction() -> Signs via MWA                  │ │
│  │  - signAndSendTransaction() -> Signs & sends via MWA   │ │
│  │  - deauthorize() -> Revokes authorization              │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────▼───────────────────────────────┐ │
│  │              MessageManager                             │ │
│  │  - Handles postMessage from WebView                    │ │
│  │  - Routes to appropriate handlers                       │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           │                                  │
├───────────────────────────▼──────────────────────────────────┤
│                       WebView                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Web App                                                │ │
│  │  - Calls seekerCheckAvailability to detect Seeker      │ │
│  │  - Calls seekerAuthorize to connect                    │ │
│  │  - Calls seekerSignTransaction for signing             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼ (Android Intent via MWA)
              ┌─────────────────────┐
              │  Seeker Seed Vault  │
              │  (Built-in Wallet)  │
              └─────────────────────┘
```

## Message Handlers

The following message handlers are available for the WebView:

### `seekerCheckAvailability`
Check if Seeker/MWA wallet is available on this device.

**Request:** `{ cmd: 'seekerCheckAvailability' }`
**Response:** `{ available: boolean }`

### `seekerAuthorize`
Request authorization from Seeker wallet. Opens wallet UI for user approval.

**Request:** `{ cmd: 'seekerAuthorize', cluster?: 'mainnet-beta' | 'devnet' | 'testnet' }`
**Response:** `{ success: boolean, address?: string, label?: string, error?: string }`

### `seekerDeauthorize`
Revoke authorization from Seeker wallet.

**Request:** `{ cmd: 'seekerDeauthorize' }`
**Response:** `{ success: boolean, error?: string }`

### `seekerGetAddress`
Get the authorized Solana address.

**Request:** `{ cmd: 'seekerGetAddress' }`
**Response:** `{ address: string | null }`

### `seekerGetStatus`
Get the current Seeker wallet status.

**Request:** `{ cmd: 'seekerGetStatus' }`
**Response:** `{ available: boolean, isAuthorized: boolean, address: string | null }`

### `seekerSignTransaction`
Sign a transaction via Seeker wallet.

**Request:** `{ cmd: 'seekerSignTransaction', transaction: string }` (base64 encoded)
**Response:** `{ success: boolean, signedTransaction?: string, error?: string }`

### `seekerSignAndSendTransaction`
Sign and send a transaction via Seeker wallet.

**Request:** `{ cmd: 'seekerSignAndSendTransaction', transaction: string }` (base64 encoded)
**Response:** `{ success: boolean, signature?: string, error?: string }`

## Key Differences from Regular Wallet

| Aspect | Regular Mobile Wallet | Seeker Wallet |
|--------|----------------------|---------------|
| Key Storage | Mnemonic in expo-secure-store | Seeker's Seed Vault |
| Key Access | App has mnemonic | App NEVER has keys |
| Signing | Local with hdwallet-native | Via MWA to Seed Vault |
| Chains | Multi-chain | Solana only |

## Web App Integration

The web app needs to:

1. **Detect Seeker availability:**
```typescript
const checkSeeker = async () => {
  const result = await postMessage({ cmd: 'seekerCheckAvailability' })
  return result.available
}
```

2. **Add Seeker as a wallet option:**
- Show Seeker in wallet list only if available
- Use dedicated Connect component for Seeker authorization

3. **Create hdwallet adapter that proxies to mobile:**
- `hdwallet-seeker-mobile` (new package)
- Uses postMessage for all operations
- No direct MWA dependency (that's in mobile app)

## Files Added

- `src/lib/SeekerWalletManager.ts` - Core MWA integration
- `src/lib/getSeekerWalletManager.ts` - Singleton getter
- `src/hooks/useSeekerWallet.tsx` - Message handler registration
- `docs/SEEKER_WALLET_INTEGRATION.md` - This documentation

## Dependencies Added

```json
{
  "@solana-mobile/mobile-wallet-adapter-protocol-web3js": "^2.1.0",
  "@solana/web3.js": "^1.95.8"
}
```

## Testing

1. Build the mobile app for Android (Seeker is Android-only)
2. Install on a Seeker device or emulator with MWA-compatible wallet
3. Open the app and check console for Seeker availability
4. Test authorization flow via web app
5. Test transaction signing

## Security Considerations

- Authorization token is cached in memory (not persisted)
- Private keys NEVER leave Seeker's Seed Vault
- All signing requires user approval in Seeker wallet UI
- Session ends when app is closed
