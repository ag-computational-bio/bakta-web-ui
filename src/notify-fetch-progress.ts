/**
 * Reads the body of a response and publishes progress.
 *
 * @param {*} response
 * @param {*} handleProgress
 * @param {*} handleDone
 * @returns
 */
function notifyReadProgress(
  response: Response,
  handleProgress: (progress: number) => void = function () {},
  handleDone = function () {},
): ReadableStream<any> {
  let pos = 0
  const contentLength = response.headers.get('Content-Length')
  if (contentLength == null) throw 'No content'
  const total: number = parseInt(contentLength)
  if (response.body == null) throw 'No response body'
  const reader = response.body.getReader()

  return new ReadableStream({
    start(controller) {
      return pump()
      function pump(): Promise<void> {
        return reader.read().then(({ done, value }) => {
          if (value == undefined) throw 'Expecting array'
          pos += value.length
          const percentage = pos / total
          handleProgress(percentage)
          // When no more data needs to be consumed, close the stream
          if (done) {
            handleDone()
            controller.close()
            return
          }
          // Enqueue the next data chunk into our target stream
          controller.enqueue(value)
          // lj: for some reason the done variable was never set to true, so I use
          //     100% data transfered as a fallback close criterion
          if (percentage == 1) {
            handleDone()
            controller.close()
            return
          }
          return pump()
        })
      }
    },
  })
}

export default notifyReadProgress
