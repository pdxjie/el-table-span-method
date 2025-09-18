import { ElementAdapter, AntdAdapter } from './ElementAdapter.js'
import { NaiveAdapter, VuetifyAdapter, QuasarAdapter } from './OtherAdapters.js'

/**
 * UI库管理器
 * 统一管理所有UI库适配器
 */
export class UILibraryManager {
  constructor() {
    this.adapters = new Map()
    this.currentAdapter = null
    this.initializeAdapters()
  }

  /**
   * 初始化所有适配器
   */
  initializeAdapters() {
    // 注册所有支持的UI库适配器
    this.registerAdapter('element-plus', new ElementAdapter())
    this.registerAdapter('ant-design-vue', new AntdAdapter()) 
    this.registerAdapter('naive-ui', new NaiveAdapter())
    this.registerAdapter('vuetify', new VuetifyAdapter())
    this.registerAdapter('quasar', new QuasarAdapter())
    
    // 默认使用 Element Plus
    this.setCurrentAdapter('element-plus')
  }

  /**
   * 注册适配器
   * @param {string} id - 适配器ID
   * @param {UILibraryAdapter} adapter - 适配器实例
   */
  registerAdapter(id, adapter) {
    this.adapters.set(id, adapter)
  }

  /**
   * 设置当前使用的适配器
   * @param {string} id - 适配器ID
   */
  setCurrentAdapter(id) {
    if (!this.adapters.has(id)) {
      throw new Error(`未找到适配器: ${id}`)
    }
    this.currentAdapter = this.adapters.get(id)
  }

  /**
   * 获取当前适配器
   * @returns {UILibraryAdapter}
   */
  getCurrentAdapter() {
    return this.currentAdapter
  }

  /**
   * 获取所有可用的UI库列表
   * @returns {Array}
   */
  getAvailableLibraries() {
    return Array.from(this.adapters.entries()).map(([id, adapter]) => ({
      id,
      ...adapter.getInfo(),
      features: adapter.getFeatures(),
      documentation: adapter.getDocumentation()
    }))
  }

  /**
   * 根据ID获取适配器
   * @param {string} id - 适配器ID
   * @returns {UILibraryAdapter}
   */
  getAdapter(id) {
    return this.adapters.get(id)
  }

  /**
   * 检查适配器是否存在
   * @param {string} id - 适配器ID
   * @returns {boolean}
   */
  hasAdapter(id) {
    return this.adapters.has(id)
  }

  /**
   * 获取适配器信息
   * @param {string} id - 适配器ID
   * @returns {Object}
   */
  getAdapterInfo(id) {
    const adapter = this.adapters.get(id)
    return adapter ? adapter.getInfo() : null
  }

  /**
   * 验证配置对当前适配器是否有效
   * @param {Object} config - 合并配置
   * @returns {Object} 验证结果
   */
  validateConfig(config) {
    if (!this.currentAdapter) {
      return {
        valid: false,
        errors: ['未选择UI库']
      }
    }
    
    return this.currentAdapter.validateConfig(config)
  }

  /**
   * 生成当前适配器的代码
   * @param {Object} config - 合并配置
   * @param {string} vueVersion - Vue版本 'vue2' | 'vue3'
   * @returns {string} 生成的代码
   */
  generateCode(config, vueVersion = 'vue3') {
    if (!this.currentAdapter) {
      throw new Error('未选择UI库')
    }

    if (vueVersion === 'vue3') {
      return this.currentAdapter.generateVue3Code(config)
    } else {
      return this.currentAdapter.generateVue2Code(config)
    }
  }

  /**
   * 获取当前适配器的表格配置
   * @param {Object} config - 合并配置
   * @returns {Object} 表格配置
   */
  getTableConfig(config) {
    if (!this.currentAdapter) {
      throw new Error('未选择UI库')
    }

    return this.currentAdapter.getTableConfig(config)
  }

  /**
   * 处理表格数据
   * @param {Array} tableData - 原始表格数据
   * @param {Object} config - 合并配置
   * @returns {Array} 处理后的表格数据
   */
  processTableData(tableData, config) {
    if (!this.currentAdapter) {
      return tableData
    }

    return this.currentAdapter.processTableData(tableData, config)
  }

