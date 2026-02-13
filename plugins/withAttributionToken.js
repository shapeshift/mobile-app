const { withXcodeProject } = require('expo/config-plugins');

function withAttributionToken(config) {
  config = withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;

    if (xcodeProject.addFramework) {
      xcodeProject.addFramework('AdServices.framework', {
        weak: true,
      });
    }

    return config;
  });

  return config;
}

module.exports = withAttributionToken;
