import { Buffer as B } from '@craftzdog/react-native-buffer'

declare global {
  type Buffer = typeof Buffer
  const Buffer: B
}
