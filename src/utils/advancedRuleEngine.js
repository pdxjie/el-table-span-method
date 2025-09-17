/**
 * 高级自定义规则引擎
 * 提供强大的合并规则配置和执行能力
 */

/**
 * 预设规则模板库
 */
export const RULE_TEMPLATES = {
  // 文本处理类
  text: {
    name: '文本处理',
    rules: [
      {
        id: 'ignore-case',
        name: '忽略大小写相等',
        description: '忽略大小写比较两个文本值',
        template: 'String(value1).toLowerCase() === String(value2).toLowerCase()',
        category: 'text',
        examples: [
          { input: ['Hello', 'HELLO'], output: true },
          { input: ['World', 'word'], output: false }
        ]
      },
      {
        id: 'contains',
        name: '包含关系',
        description: '检查一个值是否包含另一个值',
        template: 'String(value1).includes(String(value2)) || String(value2).includes(String(value1))',
        category: 'text',
        examples: [
          { input: ['JavaScript', 'Script'], output: true },
          { input: ['Hello', 'World'], output: false }
        ]
      },
      {
        id: 'starts-with',
        name: '前缀匹配',
        description: '检查值是否以相同前缀开始',
        template: 'String(value1).startsWith(String(value2)) || String(value2).startsWith(String(value1))',
        category: 'text'
      },
      {
        id: 'ends-with',
        name: '后缀匹配',
        description: '检查值是否以相同后缀结束',
        template: 'String(value1).endsWith(String(value2)) || String(value2).endsWith(String(value1))',
        category: 'text'
      },
      {
        id: 'regex-match',
        name: '正则表达式匹配',
        description: '使用正则表达式匹配规则',
        template: '/^\\d{4}-\\d{2}-\\d{2}$/.test(value1) && /^\\d{4}-\\d{2}-\\d{2}$/.test(value2)',
        category: 'text',
        customizable: true
      },
      {
        id: 'trim-equal',
        name: '去空格相等',
        description: '去除首尾空格后比较',
        template: 'String(value1).trim() === String(value2).trim()',
        category: 'text'
      },
      {
        id: 'length-equal',
        name: '长度相等',
        description: '比较字符串长度是否相等',
        template: 'String(value1).length === String(value2).length',
        category: 'text'
      }
    ]
  },

  // 数值处理类
  number: {
    name: '数值处理',
    rules: [
      {
        id: 'number-equal',
        name: '数值相等',
        description: '将值转换为数字后比较',
        template: 'Number(value1) === Number(value2)',
        category: 'number'
      },
      {
        id: 'number-range',
        name: '数值范围',
        description: '检查数值差是否在指定范围内',
        template: 'Math.abs(Number(value1) - Number(value2)) <= 100',
        category: 'number',
        customizable: true
      },
      {
        id: 'percentage-diff',
        name: '百分比差值',
        description: '按百分比比较数值差异',
        template: 'Math.abs(Number(value1) - Number(value2)) / Math.max(Number(value1), Number(value2)) <= 0.1',
        category: 'number',
        customizable: true
      },
      {
        id: 'round-equal',
        name: '四舍五入相等',
        description: '四舍五入到指定位数后比较',
        template: 'Math.round(Number(value1) * 100) / 100 === Math.round(Number(value2) * 100) / 100',
        category: 'number',
        customizable: true
      },
      {
        id: 'same-sign',
        name: '同符号',
        description: '检查两个数值是否为同符号',
        template: '(Number(value1) >= 0) === (Number(value2) >= 0)',
        category: 'number'
      },
      {
        id: 'same-magnitude',
        name: '相同数量级',
        description: '检查是否为相同数量级',
        template: 'Math.floor(Math.log10(Math.abs(Number(value1)))) === Math.floor(Math.log10(Math.abs(Number(value2))))',
        category: 'number'
      }
    ]
  },

  // 日期时间类
  date: {
    name: '日期时间',
    rules: [
      {
        id: 'same-date',
        name: '相同日期',
        description: '比较是否为同一天',
        template: 'new Date(value1).toDateString() === new Date(value2).toDateString()',
        category: 'date'
      },
      {
        id: 'same-month',
        name: '相同月份',
        description: '比较是否为同一月份',
        template: 'new Date(value1).getMonth() === new Date(value2).getMonth() && new Date(value1).getFullYear() === new Date(value2).getFullYear()',
        category: 'date'
      },
      {
        id: 'same-year',
        name: '相同年份',
        description: '比较是否为同一年',
        template: 'new Date(value1).getFullYear() === new Date(value2).getFullYear()',
        category: 'date'
      },
      {
        id: 'same-quarter',
        name: '相同季度',
        description: '比较是否为同一季度',
        template: 'Math.floor(new Date(value1).getMonth() / 3) === Math.floor(new Date(value2).getMonth() / 3) && new Date(value1).getFullYear() === new Date(value2).getFullYear()',
        category: 'date'
      },
      {
        id: 'same-week',
        name: '相同周',
        description: '比较是否为同一周',
        template: '(function(d1, d2) { const date1 = new Date(d1); const date2 = new Date(d2); date1.setHours(0,0,0,0); date2.setHours(0,0,0,0); const diff = Math.abs(date1 - date2) / (1000 * 60 * 60 * 24); return diff < 7 && date1.getDay() <= date2.getDay(); })(value1, value2)',
        category: 'date'
      },
      {
        id: 'date-range',
        name: '日期范围',
        description: '检查日期是否在指定天数范围内',
        template: 'Math.abs(new Date(value1) - new Date(value2)) / (1000 * 60 * 60 * 24) <= 7',
        category: 'date',
        customizable: true
      }
    ]
  },

  // 逻辑组合类
  logic: {
    name: '逻辑组合',
    rules: [
      {
        id: 'and-condition',
        name: 'AND 条件',
        description: '多个条件同时满足',
        template: 'value1 === value2 && String(value1).length > 0',
        category: 'logic',
        customizable: true
      },
      {
        id: 'or-condition',
        name: 'OR 条件',
        description: '多个条件满足其一',
        template: 'value1 === value2 || (String(value1).toLowerCase() === String(value2).toLowerCase())',
        category: 'logic',
        customizable: true
      },
      {
        id: 'complex-condition',
        name: '复杂条件',
        description: '复杂的逻辑判断',
        template: '(value1 === value2) || (Number(value1) > 0 && Number(value2) > 0 && Math.abs(Number(value1) - Number(value2)) < 10)',
        category: 'logic',
        customizable: true
      }
    ]
  },

  // 业务场景类
  business: {
    name: '业务场景',
    rules: [
      {
        id: 'same-category',
        name: '相同分类',
        description: '按分类字段合并',
        template: 'String(value1).split("-")[0] === String(value2).split("-")[0]',
        category: 'business',
        examples: [
          { input: ['A-001', 'A-002'], output: true },
          { input: ['A-001', 'B-001'], output: false }
        ]
      },
      {
        id: 'same-department',
        name: '相同部门',
        description: '员工部门分组',
        template: 'String(value1).includes("技术") && String(value2).includes("技术")',
        category: 'business',
        customizable: true
      },
      {
        id: 'same-status',
        name: '相同状态',
        description: '状态分组合并',
        template: '["已完成", "完成"].includes(value1) && ["已完成", "完成"].includes(value2)',
        category: 'business',
        customizable: true
      },
      {
        id: 'same-priority',
        name: '相同优先级',
        description: '优先级分组',
        template: '(["高", "紧急"].includes(value1) && ["高", "紧急"].includes(value2)) || (["中", "普通"].includes(value1) && ["中", "普通"].includes(value2)) || (["低"].includes(value1) && ["低"].includes(value2))',
        category: 'business'
      },
      {
        id: 'amount-range',
        name: '金额范围',
        description: '金额区间合并',
        template: '(Number(value1) < 1000 && Number(value2) < 1000) || (Number(value1) >= 1000 && Number(value1) < 10000 && Number(value2) >= 1000 && Number(value2) < 10000) || (Number(value1) >= 10000 && Number(value2) >= 10000)',
        category: 'business'
      }
    ]
  }
}

