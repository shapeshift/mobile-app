module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    // @see https://github.com/facebook/react-native/issues/29084
    ['@babel/plugin-transform-flow-strip-types', { loose: true }],
    ['@babel/plugin-proposal-private-methods', { loose: true }],
    [
      'module:react-native-dotenv',
      {
        moduleName: 'react-native-dotenv',
        allowUndefined: false,
      },
    ],
  ],
}
