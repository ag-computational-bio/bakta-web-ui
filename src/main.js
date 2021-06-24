import "bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { expectJson } from "./fetch-helper";
import { createApp } from "vue";
import App from "@/App";
import router from "@/router";
import bakta from "@/bakta";

function init(config) {
  const app = createApp(App)
    .use(router)
    .use(bakta, config);
  window.vm = app.mount("#app");
}

window
  .fetch("config/config.json")
  .then(expectJson)
  .then((j) => init(j))
  .catch(
    () =>
      (document.body.innerHTML =
        'Could not load config file. Please check <a href="config/config.json">config</a>')
  );
