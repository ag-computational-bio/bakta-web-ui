const iupac_dna = "acgtmrwsykvhdbn".split("");

const dna_alphabet = new Set([
  ...iupac_dna,
  ...iupac_dna.map((x) => x.toUpperCase()),
]);

function validateDnaSequence(entry) {
  const seq = entry.seq;
  for (let i = 0; i < seq.length; i++) {
    const char = seq[i];
    if (!dna_alphabet.has(char)) {
      return {
        valid: false,
        message: `Invalid dna character '${char}' at position '${i}' in sequence '${entry.name}'`,
      };
    }
  }
  return { valid: true, message: "Valid dna sequence" };
}

function validateDnaSequences(entries) {
  return entries.map((x) => validateDnaSequence(x));
}

function validateDna(entries) {
  const valid = validateDnaSequences(entries).reduce(
    (acc, x) => {
      if (!x.valid) {
        acc.valid = false;
        acc.messages.push(x.message);
      }
      return acc;
    },
    {
      valid: true,
      messages: [],
    }
  );
  return valid;
}

export { validateDna, validateDnaSequence, validateDnaSequences };
