import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

import { createApp } from 'vue'
import App from '@/App'
import router from '@/router'
import bakta from '@/bakta'

const app = createApp(App)
    .use(router)
    .use(bakta, {
        api: "https://restapi.bakta.ingress.rancher2.computational.bio",
        token: "d89vgaegfv0aew8cagfwecg"
    })
window.vm = app.mount('#app')