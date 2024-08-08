declare module 'react-native-dotenv' {
  /**
   * production environments (uses prod env vars)
   */
  export const SHAPESHIFT_URI: string
  export const SHAPESHIFT_PRIVATE_URI: string
  export const RELEASE_URI: string
  /**
   * shared development environments
   */
  export const DEVELOP_URI: string
  export const YEET_URI: string
  /**
   * ephemeral environments (uses develop env vars)
   */
  export const CAFE_URI: string
  export const BEARD_URI: string
  export const GOME_URI: string
  export const JUICE_URI: string
  export const WOOD_URI: string
  export const NEO_URI: string
  /**
   * chatwoot support widget
   */
  export const CHATWOOT_URI: string

  /**
   * WalletConnect verify URI
   */
  export const WALLETCONNECT_VERIFY_SERVER: string
  /**
   * WalletConnect fallback verify URI
   */
  export const WALLETCONNECT_VERIFY_FALLBACK_SERVER: string
}
