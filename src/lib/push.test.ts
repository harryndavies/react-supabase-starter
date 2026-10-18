import { describe, expect, it } from 'vitest'
import { keyBytes } from './push'

describe('keyBytes', () => {
  it('decodes unpadded base64url, as VAPID keys are written', () => {
    // "hi?" is aGk_ in base64url (aGk/ in base64).
    expect(Array.from(keyBytes('aGk_'))).toEqual([104, 105, 63])
    expect(Array.from(keyBytes('aGk'))).toEqual([104, 105])
  })
})