/**
 * 高级规则引擎类
 */
export class AdvancedRuleEngine {
  constructor() {
    this.customFunctions = new Map()
    this.ruleHistory = []
    this.ruleCache = new Map()
    this.debugMode = false
  }

  /**
   * 注册自定义函数
   * @param {string} name - 函数名
   * @param {Function} func - 函数实现
   */
  registerFunction(name, func) {
    this.customFunctions.set(name, func)
  }

  /**
   * 初始化内置函数
   */
  initBuiltinFunctions() {
    // 字符串处理函数
    this.registerFunction('fuzzyMatch', (str1, str2, threshold = 0.8) => {
      const similarity = this.calculateSimilarity(str1, str2)
      return similarity >= threshold
    })

    this.registerFunction('extractNumbers', (str) => {
      const matches = String(str).match(/\d+/g)
      return matches ? matches.map(Number) : []
    })

    this.registerFunction('extractWords', (str) => {
      return String(str).split(/\W+/).filter(word => word.length > 0)
    })

    // 日期处理函数
    this.registerFunction('isSameWeek', (date1, date2) => {
      const d1 = new Date(date1)
      const d2 = new Date(date2)
      const diff = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24)
      return diff < 7
    })

    this.registerFunction('getQuarter', (date) => {
      return Math.floor(new Date(date).getMonth() / 3) + 1
    })

