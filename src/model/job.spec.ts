import { describe, expect, it } from 'vitest'
import { listDownloadResultFiles } from './job'

describe('listDownloadResultFiles', () => {
  it('keeps json downloads when optional files are blank', () => {
    expect(
      listDownloadResultFiles({
        JSON: ' /results.json ',
        TSV: '',
        FAA: '   ',
        TXTLogs: '/summary.txt',
      }),
    ).toEqual([{ key: 'JSON', url: '/results.json' }])
  })

  it('returns no downloads when only logs are available', () => {
    expect(listDownloadResultFiles({ TXTLogs: '/summary.txt' })).toEqual([])
  })
})
