// Based on https://github.com/expo/config-plugins/issues/123#issuecomment-1746757954
// and https://docs.reown.com/appkit/react-native/core/installation#android

const {
  withAndroidManifest,
  createRunOncePlugin,
} = require("expo/config-plugins");

/**
 * Expo config plugin to add wallet package queries to AndroidManifest.xml
 * This allows the app to detect which wallet apps are installed on Android 11+
 * and enables deep linking to those wallets for WalletConnect functionality.
 *
 * These package names match the iOS LSApplicationQueriesSchemes in app.json:
 * metamask, trust, zerion, rainbow, ledgerlive, cbwallet, phantom, argent,
 * imtoken, spot, omni, onto, safe, tokenpocket, exodus
 */

const walletQueries = {
  package: [
    // MetaMask
    { $: { "android:name": "io.metamask" } },

    // Trust Wallet
    { $: { "android:name": "com.wallet.crypto.trustapp" } },

    // Zerion
    { $: { "android:name": "io.zerion.android" } },

    // Rainbow
    { $: { "android:name": "me.rainbow" } },

    // Ledger Live
    { $: { "android:name": "com.ledger.live" } },

    // Coinbase Wallet (cbwallet)
    { $: { "android:name": "org.toshi" } },

    // Phantom
    { $: { "android:name": "app.phantom" } },

    // Argent (Ready)
    { $: { "android:name": "im.argent.contractwalletclient" } },

    // imToken
    { $: { "android:name": "im.token.app" } },

    // Spot
    { $: { "android:name": "com.spot.spot" } },

    // Omni (formerly Steak Wallet)
    { $: { "android:name": "fi.steakwallet.app" } },

    // ONTO
    { $: { "android:name": "com.github.ontio.onto" } },

    // Safe (Gnosis Safe)
    { $: { "android:name": "io.gnosis.safe" } },

    // TokenPocket
    { $: { "android:name": "vip.mytokenpocket" } },

    // Exodus
    { $: { "android:name": "exodusmovement.exodus" } },
  ],
};

/**
 * @param {import('@expo/config-plugins').ExportedConfig} config
 */
const withWalletQueriesManifest = (config) => {
  return withAndroidManifest(config, (config) => {
    const { manifest } = config.modResults;

    // Add queries section to manifest
    if (!manifest.queries) {
      manifest.queries = [walletQueries];
    } else {
      // Merge with existing queries if they exist
      if (!manifest.queries[0].package) {
        manifest.queries[0].package = [];
      }
      manifest.queries[0].package.push(...walletQueries.package);
    }

    return config;
  });
};

module.exports = createRunOncePlugin(
  withWalletQueriesManifest,
  "withWalletQueriesManifest",
  "1.0.0"
);
