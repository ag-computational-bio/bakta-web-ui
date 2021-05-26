import { expectJson } from "@/fetch-helper";

const api = function(options) {
  function post(url, body) {
    return window
      .fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: options.token,
        },
        body: body,
      })
      .then(expectJson);
  }
  return {
    init: function(request) {
      if (!request) {
        request = {};
      }
      return post(options.api + "/api/v1/job/init", JSON.stringify(request));
    },
    list: function(jobs) {
      return post(options.api + "/api/v1/job/list", JSON.stringify(jobs));
    },
    start: function(request) {
      return post(options.api + "/api/v1/job/start", JSON.stringify(request));
    },
    result: function(job) {
      return post(options.api + "/api/v1/job/result", JSON.stringify(job));
    },
    upload: function(url, file) {
      return window.fetch(url, {
        method: "PUT",
        body: file,
      });
    },
    version: function() {
      return window
        .fetch(options.api + "/api/v1/version", {
          headers: {
            Accept: "application/json",
            Authorization: options.token,
          },
        })
        .then(expectJson);
    },
  };
};

export default {
  install: (app, options) => {
    app.config.globalProperties.$baktarest = api(options);
  },
};
export { api };
