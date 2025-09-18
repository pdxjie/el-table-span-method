/**
 * 动态UI库加载器
 * 根据用户选择动态加载对应的UI库
 */
export class DynamicUILoader {
  constructor() {
    this.loadedLibraries = new Set()
    this.loadingPromises = new Map()
  }

  /**
   * 动态加载UI库
   * @param {string} libraryId - UI库ID
   * @returns {Promise<boolean>} 加载结果
   */
  async loadUILibrary(libraryId) {
    if (this.loadedLibraries.has(libraryId)) {
      return true
    }

    if (this.loadingPromises.has(libraryId)) {
      return this.loadingPromises.get(libraryId)
    }

    const loadPromise = this._loadLibraryResources(libraryId)
    this.loadingPromises.set(libraryId, loadPromise)

    try {
      const result = await loadPromise
      if (result) {
        this.loadedLibraries.add(libraryId)
      }
      return result
    } finally {
      this.loadingPromises.delete(libraryId)
    }
  }

  /**
   * 加载库资源
   * @private
   */
  async _loadLibraryResources(libraryId) {
    const configs = {
      'ant-design-vue': {
        css: ['https://unpkg.com/ant-design-vue@4/dist/reset.css'],
        js: ['https://unpkg.com/ant-design-vue@4/dist/antd.min.js'],
        globalName: 'antd'
      },
      'naive-ui': {
        css: ['https://unpkg.com/naive-ui@2/dist/index.css'],
        js: ['https://unpkg.com/naive-ui@2/dist/index.js'],
        globalName: 'naive'
      },
      'vuetify': {
        css: ['https://unpkg.com/vuetify@3/dist/vuetify.min.css'],
        js: ['https://unpkg.com/vuetify@3/dist/vuetify.min.js'],
        globalName: 'Vuetify'
      },
      'quasar': {
        css: ['https://unpkg.com/quasar@2/dist/quasar.prod.css'],
        js: ['https://unpkg.com/quasar@2/dist/quasar.umd.prod.js'],
        globalName: 'Quasar'
      }
    }

    const config = configs[libraryId]
    if (!config) {
      console.warn(`不支持的UI库: ${libraryId}`)
      return false
    }

    try {
      // 加载CSS
      await Promise.all(config.css.map(url => this._loadCSS(url)))
      
      // 加载JS
      await Promise.all(config.js.map(url => this._loadScript(url)))
      
      // 验证加载结果
      return this._validateLibraryLoaded(config.globalName)
    } catch (error) {
      console.error(`加载UI库 ${libraryId} 失败:`, error)
      return false
    }
  }

  /**
   * 加载CSS文件
   * @private
   */
  _loadCSS(url) {
    return new Promise((resolve, reject) => {
      // 检查是否已经加载
      const existing = document.querySelector(`link[href="${url}"]`)
      if (existing) {
        resolve()
        return
      }

      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = url
      link.onload = resolve
      link.onerror = reject
      document.head.appendChild(link)
    })
  }

  /**
   * 加载JavaScript文件
   * @private
   */
  _loadScript(url) {
    return new Promise((resolve, reject) => {
      // 检查是否已经加载
      const existing = document.querySelector(`script[src="${url}"]`)
      if (existing) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = url
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  /**
   * 验证库是否成功加载
   * @private
   */
  _validateLibraryLoaded(globalName) {
    return typeof window[globalName] !== 'undefined'
  }

  /**
   * 检查库是否已加载
   */
  isLibraryLoaded(libraryId) {
    return this.loadedLibraries.has(libraryId)
  }

  /**
   * 获取已加载的库列表
   */
  getLoadedLibraries() {
    return Array.from(this.loadedLibraries)
  }
}

// 创建全局实例
export const dynamicUILoader = new DynamicUILoader()