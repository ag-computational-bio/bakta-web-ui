import bakta_1_10 from './bakta-result-post-1_10.json'
import bakta_1_9 from './bakta-result-post-1_10.json'
import bakta_pre_1_9 from './bakta-result-pre-1_9.json'
import { parseBaktaData } from '@/model/result-data'

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
