import baktaResult_1_10 from '@/test-data/bakta-result-post-1_10.json'
import baktaResult_1_9 from '@/test-data/bakta-result-1_9.json'
import baktaResult_pre_1_9 from '@/test-data/bakta-result-pre-1_9.json'
import { describe, expect, it } from 'vitest'
import { safeParseResult } from './result-data'

describe('parse bakta result', () => {
  it('should succeed with bakta-pre 1.9 result', async () => {
    const r = safeParseResult(baktaResult_pre_1_9)
    expect(r.success).toBe(true)
  })
  it('should succeed with bakta-pre 1.10 result', async () => {
    const r = safeParseResult(baktaResult_1_10)
    expect(r.success).toBe(true)
  })
  it('should succeed with bakta 1.9 result', async () => {
    const r = safeParseResult(baktaResult_1_9)
    expect(r.success).toBe(true)
  })
})
