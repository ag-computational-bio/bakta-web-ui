import { ref, type Ref } from 'vue'

type PollingControl = {
  /**
   * Indicates whether polling is active or not.
   */
  polling: Ref<boolean>
  /**
   * Starts the polling.
   * @returns
   */
  start: () => void
  /**
   * Cancels the polling if it is running.
   * @returns
   */
  cancel: () => void
}

/**
 * Polls a function until the stop condition is true.
 *
 * @param pollFn The function to call in each poll step.
 * @param stopCondition The function that checks if polling can end, based on the result of the pollFn.
 * @param pollInterval The time between each poll in milliseconds.
 * @returns Control mechanisms for polling (start, cancel, status).
 */
export function usePollManager<T>(
  pollFn: () => Promise<T>,
  stopCondition: (d: T) => boolean,
  pollInterval: number,
): PollingControl {
  const polling = ref(false)
  let timer: number | undefined
  const fn = () => {
    pollFn().then((x) => {
      if (stopCondition(x)) cancel()
    })
  }

  const start = () => {
    polling.value = true
    timer = window.setInterval(fn, pollInterval)
    window.setTimeout(fn)
  }

  const cancel = () => {
    if (timer != undefined) {
      clearInterval(timer)
      timer = undefined
      polling.value = false
    }
  }
  return { polling, start, cancel }
}
