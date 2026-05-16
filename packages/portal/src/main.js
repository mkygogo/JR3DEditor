import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import HomeView from './views/HomeView.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: HomeView },
        { path: '/scene/:slug', component: () => import('./views/SceneViewerView.vue') },
    ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')
