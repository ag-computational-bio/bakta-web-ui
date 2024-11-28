import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import { expectJson } from './fetch-helper'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import bakta from './bakta'
import { z } from 'zod'

type Config = {
  api: string
}
const ConfigSchema = z.object({ api: z.string() })

function init(config: Config) {
  const app = createApp(App)
    .use(router)
    .use(bakta, config)
  app.mount('#app')
}

window
  .fetch('/config/config.json')
  .then(expectJson)
  .then(ConfigSchema.parse)
  .then(j => init(j))
  .catch(
    () =>
      (document.body.innerHTML =
        'Could not load config file. Please check <a href="config/config.json">config</a>')
  )
