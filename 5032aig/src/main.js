import 'bootstrap/dist/css/bootstrap.min.css'
import primeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
// import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import CKEditor from '@ckeditor/ckeditor5-vue'

const app = createApp(App);
app.use(primeVue, {
    theme:{
        present: Aura
    }
});

app.use(router)
app.use(CKEditor)
app.mount('#app')
