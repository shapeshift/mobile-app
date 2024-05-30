import { Buffer as B } from '@craftzdog/react-native-buffer'

declare global {
  // @ts-ignore
  type Buffer = typeof Buffer
  // @ts-ignore
  const Buffer: B
}
