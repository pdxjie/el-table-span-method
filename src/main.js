import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// Ant Design Vue
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

// Naive UI
import naive from 'naive-ui'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import './style.css'
import App from './App.vue'

const app = createApp(App)

// Vuetify 配置
const vuetify = createVuetify({
  components,
  directives,
})

// 注册所有UI库
app.use(ElementPlus)
app.use(Antd)
app.use(naive)
app.use(vuetify)

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 提供UI库实例给组件使用
app.provide('$antd', Antd)
app.provide('$naive', naive)
app.provide('$vuetify', vuetify)

app.mount('#app')