  /**
   * 获取安装说明
   * @param {string} id - 适配器ID，如果不提供则使用当前适配器
   * @returns {Object} 安装说明
   */
  getInstallInstructions(id = null) {
    const adapter = id ? this.adapters.get(id) : this.currentAdapter
    
    if (!adapter) {
      throw new Error('适配器不存在')
    }

    return {
      commands: adapter.getInstallCommands(),
      imports: adapter.getImportStatements(),
      documentation: adapter.getDocumentation()
    }
  }

  /**
   * 搜索适配器
   * @param {string} keyword - 搜索关键词
   * @returns {Array} 匹配的适配器列表
   */
  searchAdapters(keyword) {
    const lowerKeyword = keyword.toLowerCase()
    const results = []

    for (const [id, adapter] of this.adapters) {
      const info = adapter.getInfo()
      if (
        info.name.toLowerCase().includes(lowerKeyword) ||
        id.toLowerCase().includes(lowerKeyword)
      ) {
        results.push({
          id,
          ...info
        })
      }
    }

    return results
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const libraries = this.getAvailableLibraries()
    
    return {
      totalLibraries: libraries.length,
      currentLibrary: this.currentAdapter ? this.currentAdapter.name : null,
      supportedFeatures: {
        rowSpan: libraries.filter(lib => lib.features.rowSpan).length,
        colSpan: libraries.filter(lib => lib.features.colSpan).length,
        mixedSpan: libraries.filter(lib => lib.features.mixedSpan).length,
        customRender: libraries.filter(lib => lib.features.customRender).length,
        virtualScroll: libraries.filter(lib => lib.features.virtualScroll).length
      }
    }
  }

  /**
   * 导出配置
   * @returns {Object} 当前配置
   */
  exportConfig() {
    return {
      currentAdapterId: this.getCurrentAdapterId(),
      availableAdapters: Array.from(this.adapters.keys()),
      timestamp: Date.now()
    }
  }

  /**
   * 获取当前适配器ID
   * @returns {string|null}
   */
  getCurrentAdapterId() {
    if (!this.currentAdapter) return null
    
    for (const [id, adapter] of this.adapters) {
      if (adapter === this.currentAdapter) {
        return id
      }
    }
    
    return null
  }

  /**
   * 重置到默认状态
   */
  reset() {
    this.setCurrentAdapter('element-plus')
  }
}

// 创建全局单例
export const uiLibraryManager = new UILibraryManager()

// 导出适配器常量
export const UI_LIBRARIES = {
  ELEMENT_PLUS: 'element-plus',
  ANT_DESIGN_VUE: 'ant-design-vue',
  NAIVE_UI: 'naive-ui',
  VUETIFY: 'vuetify',
  QUASAR: 'quasar'
}

// 导出UI库元数据
export const UI_LIBRARY_METADATA = {
  [UI_LIBRARIES.ELEMENT_PLUS]: {
    name: 'Element Plus',
    description: '基于 Vue 3 的组件库',
    popularity: 'high',
    learnability: 'easy',
    ecosystem: 'excellent'
  },
  [UI_LIBRARIES.ANT_DESIGN_VUE]: {
    name: 'Ant Design Vue',
    description: '企业级 UI 设计语言',
    popularity: 'high',
    learnability: 'medium',
    ecosystem: 'excellent'
  },
  [UI_LIBRARIES.NAIVE_UI]: {
    name: 'Naive UI',
    description: '比较完整的 Vue 3 组件库',
    popularity: 'medium',
    learnability: 'easy',
    ecosystem: 'good'
  },
  [UI_LIBRARIES.VUETIFY]: {
    name: 'Vuetify',
    description: 'Material Design 组件框架',
    popularity: 'high',
    learnability: 'medium',
    ecosystem: 'excellent'
  },
  [UI_LIBRARIES.QUASAR]: {
    name: 'Quasar',
    description: '全平台 Vue.js 框架',
    popularity: 'medium',
    learnability: 'medium',
    ecosystem: 'good'
  }
}