import bakta_1_10 from './bakta-result-post-1_10.json'
import bakta_1_9 from './bakta-result-1_9.json'
import bakta_pre_1_9 from './bakta-result-pre-1_9.json'
import { parseBaktaData, type Result } from '@/model/result-data'

const oldData = parseBaktaData(bakta_pre_1_9)
const newData = parseBaktaData(bakta_1_10)
const newData_1_9 = parseBaktaData(bakta_1_9)

export const fixtures = {
  result: {
    '<1.9': oldData,
    '1.9': newData_1_9,
    '1.10': newData,
  },
}
export function fixturesFn(v: '<1.9' | '1.9' | '1.10'): Result {
  if (v == '1.10') return parseBaktaData(bakta_1_10)
  if (v == '1.9') return parseBaktaData(bakta_1_9)
  if (v === '<1.9') return parseBaktaData(bakta_pre_1_9)
  throw 'not supported'
}
