import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

import { createApp } from 'vue'
import App from '@/App'
import router from '@/router'
import bakta from '@/bakta'

const app = createApp(App)
    .use(router)
    .use(bakta)
window.vm = app.mount('#app')