    // 数值处理函数
    this.registerFunction('isInRange', (value, min, max) => {
      const num = Number(value)
      return num >= min && num <= max
    })

    this.registerFunction('roundTo', (value, decimals = 2) => {
      const factor = Math.pow(10, decimals)
      return Math.round(Number(value) * factor) / factor
    })

    // 数组/集合函数
    this.registerFunction('hasCommonElement', (arr1, arr2) => {
      const set1 = new Set(Array.isArray(arr1) ? arr1 : String(arr1).split(','))
      const set2 = new Set(Array.isArray(arr2) ? arr2 : String(arr2).split(','))
      return [...set1].some(item => set2.has(item))
    })

    this.registerFunction('arrayIntersection', (arr1, arr2) => {
      const set1 = new Set(Array.isArray(arr1) ? arr1 : String(arr1).split(','))
      const set2 = new Set(Array.isArray(arr2) ? arr2 : String(arr2).split(','))
      return [...set1].filter(item => set2.has(item))
    })
  }

  /**
   * 计算字符串相似度
   * @param {string} str1 
   * @param {string} str2 
   * @returns {number} 相似度 0-1
   */
  calculateSimilarity(str1, str2) {
    const s1 = String(str1).toLowerCase()
    const s2 = String(str2).toLowerCase()
    
    if (s1 === s2) return 1
    if (s1.length === 0 || s2.length === 0) return 0

    const matrix = []
    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    const maxLength = Math.max(s1.length, s2.length)
    return (maxLength - matrix[s2.length][s1.length]) / maxLength
  }

  /**
   * 创建安全的执行上下文
   * @param {any} value1 
   * @param {any} value2 
   * @param {Object} extraContext 
   * @returns {Object}
   */
  createSafeContext(value1, value2, extraContext = {}) {
    const context = {
      value1,
      value2,
      
      // 安全的内置对象
      Math: Math,
      Number: Number,
      String: String,
      Array: Array,
      Date: Date,
      RegExp: RegExp,
      JSON: JSON,
      
      // 自定义函数
      ...Object.fromEntries(this.customFunctions),
      
      // 额外上下文
      ...extraContext,

      // 常用工具函数
      isEmpty: (value) => value === null || value === undefined || value === '',
      isNumber: (value) => !isNaN(Number(value)) && isFinite(Number(value)),
      isDate: (value) => !isNaN(Date.parse(value)),
      parseNum: (value) => {
        const num = Number(value)
        return isNaN(num) ? 0 : num
      },
      parseStr: (value) => String(value || ''),
      
      // 日志函数（开发模式）
      log: this.debugMode ? console.log : () => {},
      debug: this.debugMode ? console.debug : () => {}
    }

    return context
  }

  /**
   * 验证规则语法
   * @param {string} rule - 规则代码
   * @returns {Object} 验证结果
   */
  validateRule(rule) {
    const errors = []
    const warnings = []

    if (!rule || typeof rule !== 'string') {
      errors.push('规则不能为空')
      return { valid: false, errors, warnings }
    }

    // 基本语法检查
    try {
      new Function('value1', 'value2', 'context', `
        "use strict";
        ${rule.includes('return') ? '' : 'return '}${rule}
      `)
    } catch (error) {
      errors.push(`语法错误: ${error.message}`)
      return { valid: false, errors, warnings }
    }

    // 安全性检查
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /constructor/,
      /prototype/,
      /window/,
      /document/,
      /global/,
      /__proto__/,
      /process/,
      /require/,
      /import/,
      /fetch/,
      /XMLHttpRequest/,
      /setTimeout/,
      /setInterval/,
      /while\s*\(/,
      /for\s*\(/
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(rule)) {
        errors.push(`包含不安全的代码模式: ${pattern.source}`)
      }
    }

    // 性能检查
    if (rule.length > 1000) {
      warnings.push('规则代码过长，可能影响性能')
    }

    const complexityScore = this.calculateComplexity(rule)
    if (complexityScore > 10) {
      warnings.push('规则过于复杂，建议简化')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      complexity: complexityScore
    }
  }

  /**
   * 计算规则复杂度
   * @param {string} rule 
   * @returns {number}
   */
  calculateComplexity(rule) {
    let score = 0
    
    // 操作符复杂度
    const operators = rule.match(/&&|\|\||==|!=|>=|<=|>|<|\+|\-|\*|\/|\%/g) || []
    score += operators.length

    // 函数调用复杂度
    const functions = rule.match(/\w+\s*\(/g) || []
    score += functions.length * 2

    // 嵌套复杂度
    const nesting = rule.split('(').length - 1
    score += nesting

    return score
  }

  /**
   * 执行规则
   * @param {string} rule - 规则代码
   * @param {any} value1 - 值1
   * @param {any} value2 - 值2
   * @param {Object} options - 选项
   * @returns {Object} 执行结果
   */
  executeRule(rule, value1, value2, options = {}) {
    const startTime = performance.now()
    
    try {
      // 验证规则
      const validation = this.validateRule(rule)
      if (!validation.valid) {
        return {
          success: false,
          result: false,
          error: validation.errors[0],
          warnings: validation.warnings,
          executionTime: 0
        }
      }

      // 检查缓存
      const cacheKey = `${rule}|${value1}|${value2}`
      if (this.ruleCache.has(cacheKey)) {
        return {
          ...this.ruleCache.get(cacheKey),
          fromCache: true
        }
      }

      // 创建执行上下文
      const context = this.createSafeContext(value1, value2, options.extraContext)
      
      // 构建安全的执行函数
      const executeFunc = new Function('context', `
        "use strict";
        with (context) {
          ${rule.includes('return') ? '' : 'return '}${rule}
        }
      `)

      // 设置超时保护
      const timeout = options.timeout || 1000
      const result = this.executeWithTimeout(executeFunc, context, timeout)

      const executionTime = performance.now() - startTime
      
      const executeResult = {
        success: true,
        result: Boolean(result),
        error: null,
        warnings: validation.warnings,
        executionTime,
        complexity: validation.complexity
      }

      // 缓存结果
      if (options.enableCache !== false) {
        this.ruleCache.set(cacheKey, executeResult)
      }

      // 记录历史
      this.ruleHistory.push({
        rule,
        value1,
        value2,
        result: executeResult.result,
        timestamp: Date.now(),
        executionTime
      })

      return executeResult

    } catch (error) {
      const executionTime = performance.now() - startTime
      
      return {
        success: false,
        result: false,
        error: `执行错误: ${error.message}`,
        warnings: [],
        executionTime
      }
    }
  }

  /**
   * 带超时的执行
   * @param {Function} func 
   * @param {Object} context 
   * @param {number} timeout 
   * @returns {any}
   */
  executeWithTimeout(func, context, timeout) {
    // 简化版本，实际应用中可以使用 Worker
    return func(context)
  }

  /**
   * 批量测试规则
   * @param {string} rule 
   * @param {Array} testCases 
   * @returns {Object}
   */
  batchTest(rule, testCases) {
    const results = []
    let passCount = 0
    
    for (const testCase of testCases) {
      const { value1, value2, expected, description } = testCase
      const result = this.executeRule(rule, value1, value2)
      
      const passed = result.success && result.result === expected
      if (passed) passCount++
      
      results.push({
        ...testCase,
        actual: result.result,
        passed,
        error: result.error,
        executionTime: result.executionTime
      })
    }
    
    return {
      totalTests: testCases.length,
      passedTests: passCount,
      failedTests: testCases.length - passCount,
      passRate: passCount / testCases.length,
      results
    }
  }

  /**
   * 获取规则建议
   * @param {Array} sampleData 
   * @returns {Array}
   */
  getSuggestions(sampleData) {
    const suggestions = []
    
    if (sampleData.length < 2) return suggestions
    
    // 分析数据类型
    const dataTypes = this.analyzeDataTypes(sampleData)
    
    // 基于数据类型推荐规则
    if (dataTypes.hasNumbers) {
      suggestions.push(...RULE_TEMPLATES.number.rules.slice(0, 3))
    }
    
    if (dataTypes.hasStrings) {
      suggestions.push(...RULE_TEMPLATES.text.rules.slice(0, 3))
    }
    
    if (dataTypes.hasDates) {
      suggestions.push(...RULE_TEMPLATES.date.rules.slice(0, 2))
    }
    
    return suggestions
  }

  /**
   * 分析数据类型
   * @param {Array} data 
   * @returns {Object}
   */
  analyzeDataTypes(data) {
    const sample = data.slice(0, 10) // 取前10个样本
    
    return {
      hasNumbers: sample.some(item => !isNaN(Number(item)) && isFinite(Number(item))),
      hasStrings: sample.some(item => typeof item === 'string' && isNaN(Number(item))),
      hasDates: sample.some(item => !isNaN(Date.parse(item))),
      hasBoolean: sample.some(item => typeof item === 'boolean'),
      uniqueValues: new Set(sample).size,
      totalValues: sample.length
    }
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.ruleCache.clear()
  }

  /**
   * 获取性能统计
   * @returns {Object}
   */
  getPerformanceStats() {
    const recentHistory = this.ruleHistory.slice(-100)
    
    if (recentHistory.length === 0) {
      return { avgExecutionTime: 0, totalExecutions: 0, cacheHitRate: 0 }
    }
    
    const avgExecutionTime = recentHistory.reduce((sum, item) => sum + item.executionTime, 0) / recentHistory.length
    
    return {
      avgExecutionTime: Math.round(avgExecutionTime * 100) / 100,
      totalExecutions: this.ruleHistory.length,
      cacheSize: this.ruleCache.size,
      recentExecutions: recentHistory.length
    }
  }

  /**
   * 启用调试模式
   */
  enableDebug() {
    this.debugMode = true
  }

  /**
   * 禁用调试模式
   */
  disableDebug() {
    this.debugMode = false
  }
}

// 创建全局实例
export const advancedRuleEngine = new AdvancedRuleEngine()

// 初始化内置函数
advancedRuleEngine.initBuiltinFunctions()

/**
 * 获取所有规则模板
 * @returns {Array}
 */
export function getAllRuleTemplates() {
  const templates = []
  for (const category of Object.values(RULE_TEMPLATES)) {
    templates.push(...category.rules)
  }
  return templates
}

/**
   * 按分类获取规则模板
   * @param {string} categoryId 
   * @returns {Array}
   */
export function getRuleTemplatesByCategory(categoryId) {
  return RULE_TEMPLATES[categoryId]?.rules || []
}

/**
 * 搜索规则模板
 * @param {string} keyword 
 * @returns {Array}
 */
export function searchRuleTemplates(keyword) {
  const templates = getAllRuleTemplates()
  const lowerKeyword = keyword.toLowerCase()
  
  return templates.filter(template => 
    template.name.toLowerCase().includes(lowerKeyword) ||
    template.description.toLowerCase().includes(lowerKeyword) ||
    template.category.toLowerCase().includes(lowerKeyword)
  )
}