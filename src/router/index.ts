import Vue from 'vue'
import VueRouter from 'vue-router'
import ConfigRouters from './modules'
import Common from './common'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: ConfigRouters.concat(Common),
})

export default router
