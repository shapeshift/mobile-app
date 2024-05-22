const { withAndroidStyles } = require('expo/config-plugins');

// We need to avoid the prebuild script to override our own theme (ref: https://github.com/expo/expo/issues/19563)
// Also we need to have both app.config.js and app.json because importing a js file in index.js cause an error with nodejs modules
function withCustomAppTheme(config) {
  return withAndroidStyles(config, (config) => {
    let foundCustomTheme = false;
    const styles = config.modResults;
    styles.resources.style.map((style) => {
      if (style.$.name === 'AppTheme') {
        if (!foundCustomTheme) {
          foundCustomTheme = true;
        } else {
          styles.resources.style.splice(
            styles.resources.style.indexOf(style),
            1
          );
        }
      }
    });
    return config;
  });
}

export default ({ config }) => {
  return withCustomAppTheme(config);
};
