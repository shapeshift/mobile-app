import Foundation

/// Maps CoinGecko token IDs to CAIP-10 identifiers for deep linking
class CaipMapping {
    static let shared = CaipMapping()

    private init() {}

    // Map of CoinGecko ID -> CAIP identifier
    private let mappings: [String: String] = [
        // Major chains native tokens
        "bitcoin": "bip122:000000000019d6689c085ae165831e93/slip44:0",
        "ethereum": "eip155:1/slip44:60",
        "solana": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501",
        "binancecoin": "bip122:000000000019d6689c085ae165831e93/slip44:714",
        "cardano": "bip122:1a3be38bcbb7911969283716ad7799d33e5e6c3e/slip44:1815",
        "avalanche-2": "eip155:43114/slip44:9000",
        "polygon": "eip155:137/slip44:966",
        "polkadot": "polkadot:91b171bb158e2d3848fa23a9f1c25182/slip44:354",
        "dogecoin": "bip122:1a91e3dace36e2be3bf030a65679fe82/slip44:3",
        "litecoin": "bip122:12a765e31ffd4059bada1e25190f6e98/slip44:2",
        "cosmos": "cosmos:cosmoshub-4/slip44:118",

        // ERC20 tokens on Ethereum mainnet
        "tether": "eip155:1/erc20:0xdac17f958d2ee523a2206206994597c13d831ec7",
        "usd-coin": "eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "binance-usd": "eip155:1/erc20:0x4fabb145d64652a948d72533023f6e7a623c7c53",
        "dai": "eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f",
        "wrapped-bitcoin": "eip155:1/erc20:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        "chainlink": "eip155:1/erc20:0x514910771af9ca656af840dff83e8264ecf986ca",
        "uniswap": "eip155:1/erc20:0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
        "shiba-inu": "eip155:1/erc20:0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce",
        "aave": "eip155:1/erc20:0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
        "maker": "eip155:1/erc20:0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
        "compound-governance-token": "eip155:1/erc20:0xc00e94cb662c3520282e6f5717214004a7f26888",
        "the-graph": "eip155:1/erc20:0xc944e90c64b2c07662a292be6244bdf05cda44a7",
        "curve-dao-token": "eip155:1/erc20:0xd533a949740bb3306d119cc777fa900ba034cd52",
        "synthetix-network-token": "eip155:1/erc20:0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f",
        "yearn-finance": "eip155:1/erc20:0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e",
        "1inch": "eip155:1/erc20:0x111111111117dc0aa78b770fa6a738034120c302",
        "matic-network": "eip155:1/erc20:0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
    ]

    /// Get CAIP identifier for a CoinGecko token ID
    /// Returns nil if no mapping exists
    func getCaipId(forCoinGeckoId coinGeckoId: String) -> String? {
        return mappings[coinGeckoId.lowercased()]
    }

    /// Construct ShapeShift asset URL from CAIP identifier
    func getShapeShiftUrl(forCoinGeckoId coinGeckoId: String) -> String? {
        guard let caipId = getCaipId(forCoinGeckoId: coinGeckoId) else {
            return nil
        }
        return "shapeshift://assets/\(caipId)"
    }

    /// Get a fallback URL that opens the assets page without specific token
    func getFallbackUrl() -> String {
        return "shapeshift://assets"
    }
}
