import baktaResult_post_1_10 from '@/test-data/bakta-result-post-1_10.json'
import baktaResult_pre_1_10 from '@/test-data/bakta-result-pre-1_10.json'
import { describe, expect, it } from 'vitest'
import { safeParseResult } from './result-data'

describe('parse bakta result', () => {
  it('should suceed with bakta-pre 1.10 result', async () => {
    const r = safeParseResult(baktaResult_pre_1_10)
    expect(r.success).toBe(true)
  })
  it('should suceed with bakta-pre 1.10 result', async () => {
    const r = safeParseResult(baktaResult_post_1_10)
    console.log(r.error?.errors)
    expect(r.success).toBe(true)
  })
  it('should suceed with bakta-pre 1.10 result', async () => {
    const r = safeParseResult(baktaResult_pre_1_10)
    expect(r.success).toBe(true)
  })
})
