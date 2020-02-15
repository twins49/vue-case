/**
 * @param directory 要搜索的文件夹目录不能是变量，否则在编译阶段无法定位目录
 * @param useSubdirectories  是否搜索子目录
 * @param regExp 匹配文件的正则表达式
 * @return function 返回一个具有 resolve, keys, id 三个属性的方法
 *         resolve() 它返回请求被解析后得到的模块 id
 *         keys() 它返回一个数组，由所有符合上下文模块处理的请求组成。
 *         id 是上下文模块里面所包含的模块 id. 它可能在你使用 module.hot.accept 的时候被用到
 */
const files: any = require.context('.', false, /\.ts/)

let configRouters: any[] = []

files.keys().forEach((key: any) => {
  if (key === './index.ts') {
    return
  }
  configRouters = configRouters.concat(files(key).default)
})

export default configRouters
