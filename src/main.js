import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

import { createApp } from 'vue'
import App from '@/App'
import router from '@/router'

const app = createApp(App).use(router)
app.mount('#app')
