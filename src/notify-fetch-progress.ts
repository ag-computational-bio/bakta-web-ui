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
          // When no more data needs to be consumed, close the stream
          if (done) {
            handleProgress(1)
            handleDone()
            controller.close()
            return
          }
          if (value == undefined) throw 'Expecting array'
          pos += value.length
          const percentage = pos / total
          handleProgress(percentage)
          // Enqueue the next data chunk into our target stream
          controller.enqueue(value)
          return pump()
        })
      }
    },
  })
}

export default notifyReadProgress
