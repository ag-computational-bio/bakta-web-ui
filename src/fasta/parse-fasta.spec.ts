import { describe, it, expect } from 'vitest'
import { parseFasta } from './parse-fasta'

describe('parse-fasta', () => {
  it('should parse one sequence', () => {
    expect(parseFasta('>123\natcg\n')).to.deep.equal([
      { id: '123', header: '>123', sequence: 'atcg' },
    ])
  })
  it('should parse multiple sequences', () => {
    expect(parseFasta('>123\natcg\n>234\nattc')).to.deep.equal([
      { id: '123', header: '>123', sequence: 'atcg' },
      { id: '234', header: '>234', sequence: 'attc' },
    ])
  })
  it('should parse multiline sequences', () => {
    expect(parseFasta('>123\natcg\nggn\n>234\nattc\naaa')).to.deep.equal([
      { id: '123', header: '>123', sequence: 'atcgggn' },
      { id: '234', header: '>234', sequence: 'attcaaa' },
    ])
  })
  it('should split the header correctly', () => {
    const h =
      '>SAMN03083368.contig00001 len=83359 cov=28.6 corr=0 origname=NODE_1_length_83359_cov_28.552026_pilon sw=shovill-spades/1.0.4 date=20190221'
    const expectedId = 'SAMN03083368.contig00001'
    expect(parseFasta(`${h}\naaa`)).to.deep.equal([{ id: expectedId, header: h, sequence: 'aaa' }])
  })
  it('should fail with no fasta file', () => {
    expect(() => parseFasta(`aaa`)).toThrowError()
  })
  it('should support windows linebreaks', () => {
    expect(parseFasta(`>123\n\raaa`)).to.deep.equal([
      { id: '123', header: '>123', sequence: 'aaa' },
    ])
  })
  it('should support ancient mac os linebreaks', () => {
    expect(parseFasta(`>123\raaa`)).to.deep.equal([{ id: '123', header: '>123', sequence: 'aaa' }])
  })
})
