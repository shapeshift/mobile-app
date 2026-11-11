// The package's own typings pull in @types/node, which clashes with the Buffer global in
// src/polyfills.ts. Declare only the WHATWG URL fields the navigation filter reads.
declare module 'react-native-url-polyfill/js/URL' {
  export class URL {
    constructor(url: string, base?: string)
    readonly origin: string
    readonly protocol: string
    readonly username: string
    readonly password: string
    readonly hostname: string
    readonly port: string
  }
}
