import type { BaktaApi } from '@/model/bakta-api'
import { createBaktaService, type BaktaService } from '@/model/bakta-service'

/**
 * A store for global page resources.
 */

let baktaService: BaktaService
export function initBaktaService(api: BaktaApi) {
  baktaService = createBaktaService(api)
}
export function useBaktaService() {
  if (baktaService == undefined) throw 'Bakta service is not initialized'
  return baktaService
}
