import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './assets/main.css'
import { createApp } from 'vue'
import App from './page/App.vue'
import router from './router'
import { z } from 'zod'
import { initBaktaApi } from './model/bakta-api'
import { initBaktaService } from './page/page'
import { AdminConfigSchema, initAdminConfig } from './admin/admin-config'

const ConfigSchema = z.object({ api: z.string(), admin: AdminConfigSchema.optional() })
type Config = z.infer<typeof ConfigSchema>

function init(config: Config) {
  initAdminConfig(config.api, config.admin)
  const api = initBaktaApi(config.api)
  initBaktaService(api)
  const app = createApp(App).use(router)
  app.mount('#app')
}

window
  .fetch('/config/config.json')
  .then((r) => r.json())
  .then(ConfigSchema.parse)
  .then((j) => init(j))
  .catch(
    () =>
      (document.body.innerHTML =
        'Could not load config file. Please check <a href="config/config.json">config</a>'),
  )
