export default [
  {
    path: '*',
    name: 'Lost',
    component: () => import(/* webpackChunkName: "Lost" */ '@/views/404.vue'),
  },
]
