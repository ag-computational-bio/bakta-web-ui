export type Seq = {
  header: string
  id: string
  sequence: string
}
export type SequenceInput = {
  sequence: string
  parsed: Seq[]
  name: string
}

export function parseFasta(input: string): Seq[] {
  const lines = input.split(/\n|\r|\n\r/)
  const seqs: Seq[] = []
  for (const l of lines) {
    if (l.startsWith('>')) {
      seqs.push({ header: '', id: '', sequence: '' })
      const cur = seqs[seqs.length - 1]
      cur.header = l
      const s = cur.header.split(/\s/, 2)
      cur.id = s[0].substring(1)
    } else {
      if (seqs.length == 0) throw 'No fasta header found'
      const cur = seqs[seqs.length - 1]
      cur.sequence = cur.sequence + l
    }
  }
  return seqs
}
