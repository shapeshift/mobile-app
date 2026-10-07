module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: ['node_modules/(?!((@)?react-native[^/]*|expo)/)'],
  testMatch: ['<rootDir>/src/lib/__tests__/pushVerification.test.ts'],
  transform: { '^.+\\.[jt]sx?$': ['babel-jest', { presets: [require.resolve('babel-preset-expo', { paths: [require.resolve('expo/package.json')] })] }] },
}
