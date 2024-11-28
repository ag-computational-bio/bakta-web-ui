import type { BaktaService } from '@/model/bakta-service'

/**
 * A store for global page resources.
 */

let baktaService: BaktaService
export function initBaktaService() {}
export function useBaktaService() {
  if (baktaService == undefined) throw 'Bakta service is not initialized'
  return baktaService
}
