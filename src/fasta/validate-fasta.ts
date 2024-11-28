import type { Seq } from './parse-fasta'

const iupac_dna = 'acgtmrwsykvhdbn'.split('')

const dna_alphabet = new Set([...iupac_dna, ...iupac_dna.map((x) => x.toUpperCase())])

export type Validation = {
  valid: boolean
  message: string
}

export type ValidationSummary = {
  valid: boolean
  messages: string[]
}

function validateDnaSequence(entry: Seq): Validation {
  const seq = entry.sequence
  for (let i = 0; i < seq.length; i++) {
    const char = seq[i]
    if (!dna_alphabet.has(char)) {
      return {
        valid: false,
        message: `Invalid dna character '${char}' at position '${i}' in sequence '${entry.id}'`,
      }
    }
  }
  return { valid: true, message: 'Valid dna sequence' }
}

function validateDnaSequences(entries: Seq[]): Validation[] {
  return entries.map((x) => validateDnaSequence(x))
}

function validateDna(entries: Seq[]): ValidationSummary {
  const valid = validateDnaSequences(entries).reduce(
    (acc: ValidationSummary, x: Validation) => {
      if (!x.valid) {
        acc.valid = false
        acc.messages.push(x.message)
      }
      return acc
    },
    {
      valid: true,
      messages: [],
    },
  )
  return valid
}

export { validateDna, validateDnaSequence, validateDnaSequences }
