module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    // @see https://github.com/facebook/react-native/issues/29084
    ['@babel/plugin-transform-flow-strip-types', { loose: true }],
    [
      'module:react-native-dotenv',
      {
        moduleName: 'react-native-dotenv',
        allowUndefined: false,
      },
    ],
  ],
}
