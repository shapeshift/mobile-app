const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Expo config plugin to add WalletConnect (wc://) scheme support
 * This allows ShapeShift to appear in Android's "Open with" dialog
 * when users try to connect via WalletConnect from dApps
 */
function withWalletConnectScheme(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    // Find MainActivity
    const mainApplication = manifest.application?.find(
      (app) => app.$?.["android:name"] === ".MainApplication"
    );

    if (!mainApplication) {
      console.warn("⚠️  MainApplication not found in AndroidManifest");
      return config;
    }

    const mainActivity = mainApplication?.activity?.find(
      (activity) => activity.$?.["android:name"] === ".MainActivity"
    );

    if (!mainActivity) {
      console.warn("⚠️  MainActivity not found in AndroidManifest");
      return config;
    }

    // Ensure intent-filter array exists
    if (!mainActivity["intent-filter"]) {
      mainActivity["intent-filter"] = [];
    }

    // Check if wc:// intent filter already exists (avoid duplicates)
    const existingWcFilter = mainActivity["intent-filter"].some(filter => {
      const data = filter.data;
      if (Array.isArray(data)) {
        return data.some(d => d.$?.["android:scheme"] === "wc");
      }
      return data?.$?.["android:scheme"] === "wc";
    });

    if (existingWcFilter) {
      console.log("✅ wc:// intent filter already exists, skipping...");
      return config;
    }

    // Add wc:// intent filter for WalletConnect deep links
    mainActivity["intent-filter"].push({
      action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
      category: [
        { $: { "android:name": "android.intent.category.DEFAULT" } },
        { $: { "android:name": "android.intent.category.BROWSABLE" } }
      ],
      data: [{ $: { "android:scheme": "wc" } }]
    });

    console.log("✅ Added wc:// intent filter to AndroidManifest");
    return config;
  });
}

module.exports = withWalletConnectScheme;
