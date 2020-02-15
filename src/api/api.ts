// src/api/api.ts
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios'
// config文件夹往后会出现，这里就不说明了
import { MAINHOST, ISMOCK, QAHOST, conmomPrams } from '@/config'
// 接口
import requestConfig from './requestConfig'
// 获取存储在 cookies 的 token
import { getToken, removeToken } from '@/utils/common'
// 这里我使用了 antd ，大家根据自己的UI来使用
import { message } from 'ant-design-vue'
// 路由
import router from '@/router'

declare type Methods = 'GET' | 'OPTIONS' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'TRACE' | 'CONNECT'

declare interface Datas {
  method?: Methods
  [key: string]: any
}

// 根据环境，切换请求不同的url
const baseURL = process.env.NODE_ENV === 'production' ? MAINHOST : QAHOST //QAHOST

class HttpRequest {
  public queue: any // 请求的url集合
  public hide: any
  public constructor() {
    this.queue = {}
  }
  destroy(url: string) {
    delete this.queue[url]
    if (!Object.keys(this.queue).length) {
      // 关闭loding
      setTimeout(this.hide, 0)
    }
  }
  interceptors(instance: any, url?: string) {
    // 请求拦截
    instance.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        // 添加全局的loading...
        if (!Object.keys(this.queue).length) {
          // show loading
          this.hide = message.loading('加载中..', 0)
        }
        if (url) {
          this.queue[url] = true
        }
        return config
      },
      (error: any) => {
        console.error(error)
      }
    )
    // 响应拦截
    instance.interceptors.response.use(
      (res: AxiosResponse) => {
        if (url) {
          this.destroy(url)
        }
        let { data, status } = res
        if (status === 200 && ISMOCK) {
          return data.result
        } // 如果是mock数据，直接返回
        if (status === 200 && data && data.code === 200) {
          return data.result
        } // 请求成功
        res.data = data
        return requestFail(res) // 失败回调
      },
      (error: any) => {
        if (url) {
          this.destroy(url)
        }
        message.error('服务器出错')
        console.error(error)
      }
    )
  }
  async request(options: AxiosRequestConfig) {
    const instance = axios.create()
    await this.interceptors(instance, options.url)
    return instance(options)
  }
}

// 请求失败
const requestFail = (res: AxiosResponse) => {
  let errStr = '网络繁忙！'

  if (res.data.code) {
    switch (res.data.code) {
      // 401: 未登录
      // 未登录则跳转登录页面，并携带当前页面的路径
      // 在登录成功后返回当前页面，这一步需要在登录页操作。
      case 401:
        router.replace({
          path: '/',
        })
        removeToken()
        break
      // 403 token过期
      // 登录过期对用户进行提示
      // 清除本地token和清空vuex中token对象
      // 跳转登录页面
      case 403:
        // 清除token
        // store.commit('loginSuccess', null);
        // 跳转登录页面，并将要浏览的页面fullPath传过去，登录成功后跳转需要访问的页面
        router.replace({
          path: '/',
        })
        removeToken()
        // localStorage.removeItem('token')
        break
      // 404请求不存在
      case 404:
        break
    }
  }
  console.error({
    code: res.data.errcode || res.data.code,
    msg: res.data.errMsg || errStr,
  })

  if (typeof res.data.errMsg === 'object') {
    res.data.errMsg = '服务器错误'
  }
  message.error(res.data.errMsg || errStr)
  return null
}

// 合并axios参数
const conbineOptions = (_opts: any, data: Datas, method: Methods): AxiosRequestConfig => {
  let opts = _opts
  if (typeof opts === 'string') {
    opts = { url: opts }
  }
  const _data = { ...conmomPrams, ...opts.data, ...data }
  const options = {
    method: opts.method || data.method || method || 'GET',
    url: opts.url,
    headers: { Authorization: `Bearer${getToken()}` }, // 这个需要与后端配合，让后端去除掉Bearer，加上这个是为了（安全考虑）
    baseURL,
    timeout: 10000,
  }
  const c = _data // 加密数据
  return options.method !== 'GET'
    ? Object.assign(options, { data: c })
    : Object.assign(options, { params: _data })
}

const HTTP = new HttpRequest()

/**
 * 抛出整个项目的api方法
 */
const Api = (() => {
  const apiObj: any = {}
  const requestList: any = requestConfig
  const fun = (opts: AxiosRequestConfig | string) => {
    return async (data = {}, method: Methods = 'POST') => {
      const newOpts = conbineOptions(opts, data, method)
      const res = await HTTP.request(newOpts)
      return res
    }
  }
  Object.keys(requestConfig).forEach((key) => {
    apiObj[key] = fun(requestList[key])
  })

  return apiObj
})()

export default Api as any
