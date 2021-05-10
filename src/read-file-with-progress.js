import pako from "pako"

/**
 * Detects if a file contains gzip content and decompresses it. If a file is not a gzip file, it is read without decompression.
 * 
 * @param {*} file 
 * @param {*} progressHandler An optional handler to obtains progress event (numbers from 0 to 1)
 * @returns A promise with the content as a Buffer.
 */
function read_gzip_file(file, progressHandler) {
    return new Promise((r, e) => {
        let isGzip = undefined;
        const inflate = new pako.Inflate();
        const chunks = [];

        const chunkSize = 1024 * 100;
        let offset = 0;
        let reader = new FileReader();

        // process chunks
        reader.onload = function () {
            if (isGzip == undefined) {
                const array = new Uint8Array(reader.result.slice(0, 2));
                if (array[0] == 0x1f && array[1] == 0x8b) {
                    isGzip = true;
                } else {
                    isGzip = false;
                }
            }
            if (isGzip) {
                inflate.push(reader.result);
            } else {
                chunks.push(reader.result);
            }
            offset += chunkSize;
            progressHandler(Math.min(1, (offset / file.size)));
            seek();
        };

        reader.onerror = e;
        seek();
        function seek() {
            if (offset >= file.size) {
                // read is complete. return the data.
                if (isGzip) {
                    if (inflate.err) {
                        e(inflate.msg)
                    } else {
                        r(inflate.result.buffer);
                    }
                } else {
                    // concatenate the read buffers
                    const chunkSizes = chunks.map((x) => x.byteLength);
                    const totalSize = chunkSizes.reduce((acc, cur) => acc + cur, 0);
                    const totalBuffer = new Uint8Array(totalSize);
                    chunks.reduce((acc, cur, i) => {
                        totalBuffer.set(new Uint8Array(chunks[i]), acc);
                        return acc + chunks[i].byteLength;
                    }, 0);

                    r(totalBuffer.buffer);
                }
            } else {
                // trigger read of next chunk
                var slice = file.slice(offset, offset + chunkSize);
                reader.readAsArrayBuffer(slice);
            }
        }
    }
    )
}

export default read_gzip_file;