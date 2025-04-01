const baktaCogColors1: ColorEntry[] = [
  {
    key: 'J',
    color: '#9C382A',
    name: 'Translation, ribosomal structure and biogenesis',
    group: 'INF',
  },
  { key: 'A', color: '#B94231', name: 'RNA processing and modification', group: 'INF' },
  { key: 'K', color: '#CE5240', name: 'Transcription', group: 'INF' },
  { key: 'L', color: '#D66C5D', name: 'Replication, recombination and repair', group: 'INF' },
  { key: 'B', color: '#DE8679', name: 'Chromatin structure and dynamics', group: 'INF' },
  {
    key: 'D',
    color: '#FEE92E',
    name: 'Cell cycle control, cell division, chromosome partitioning',
    group: 'CEL',
  },
  { key: 'Y', color: '#FDE305', name: 'Nuclear structure', group: 'CEL' },
  { key: 'V', color: '#D4BF03', name: 'Defense mechanisms', group: 'CEL' },
  { key: 'T', color: '#AA9903', name: 'Signal transduction mechanisms', group: 'CEL' },
  { key: 'M', color: '#7F7303', name: 'Cell wall/membrane/envelope biogenesis', group: 'CEL' },
  { key: 'N', color: '#554D02', name: 'Cell motility', group: 'CEL' },
  { key: 'Z', color: '#5D6F18', name: 'Cytoskeleton', group: 'CEL' },
  { key: 'W', color: '#7B931F', name: 'Extracellular structures', group: 'CEL' },
  {
    key: 'U',
    color: '#99B726',
    name: 'Intracellular trafficking, secretion, and vesicular transport',
    group: 'CEL',
  },
  {
    key: 'O',
    color: '#B4D631',
    name: 'Posttranslational modification, protein turnover, chaperones',
    group: 'CEL',
  },
  { key: 'X', color: '#C1DE54', name: 'Mobilome: prophages, transposons', group: 'CEL' },
  { key: 'C', color: '#88CBE0', name: 'Energy production and conversion', group: 'MET' },
  { key: 'G', color: '#67BBD7', name: 'Carbohydrate transport and metabolism', group: 'MET' },
  { key: 'E', color: '#46ACCD', name: 'Amino acid transport and metabolism', group: 'MET' },
  { key: 'F', color: '#3296B6', name: 'Nucleotide transport and metabolism', group: 'MET' },
  { key: 'H', color: '#2A7A94', name: 'Coenzyme transport and metabolism', group: 'MET' },
  { key: 'I', color: '#215E72', name: 'Lipid transport and metabolism', group: 'MET' },
  { key: 'P', color: '#664495', name: 'Inorganic ion transport and metabolism', group: 'MET' },
  {
    key: 'Q',
    color: '#7A52B1',
    name: 'Secondary metabolites biosynthesis, transport and catabolism',
    group: 'MET',
  },
  { key: 'R', color: '#B8B5B5', name: 'General function prediction only', group: 'POO' },
  { key: 'S', color: '#DCD9D9', name: 'Function unknown', group: 'POO' },

  { key: 'INF', name: 'INFORMATION STORAGE AND PROCESSING', color: '#FF0000' },
  { key: 'CEL', name: 'CELLULAR PROCESSES AND SIGNALING', color: '#0000FF' },
  { key: 'MET', name: 'METABOLISM', color: '#00FF00' },
  { key: 'POO', name: 'POORLY CHARACTERIZED', color: '#000000' },
]

