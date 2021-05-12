/**
 * Promise based helper methods for fetch-response handling
 */

/**
 * Retrieves the status code with either the body message or the statusText if a body is not available.
 *
 * @param {*} response
 * @returns Promise: String
 */
function getResponseErrorMessage(response) {
  return response.text().then((message) => {
    if (!message) message = response.statusText;
    return Promise.resolve(response.status + " - " + message);
  });
}

/**
 * Fails with the response error message
 *
 * @param {*} response
 * @returns Promise: String
 */
function throwResponseErrorMessage(response) {
  return getResponseErrorMessage(response).then((x) => Promise.reject(x));
}

/**
 * Checks if the promise is ok. Return an empty promise or failing promise.
 * @param {*} response
 * @returns
 */
function expectOk(response) {
  if (response.ok) {
    return Promise.resolve(response);
  } else {
    return throwResponseErrorMessage(response);
  }
}
/**
 * Checks if the promise is ok. Return an promise with the json body or failing promise.
 *
 * @param {*} response
 * @returns
 */
function expectJson(response) {
  if (response.ok) {
    return response.json();
  } else {
    return throwResponseErrorMessage(response);
  }
}
/**
 * Checks if the promise is ok. Return an promise with the text body or failing promise.
 *
 * @param {*} response
 * @returns
 */
function expectText(response) {
  if (response.ok) {
    return response.text();
  } else {
    return throwResponseErrorMessage(response);
  }
}

export {
  expectJson,
  expectOk,
  expectText,
  getResponseErrorMessage,
  throwResponseErrorMessage,
};
