module.exports = {
  root: true,
  extends: [
    '@react-native-community',
    'eslint:recommended',
    'prettier',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jest/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['react-native', 'prettier', '@typescript-eslint', 'jest'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    'no-sequences': 'off',
    'no-void': 'off'
  },
}