/** Schema taken from bakta-cli */
const baktaCogColors: ColorEntry[] = [
  {
    key: 'J',
    color: '#a6cee3',
    name: 'Translation, ribosomal structure and biogenesis',
    group: 'INF',
  },
  { key: 'A', color: '#c5000b', name: 'RNA processing and modification', group: 'INF' },
  { key: 'K', color: '#b3de69', name: 'Transcription', group: 'INF' },
  { key: 'L', color: '#80b1d3', name: 'Replication, recombination and repair', group: 'INF' },
  { key: 'B', color: '#6a3d9a', name: 'Chromatin structure and dynamics', group: 'INF' },
  {
    key: 'D',
    color: '#ff7f00',
    name: 'Cell cycle control, cell division, chromosome partitioning',
    group: 'CEL',
  },
  { key: 'Y', color: '#ffff38', name: 'Nuclear structure', group: 'CEL' },
  { key: 'V', color: '#fb9a99', name: 'Defense mechanisms', group: 'CEL' },
  { key: 'T', color: '#fdb462', name: 'Signal transduction mechanisms', group: 'CEL' },
  { key: 'M', color: '#bc80bd', name: 'Cell wall/membrane/envelope biogenesis', group: 'CEL' },
  { key: 'N', color: '#cab2d6', name: 'Cell motility', group: 'CEL' },
  { key: 'Z', color: '#ffff99', name: 'Cytoskeleton', group: 'CEL' },
  { key: 'W', color: '#0084d1', name: 'Extracellular structures', group: 'CEL' },
  {
    key: 'U',
    color: '#fdbf6f',
    name: 'Intracellular trafficking, secretion, and vesicular transport',
    group: 'CEL',
  },
  {
    key: 'O',
    color: '#33a02c',
    name: 'Posttranslational modification, protein turnover, chaperones',
    group: 'CEL',
  },
  { key: 'X', color: '#d9d9d9', name: 'Mobilome: prophages, transposons', group: 'CEL' },
  { key: 'C', color: '#bebada', name: 'Energy production and conversion', group: 'MET' },
  { key: 'G', color: '#fb8072', name: 'Carbohydrate transport and metabolism', group: 'MET' },
  { key: 'E', color: '#ffffb3', name: 'Amino acid transport and metabolism', group: 'MET' },
  { key: 'F', color: '#e31a1c', name: 'Nucleotide transport and metabolism', group: 'MET' },
  { key: 'H', color: '#b2df8a', name: 'Coenzyme transport and metabolism', group: 'MET' },
  { key: 'I', color: '#ccebc5', name: 'Lipid transport and metabolism', group: 'MET' },
  { key: 'P', color: '#fccde5', name: 'Inorganic ion transport and metabolism', group: 'MET' },
  {
    key: 'Q',
    color: '#1f78b4',
    name: 'Secondary metabolites biosynthesis, transport and catabolism',
    group: 'MET',
  },
  { key: 'R', color: '#8dd3c7', name: 'General function prediction only', group: 'POO' },
  { key: 'S', color: '#DDDDDD', name: 'Function unknown', group: 'POO' },

  { key: 'INF', name: 'INFORMATION STORAGE AND PROCESSING', color: '#FF0000' },
  { key: 'CEL', name: 'CELLULAR PROCESSES AND SIGNALING', color: '#0000FF' },
  { key: 'MET', name: 'METABOLISM', color: '#00FF00' },
  { key: 'POO', name: 'POORLY CHARACTERIZED', color: '#000000' },
]

const baktaCogMap = indexColors(baktaCogColors)

// colors taken from https://help.ezbiocloud.net/cog-colors/
const ezBioCogColors: ColorEntry[] = [
  {
    key: 'J',
    color: '#ff0000',
    name: 'Translation, ribosomal structure and biogenesis',
    group: 'INF',
  },
  { key: 'A', color: '#c2af58', name: 'RNA processing and modification', group: 'INF' },
  { key: 'K', color: '#ff9900', name: 'Transcription', group: 'INF' },
  { key: 'L', color: '#ffff00', name: 'Replication, recombination and repair', group: 'INF' },
  { key: 'B', color: '#ffc600', name: 'Chromatin structure and dynamics', group: 'INF' },
  {
    key: 'D',
    color: '#99ff00',
    name: 'Cell cycle control, cell division, chromosome partitioning',
    group: 'CEL',
  },
  { key: 'Y', color: '#493126', name: 'Nuclear structure', group: 'CEL' },
  { key: 'V', color: '#ff008a', name: 'Defense mechanisms', group: 'CEL' },
  { key: 'T', color: '#0000ff', name: 'Signal transduction mechanisms', group: 'CEL' },
  { key: 'M', color: '#9ec928', name: 'Cell wall/membrane/envelope biogenesis', group: 'CEL' },
  { key: 'N', color: '#006633', name: 'Cell motility', group: 'CEL' },
  { key: 'Z', color: '#660099', name: 'Cytoskeleton', group: 'CEL' },
  { key: 'W', color: '#336699', name: 'Extracellular structures', group: 'CEL' },
  {
    key: 'U',
    color: '#33cc99',
    name: 'Intracellular trafficking, secretion, and vesicular transport',
    group: 'CEL',
  },
  {
    key: 'O',
    color: '#00ffff',
    name: 'Posttranslational modification, protein turnover, chaperones',
    group: 'CEL',
  },
  // X is not specified in ezbio, so we added it with a random color
  { key: 'X', color: '#9CFC9C', name: 'Mobilome: prophages, transposons', group: 'CEL' },
  { key: 'C', color: '#9900ff', name: 'Energy production and conversion', group: 'MET' },
  { key: 'G', color: '#805642', name: 'Carbohydrate transport and metabolism', group: 'MET' },
  { key: 'E', color: '#ff00ff', name: 'Amino acid transport and metabolism', group: 'MET' },
  { key: 'F', color: '#99334d', name: 'Nucleotide transport and metabolism', group: 'MET' },
  { key: 'H', color: '#727dcc', name: 'Coenzyme transport and metabolism', group: 'MET' },
  { key: 'I', color: '#5c5a1b', name: 'Lipid transport and metabolism', group: 'MET' },
  { key: 'P', color: '#0099ff', name: 'Inorganic ion transport and metabolism', group: 'MET' },
  {
    key: 'Q',
    color: '#ffcc99',
    name: 'Secondary metabolites biosynthesis, transport and catabolism',
    group: 'MET',
  },
  { key: 'R', color: '#ff9999', name: 'General function prediction only', group: 'POO' },
  { key: 'S', color: '#d6aadf', name: 'Function unknown', group: 'POO' },

  { key: 'INF', name: 'INFORMATION STORAGE AND PROCESSING', color: '#FF0000' },
  { key: 'CEL', name: 'CELLULAR PROCESSES AND SIGNALING', color: '#0000FF' },
  { key: 'MET', name: 'METABOLISM', color: '#00FF00' },
  { key: 'POO', name: 'POORLY CHARACTERIZED', color: '#000000' },
]
export type ColorEntry = {
  key: string
  name: string
  color: string
  group?: string
}
export type ColorIndex = Record<string, { name: string; color: string; class?: string }>

