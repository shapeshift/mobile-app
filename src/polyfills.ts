// Buffer polyfill for Solana libraries. Imported first from index.js so the global
// exists before any module that reads it is evaluated.
import { Buffer } from 'buffer'

declare global {
  // eslint-disable-next-line no-var
  var Buffer: typeof import('buffer').Buffer
}

globalThis.Buffer = Buffer
