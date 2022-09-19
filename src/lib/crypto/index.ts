import { CipherString } from './classes'
import { decryptWallet, makeKey } from './crypto'

type DecryptArgs = {
  email: string
  password: string
  encryptedWallet: string
}

export async function decrypt({
  email,
  password,
  encryptedWallet,
}: DecryptArgs): Promise<string | null> {
  const key = await makeKey(password, email)
  return decryptWallet(new CipherString(encryptedWallet), key)
}