function indexColors(l: ColorEntry[]): ColorIndex {
  const idx: ColorIndex = {}
  for (const e of l) {
    idx[e.key] = { name: e.name, color: e.color, class: e.group }
  }
  return idx
}

const cogMap: ColorIndex = indexColors(ezBioCogColors)

const ncbiCogColors: ColorEntry[] = [
  { key: 'J', name: 'Translation, ribosomal structure and biogenesis', color: '#FCCCFC' },
  { key: 'A', name: 'RNA processing and modification', color: '#FCDCFC' },
  { key: 'K', name: 'Transcription', color: '#FCDCEC' },
  { key: 'L', name: 'Replication, recombination and repair', color: '#FCDCDC' },
  { key: 'B', name: 'Chromatin structure and dynamics', color: '#FCDCCC' },
  {
    key: 'D',
    name: 'Cell cycle control, cell division, chromosome partitioning',
    color: '#FCFCDC',
  },
  { key: 'Y', name: 'Nuclear structure', color: '#FCFCCC' },
  { key: 'V', name: 'Defense mechanisms', color: '#FCFCBC' },
  { key: 'T', name: 'Signal transduction mechanisms', color: '#FCFCAC' },
  { key: 'M', name: 'Cell wall/membrane/envelope biogenesis', color: '#ECFCAC' },
  { key: 'N', name: 'Cell motility', color: '#DCFCAC' },
  { key: 'Z', name: 'Cytoskeleton', color: '#CCFCAC' },
  { key: 'W', name: 'Extracellular structures', color: '#BCFCAC' },
  {
    key: 'U',
    name: 'Intracellular trafficking, secretion, and vesicular transport',
    color: '#ACFCAC',
  },
  {
    key: 'O',
    name: 'Posttranslational modification, protein turnover, chaperones',
    color: '#9CFCAC',
  },
  { key: 'X', name: 'Mobilome: prophages, transposons', color: '#9CFC9C' },
  { key: 'C', name: 'Energy production and conversion', color: '#BCFCFC' },
  { key: 'G', name: 'Carbohydrate transport and metabolism', color: '#CCFCFC' },
  { key: 'E', name: 'Amino acid transport and metabolism', color: '#DCFCFC' },
  { key: 'F', name: 'Nucleotide transport and metabolism', color: '#DCECFC' },
  { key: 'H', name: 'Coenzyme transport and metabolism', color: '#DCDCFC' },
  { key: 'I', name: 'Lipid transport and metabolism', color: '#DCCCFC' },
  { key: 'P', name: 'Inorganic ion transport and metabolism', color: '#CCCCFC' },
  {
    key: 'Q',
    name: 'Secondary metabolites biosynthesis, transport and catabolism',
    color: '#BCCCFC',
  },
  { key: 'R', name: 'General function prediction only', color: '#E0E0E0' },
  { key: 'S', name: 'Function unknown', color: '#CCCCCC' },
]

// taken from https://ftp.ncbi.nih.gov/pub/COG/COG2020/data/fun-20.tab
const ncbiCogMap: ColorIndex = indexColors(ncbiCogColors)

function lookupCogColor(coglist: string[], colorMap = baktaCogMap) {
  if (coglist.length > 0) {
    return coglist.map((x) => {
      if (colorMap[x] && colorMap[x].color) return colorMap[x].color
      return colorMap['S'].color
    })[0]
  } else {
    return colorMap['S'].color
  }
}

function lookupCogGroupColor(coglist: string[]) {
  if (coglist.length > 0) {
    return coglist.map((x) => {
      if (cogMap[x]) {
        const c = cogMap[x].class
        if (c && cogMap[c]) return cogMap[c].color
      }
      return cogMap['POO'].color
    })[0]
  } else {
    return cogMap['POO'].color
  }
}

function lookupCogLabels(coglist: string[]) {
  return coglist
    .filter((x) => x)
    .map((x) => {
      let label = ''
      if (cogMap[x] && cogMap[x].name) label = cogMap[x].name
      return x + ' - ' + label
    })
}

export default {
  cogMap,
  ncbiCogMap,
  lookupCogColor,
  lookupCogGroupColor,
  lookupCogLabels,
  ncbiCogColors,
  ezBioCogColors,
  baktaCogColors,
}
