/**
 * UI组件库适配器基类
 * 定义统一的接口规范，所有UI库适配器都必须实现这些方法
 */
export class UILibraryAdapter {
  constructor(config = {}) {
    this.config = config
    this.name = ''
    this.version = ''
    this.cdnLinks = {
      css: [],
      js: []
    }
  }

  /**
   * 获取适配器基本信息
   * @returns {Object}
   */
  getInfo() {
    return {
      name: this.name,
      version: this.version,
      cdnLinks: this.cdnLinks,
      features: this.getFeatures()
    }
  }

  /**
   * 获取支持的功能特性
   * @returns {Object}
   */
  getFeatures() {
    return {
      rowSpan: true,
      colSpan: true,
      mixedSpan: true,
      customRender: false,
      virtualScroll: false,
      sortable: true,
      resizable: false
    }
  }

  /**
   * 生成合并方法代码 - 子类必须实现
   * @param {Object} config - 合并配置
   * @returns {string} 合并方法代码
   */
  generateSpanMethod(config) {
    throw new Error('generateSpanMethod must be implemented by subclass')
  }

  /**
   * 生成Vue2组件代码 - 子类必须实现
   * @param {Object} config - 合并配置
   * @returns {string} Vue2组件代码
   */
  generateVue2Code(config) {
    throw new Error('generateVue2Code must be implemented by subclass')
  }

  /**
   * 生成Vue3组件代码 - 子类必须实现
   * @param {Object} config - 合并配置
   * @returns {string} Vue3组件代码
   */
  generateVue3Code(config) {
    throw new Error('generateVue3Code must be implemented by subclass')
  }

  /**
   * 获取预览表格组件配置 - 子类必须实现
   * @param {Object} config - 合并配置
   * @returns {Object} 表格组件配置
   */
  getTableConfig(config) {
    throw new Error('getTableConfig must be implemented by subclass')
  }

  /**
   * 处理表格数据以支持合并 - 子类可选实现
   * @param {Array} tableData - 原始表格数据
   * @param {Object} config - 合并配置
   * @returns {Array} 处理后的表格数据
   */
  processTableData(tableData, config) {
    return tableData
  }

  /**
   * 获取安装依赖命令
   * @returns {Object}
   */
  getInstallCommands() {
    return {
      npm: '',
      yarn: '',
      pnpm: ''
    }
  }

  /**
   * 获取导入语句
   * @returns {Array}
   */
  getImportStatements() {
    return []
  }

  /**
   * 验证配置是否有效
   * @param {Object} config - 合并配置
   * @returns {Object} 验证结果
   */
  validateConfig(config) {
    const errors = []
    
    if (!config.mergeColumns || config.mergeColumns.length === 0) {
      errors.push('请选择至少一个要合并的列')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 获取特定UI库的注意事项和文档链接
   * @returns {Object}
   */
  getDocumentation() {
    return {
      notes: [],
      links: []
    }
  }
}