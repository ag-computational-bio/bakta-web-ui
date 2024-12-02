import bakta_1_10 from './bakta-result-post-1_10.json'
import bakta_pre_1_10 from './bakta-result-pre-1_10.json'
import { parseBaktaData } from '@/model/result-data'

const oldData = parseBaktaData(bakta_pre_1_10)
const newData = parseBaktaData(bakta_1_10)

export const fixtures = {
  result: {
    '<1.10': oldData,
    '1.10': newData,
  },
}
