import { Buffer as B } from '@craftzdog/react-native-buffer'

declare global {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  type Buffer = typeof Buffer
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const Buffer: B
}
