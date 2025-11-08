const { withXcodeProject, withPodfile } = require('expo/config-plugins');

/**
 * Config plugin for react-native-attribution-token
 * Ensures AdServices framework is linked and Swift support is enabled
 */
function withAttributionToken(config) {
  // Add AdServices framework to Xcode project
  config = withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;

    // Add AdServices.framework as weak (optional) to support older iOS versions
    if (xcodeProject.addFramework) {
      xcodeProject.addFramework('AdServices.framework', {
        weak: true,
      });
    }

    return config;
  });

  // Ensure Swift support in Podfile (required for the Swift native module)
  config = withPodfile(config, async (config) => {
    const podfile = config.modResults;

    // Add use_frameworks! for Swift support if not already present
    if (!podfile.contents.includes('use_frameworks!')) {
      // Insert after the platform line
      podfile.contents = podfile.contents.replace(
        /(platform :ios, .*)/,
        '$1\n  use_frameworks! :linkage => :static'
      );
    }

    return config;
  });

  return config;
}

module.exports = withAttributionToken;
