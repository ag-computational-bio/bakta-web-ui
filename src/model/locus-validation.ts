// Same rules as Bakta (bakta/config.py and bakta/constants.py). Empty means "not set".
const LOCUS_TAG_COMPLIANT = /^[A-Z][A-Z0-9]{2,11}$/
const LOCUS_TAG_DEFAULT = /^[A-Za-z0-9_.-]{1,24}$/
const LOCUS = /^[A-Za-z0-9_.:*#-]{1,20}$/

export const locusTagHelp = (compliant: boolean) =>
  compliant
    ? 'With INSDC compliant output, use 3 to 12 uppercase letters and digits, starting with a letter.'
    : 'Use 1 to 24 letters, digits and _ - . characters.'

export const locusHelp = 'Use 1 to 20 letters, digits and _ - . : * # characters.'

export function locusTagError(value: string | null | undefined, compliant: boolean): string {
  if (!value) return ''
  return (compliant ? LOCUS_TAG_COMPLIANT : LOCUS_TAG_DEFAULT).test(value)
    ? ''
    : locusTagHelp(compliant)
}

export function locusError(value: string | null | undefined): string {
  if (!value) return ''
  return LOCUS.test(value) ? '' : locusHelp
}
