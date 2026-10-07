type Verification = { nonce: string; expiresAt: number }
const pending = new Map<string, Verification>()

export const rememberPushVerification = (
  data: Record<string, unknown>,
  now = Date.now(),
): boolean => {
  if (data.type !== 'DEVICE_VERIFICATION') return false
  if (
    typeof data.registrationId !== 'string' ||
    !/^[a-f0-9-]{36}$/.test(data.registrationId) ||
    typeof data.nonce !== 'string' ||
    !/^[a-f0-9]{64}$/.test(data.nonce)
  )
    return true
  for (const [id, value] of pending) if (value.expiresAt <= now) pending.delete(id)
  if (pending.size >= 20 && !pending.has(data.registrationId)) return true
  pending.set(data.registrationId, { nonce: data.nonce, expiresAt: now + 5 * 60_000 })
  return true
}

export const takePushVerification = (id: string, now = Date.now()): string | null => {
  const value = pending.get(id)
  pending.delete(id)
  return value && value.expiresAt > now ? value.nonce : null
}
