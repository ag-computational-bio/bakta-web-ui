
/**
 * Reads the body of a response and publishes progress.
 * 
 * @param {*} response 
 * @param {*} handleProgress 
 * @param {*} handleDone 
 * @returns 
 */
function notifyReadProgress(response, handleProgress = function () { }, handleDone = function () { }) {
    let pos = 0;
    const total = response.headers.get("Content-Length");
    const reader = response.body.getReader();

    return new ReadableStream({
        start(controller) {
            return pump();
            function pump() {
                return reader.read().then(({ done, value }) => {
                    pos += value.length
                    const percentage = pos / total
                    handleProgress(percentage)
                    // When no more data needs to be consumed, close the stream
                    if (done) {
                        handleDone()
                        controller.close();
                        return;
                    }
                    // Enqueue the next data chunk into our target stream
                    controller.enqueue(value);
                    // lj: for some reason the done variable was never set to true, so I use
                    //     100% data transfered as a fallback close criterion
                    if (percentage == 1) {
                        handleDone()
                        controller.close();
                        return;
                    }
                    return pump();
                });
            }
        }
    })
}

export default notifyReadProgress