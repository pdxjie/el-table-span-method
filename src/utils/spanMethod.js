/**
 * El-Table Span Method 核心工具函数
 * 用于生成表格合并逻辑
 */

/**
 * 生成 span-method 函数
 * @param {Array} tableData - 表格数据
 * @param {Object} config - 合并配置
 * @param {Object} params - span-method 参数 { row, column, rowIndex, columnIndex }
 * @returns {Object} { rowspan, colspan }
 */
export function generateSpanMethod(tableData, config, params) {
  const { row, column, rowIndex, columnIndex } = params
  const { 
    mergeType = 'row', 
    mergeColumns = [], 
    mergeCondition = 'same',
    customRule = '',
    startRow = 0,
    endRow
  } = config

  // 检查是否在合并范围内
  if (rowIndex < startRow || (endRow !== null && endRow !== undefined && rowIndex > endRow)) {
    return { rowspan: 1, colspan: 1 }
  }

  // 检查是否为要合并的列
  if (!mergeColumns.includes(column.property)) {
    return { rowspan: 1, colspan: 1 }
  }

  switch (mergeType) {
    case 'row':
      return calculateRowSpan(tableData, config, params)
    case 'column':
      return calculateColumnSpan(tableData, config, params)
    case 'mixed':
      return calculateMixedSpan(tableData, config, params)
    default:
      return { rowspan: 1, colspan: 1 }
  }
}

/**
 * 计算行合并
 * @param {Array} tableData - 表格数据
 * @param {Object} config - 合并配置
 * @param {Object} params - span-method 参数
 * @returns {Object} { rowspan, colspan }
 */
function calculateRowSpan(tableData, config, params) {
  const { row, column, rowIndex } = params
  const { mergeCondition, customRule } = config
  const currentValue = row[column.property]
  
  let rowspan = 1
  const colspan = 1

  // 向下查找相同值
  for (let i = rowIndex + 1; i < tableData.length; i++) {
    if (shouldMerge(tableData[i][column.property], currentValue, mergeCondition, customRule)) {
      rowspan++
    } else {
      break
    }
  }

  // 检查是否为合并区域的第一行
  for (let i = rowIndex - 1; i >= 0; i--) {
    if (shouldMerge(tableData[i][column.property], currentValue, mergeCondition, customRule)) {
      return { rowspan: 0, colspan: 0 }
    } else {
      break
    }
  }

  return { rowspan, colspan }
}

/**
 * 计算列合并
 * @param {Array} tableData - 表格数据
 * @param {Object} config - 合并配置
 * @param {Object} params - span-method 参数
 * @returns {Object} { rowspan, colspan }
 */
function calculateColumnSpan(tableData, config, params) {
  const { row, rowIndex } = params
  const { mergeColumns, mergeCondition, customRule } = config
  
  const rowspan = 1
  let colspan = 1
  
  // 获取当前行的所有字段
  const fields = Object.keys(row)
  const currentColumnIndex = fields.findIndex(field => mergeColumns.includes(field))
  
  if (currentColumnIndex === -1) {
    return { rowspan, colspan }
  }
  
  // 向右查找相同值的列
  for (let i = currentColumnIndex + 1; i < fields.length; i++) {
    const currentField = fields[i]
    const nextField = fields[i]
    
    if (mergeColumns.includes(nextField) && 
        shouldMerge(row[currentField], row[nextField], mergeCondition, customRule)) {
      colspan++
    } else {
      break
    }
  }
  
  // 检查是否为合并区域的第一列
  for (let i = currentColumnIndex - 1; i >= 0; i--) {
    const prevField = fields[i]
    const currentField = fields[currentColumnIndex]
    
    if (mergeColumns.includes(prevField) && 
        shouldMerge(row[prevField], row[currentField], mergeCondition, customRule)) {
      return { rowspan: 0, colspan: 0 }
    } else {
      break
    }
  }
  
  return { rowspan, colspan }
}

/**
 * 计算混合合并（行列同时合并）
 * @param {Array} tableData - 表格数据
 * @param {Object} config - 合并配置
 * @param {Object} params - span-method 参数
 * @returns {Object} { rowspan, colspan }
 */
