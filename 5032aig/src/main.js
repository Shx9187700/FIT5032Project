import 'bootstrap/dist/css/bootstrap.min.css'
import PrimeVue from 'primevue/config';
import Aura from '@Primeuix/themes/aura';
// import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App);
app.use(PrimeVue, {
    theme:{
        present: Aura
    }
});

app.use(router)

app.mount('#app')
