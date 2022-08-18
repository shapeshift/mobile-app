module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
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