function calculateMixedSpan(tableData, config, params) {
  const { row, column, rowIndex, columnIndex } = params
  const { mergeColumns, mergeCondition, customRule } = config
  
  // 先计算行合并
  const rowSpan = calculateRowSpan(tableData, config, params)
  
  if (rowSpan.rowspan === 0 && rowSpan.colspan === 0) {
    return rowSpan
  }
  
  // 再计算列合并
  const colSpan = calculateColumnSpan(tableData, config, params)
  
  if (colSpan.rowspan === 0 && colSpan.colspan === 0) {
    return colSpan
  }
  
  // 检查合并区域内的所有单元格是否都满足合并条件
  const currentValue = row[column.property]
  
  for (let r = rowIndex; r < rowIndex + rowSpan.rowspan; r++) {
    for (let c = columnIndex; c < columnIndex + colSpan.colspan; c++) {
      if (r < tableData.length) {
        const fields = Object.keys(tableData[r])
        if (c < fields.length) {
          const fieldName = fields[c]
          if (mergeColumns.includes(fieldName)) {
            const cellValue = tableData[r][fieldName]
            if (!shouldMerge(cellValue, currentValue, mergeCondition, customRule)) {
              return { rowspan: 1, colspan: 1 }
            }
          }
        }
      }
    }
  }
  
  return { 
    rowspan: rowSpan.rowspan, 
    colspan: colSpan.colspan 
  }
}

/**
 * 判断两个值是否应该合并
 * @param {any} value1 - 值1
 * @param {any} value2 - 值2
 * @param {string} condition - 合并条件 'same' | 'custom'
 * @param {string} customRule - 自定义规则代码
 * @returns {boolean} 是否应该合并
 */
function shouldMerge(value1, value2, condition = 'same', customRule = '') {
  if (condition === 'same') {
    return value1 === value2
  } else if (condition === 'custom' && customRule) {
    try {
      // 创建自定义规则函数
      const mergeFunction = new Function('value1', 'value2', `return ${customRule}`)
      return mergeFunction(value1, value2)
    } catch (error) {
      console.error('自定义合并规则执行错误:', error)
      return value1 === value2
    }
  }
  
  return value1 === value2
}

/**
 * 生成合并预览数据
 * @param {Array} tableData - 表格数据
 * @param {Object} config - 合并配置
 * @returns {Array} 合并预览数据
 */
export function generateMergePreview(tableData, config) {
  const preview = []
  const fields = tableData.length > 0 ? Object.keys(tableData[0]) : []
  
  for (let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
    const row = tableData[rowIndex]
    const previewRow = { ...row, _mergeInfo: {} }
    
    for (let columnIndex = 0; columnIndex < fields.length; columnIndex++) {
      const field = fields[columnIndex]
      const spanResult = generateSpanMethod(tableData, config, {
        row,
        column: { property: field },
        rowIndex,
        columnIndex
      })
      
      previewRow._mergeInfo[field] = spanResult
    }
    
    preview.push(previewRow)
  }
  
  return preview
}

/**
 * 验证合并配置
 * @param {Object} config - 合并配置
 * @param {Array} tableData - 表格数据
 * @returns {Object} 验证结果 { valid: boolean, errors: string[] }
 */
export function validateMergeConfig(config, tableData) {
  const errors = []
  
  if (!config.mergeColumns || config.mergeColumns.length === 0) {
    errors.push('请选择至少一个要合并的列')
  }
  
  if (tableData.length === 0) {
    errors.push('请先导入表格数据')
  }
  
  if (tableData.length > 0) {
    const fields = Object.keys(tableData[0])
    const invalidColumns = config.mergeColumns.filter(col => !fields.includes(col))
    if (invalidColumns.length > 0) {
      errors.push(`无效的列名: ${invalidColumns.join(', ')}`)
    }
  }
  
  if (config.mergeCondition === 'custom' && !config.customRule) {
    errors.push('请输入自定义合并规则')
  }
  
  if (config.customRule) {
    try {
      new Function('value1', 'value2', `return ${config.customRule}`)
    } catch (error) {
      errors.push(`自定义规则语法错误: ${error.message}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 获取建议的合并配置
 * @param {Array} tableData - 表格数据
 * @returns {Object} 建议的配置
 */
export function getSuggestedConfig(tableData) {
  if (tableData.length === 0) {
    return {
      mergeType: 'row',
      mergeColumns: [],
      mergeCondition: 'same'
    }
  }
  
  const fields = Object.keys(tableData[0])
  const suggestions = {
    mergeType: 'row',
    mergeColumns: [],
    mergeCondition: 'same'
  }
  
  // 分析哪些列有重复值，建议合并
  for (const field of fields) {
    const values = tableData.map(row => row[field])
    const uniqueValues = new Set(values)
    
    // 如果重复值较多，建议合并
    if (uniqueValues.size < values.length * 0.8) {
      suggestions.mergeColumns.push(field)
    }
  }
  
  return suggestions
}