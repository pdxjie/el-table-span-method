/**
 * 高性能文件处理工具
 * 支持 JSON, CSV, Excel 格式
 */
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

/**
 * 文件处理器类
 */
export class FileProcessor {
  constructor() {
    this.supportedTypes = {
      'application/json': 'json',
      'text/csv': 'csv',
      'application/vnd.ms-excel': 'excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
      'application/vnd.ms-excel.sheet.macroEnabled.12': 'excel'
    }
    
    this.supportedExtensions = ['.json', '.csv', '.xlsx', '.xls']
  }

  /**
   * 检查文件是否支持
   * @param {File} file - 文件对象
   * @returns {boolean} 是否支持
   */
  isSupported(file) {
    const extension = this.getFileExtension(file.name)
    return this.supportedExtensions.includes(extension) || 
           this.supportedTypes[file.type]
  }

  /**
   * 获取文件扩展名
   * @param {string} filename - 文件名
   * @returns {string} 扩展名
   */
  getFileExtension(filename) {
    return filename.toLowerCase().substring(filename.lastIndexOf('.'))
  }

  /**
   * 获取文件类型
   * @param {File} file - 文件对象
   * @returns {string} 文件类型
   */
  getFileType(file) {
    const extension = this.getFileExtension(file.name)
    
    if (extension === '.json') return 'json'
    if (extension === '.csv') return 'csv'
    if (['.xlsx', '.xls'].includes(extension)) return 'excel'
    
    return this.supportedTypes[file.type] || 'unknown'
  }

  /**
   * 处理文件并转换为表格数据
   * @param {File} file - 文件对象
   * @param {Object} options - 处理选项
   * @returns {Promise<Array>} 表格数据
   */
  async processFile(file, options = {}) {
    const fileType = this.getFileType(file)
    
    if (!this.isSupported(file)) {
      throw new Error(`不支持的文件格式: ${file.name}`)
    }

    // 文件大小检查（默认最大 10MB）
    const maxSize = options.maxSize || 10 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error(`文件大小超过限制 (${(maxSize / 1024 / 1024).toFixed(1)}MB)`)
    }

    switch (fileType) {
      case 'json':
        return this.processJsonFile(file, options)
      case 'csv':
        return this.processCsvFile(file, options)
      case 'excel':
        return this.processExcelFile(file, options)
      default:
        throw new Error(`不支持的文件类型: ${fileType}`)
    }
  }

  /**
   * 处理 JSON 文件
   * @param {File} file - 文件对象
   * @param {Object} options - 处理选项
   * @returns {Promise<Array>} 表格数据
   */
  async processJsonFile(file, options = {}) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const text = event.target.result
          const data = JSON.parse(text)
          
          if (!Array.isArray(data)) {
            reject(new Error('JSON 文件必须包含数组格式的数据'))
            return
          }
          
          if (data.length === 0) {
            reject(new Error('JSON 文件不能为空'))
            return
          }
          
          // 数据量检查
          const maxRows = options.maxRows || 5000
          if (data.length > maxRows) {
            reject(new Error(`数据行数超过限制 (${maxRows} 行)`))
            return
          }
          
          // 验证数据结构
          const validatedData = this.validateAndCleanData(data)
          resolve(validatedData)
          
        } catch (error) {
          reject(new Error(`JSON 解析错误: ${error.message}`))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }
      
      reader.readAsText(file, 'UTF-8')
    })
  }

  /**
   * 处理 CSV 文件
   * @param {File} file - 文件对象
   * @param {Object} options - 处理选项
   * @returns {Promise<Array>} 表格数据
   */
  async processCsvFile(file, options = {}) {
    return new Promise((resolve, reject) => {
      const maxRows = options.maxRows || 5000
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        worker: true, // 使用 Web Worker 提升性能
        preview: maxRows, // 限制预览行数
        complete: (results) => {
          try {
            if (results.errors && results.errors.length > 0) {
              const criticalErrors = results.errors.filter(error => 
                error.type === 'Delimiter' || error.type === 'Quotes'
              )
              if (criticalErrors.length > 0) {
                reject(new Error(`CSV 解析错误: ${criticalErrors[0].message}`))
                return
              }
            }
            
            if (!results.data || results.data.length === 0) {
              reject(new Error('CSV 文件不能为空'))
              return
            }
            
            const validatedData = this.validateAndCleanData(results.data)
            resolve(validatedData)
            
          } catch (error) {
            reject(new Error(`CSV 处理错误: ${error.message}`))
          }
        },
        error: (error) => {
          reject(new Error(`CSV 解析失败: ${error.message}`))
        }
      })
    })
  }

  /**
   * 处理 Excel 文件 - 增强版
   * @param {File} file - 文件对象
   * @param {Object} options - 处理选项
   * @returns {Promise<Object>} Excel 解析结果
   */
  async processExcelFile(file, options = {}) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result)
          const workbook = XLSX.read(data, { type: 'array', cellStyles: true })
          
          // 获取第一个工作表
          const sheetName = workbook.SheetNames[0]
          if (!sheetName) {
            reject(new Error('Excel 文件中没有找到工作表'))
            return
          }
          
          const worksheet = workbook.Sheets[sheetName]
          
          // 解析原始表格结构
          const rawData = this.parseExcelSheet(worksheet, options)
          
          // 智能识别表头
          const headerAnalysis = this.analyzeExcelHeaders(rawData)
          
          // 提供多种解析选项
          const parseOptions = this.generateParseOptions(rawData, headerAnalysis)
          
          resolve({
            sheetName,
            rawData,
            headerAnalysis,
            parseOptions,
            originalStructure: this.preserveOriginalStructure(worksheet)
          })
          
        } catch (error) {
          reject(new Error(`Excel 解析错误: ${error.message}`))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }
      
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * 解析 Excel 工作表，保留原始结构
   * @param {Object} worksheet - 工作表对象
   * @param {Object} options - 选项
   * @returns {Array} 原始数据结构
   */
  parseExcelSheet(worksheet, options = {}) {
    const maxRows = options.maxRows || 100 // 增加默认预览行数
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    
    const rawData = []
    for (let row = range.s.r; row <= Math.min(range.e.r, maxRows - 1); row++) {
      const rowData = []
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        const cell = worksheet[cellAddress]
        
        rowData.push({
          value: cell ? (cell.v !== undefined ? String(cell.v) : '') : '',
          type: cell ? cell.t : '',
          style: cell ? cell.s : null,
          address: cellAddress,
          merged: this.isCellMerged(worksheet, row, col)
        })
      }
      rawData.push(rowData)
    }
    
    return rawData
  }

  /**
   * 检查单元格是否被合并
   * @param {Object} worksheet - 工作表
   * @param {number} row - 行号
   * @param {number} col - 列号
   * @returns {Object|null} 合并信息
   */
  isCellMerged(worksheet, row, col) {
    if (!worksheet['!merges']) return null
    
    for (const merge of worksheet['!merges']) {
      if (row >= merge.s.r && row <= merge.e.r && 
          col >= merge.s.c && col <= merge.e.c) {
        return {
          startRow: merge.s.r,
          endRow: merge.e.r,
          startCol: merge.s.c,
          endCol: merge.e.c,
          isFirstCell: row === merge.s.r && col === merge.s.c
        }
      }
    }
    
    return null
  }

  /**
   * 智能分析 Excel 表头结构
   * @param {Array} rawData - 原始数据
   * @returns {Object} 表头分析结果
   */
  analyzeExcelHeaders(rawData) {
    if (rawData.length === 0) return { headerRows: [], suggestions: [] }
    
    const analysis = {
      headerRows: [],
      suggestions: [],
      patterns: []
    }
    
    // 检查前几行，识别可能的表头
    for (let i = 0; i < Math.min(rawData.length, 10); i++) {
      const row = rawData[i]
      const rowAnalysis = this.analyzeRow(row, i, rawData)
      
      analysis.headerRows.push(rowAnalysis)
      
      // 如果这行看起来像表头
      if (rowAnalysis.isLikelyHeader) {
        analysis.suggestions.push({
          rowIndex: i,
          confidence: rowAnalysis.confidence,
          reason: rowAnalysis.reason,
          preview: this.generateTablePreview(rawData, i)
        })
      }
    }
    
    return analysis
  }

  /**
   * 分析单行数据特征
   * @param {Array} row - 行数据
   * @param {number} rowIndex - 行索引
   * @param {Array} allData - 全部数据
   * @returns {Object} 行分析结果
   */
  analyzeRow(row, rowIndex, allData) {
    const nonEmptyValues = row.filter(cell => cell.value.trim() !== '')
    const totalCells = row.length
    
    let confidence = 0
    let reasons = []
    
    // 检查非空值比例
    const fillRate = nonEmptyValues.length / totalCells
    if (fillRate > 0.5) {
      confidence += 0.3
      reasons.push('填充率高')
    }
    
    // 检查是否包含典型的表头词汇
    const headerKeywords = ['名称', 'name', '编号', 'id', '日期', 'date', '金额', 'amount', '数量', 'count', '类型', 'type']
    const hasHeaderKeywords = nonEmptyValues.some(cell => 
      headerKeywords.some(keyword => 
        cell.value.toLowerCase().includes(keyword.toLowerCase())
      )
    )
    
    if (hasHeaderKeywords) {
      confidence += 0.4
      reasons.push('包含表头关键词')
    }
    
    // 检查字符类型（表头通常是文字，数据行通常包含数字）
    const textCells = nonEmptyValues.filter(cell => isNaN(cell.value))
    const numberCells = nonEmptyValues.filter(cell => !isNaN(cell.value) && cell.value !== '')
    
    if (textCells.length > numberCells.length && nonEmptyValues.length > 2) {
      confidence += 0.3
      reasons.push('文本内容占主导')
    }
    
    // 检查后续行是否看起来像数据
    if (rowIndex < allData.length - 2) {
      const nextRowsHaveData = allData.slice(rowIndex + 1, rowIndex + 3)
        .every(nextRow => nextRow.filter(cell => cell.value.trim() !== '').length > 0)
      
      if (nextRowsHaveData) {
        confidence += 0.2
        reasons.push('后续行包含数据')
      }
    }
    
    return {
      rowIndex,
      isLikelyHeader: confidence > 0.6,
      confidence,
      reason: reasons.join(', '),
      fillRate,
      textCells: textCells.length,
      numberCells: numberCells.length,
      values: nonEmptyValues.map(cell => cell.value)
    }
  }

  /**
   * 生成表格预览
   * @param {Array} rawData - 原始数据
   * @param {number} headerRowIndex - 表头行索引
   * @returns {Object} 预览数据
   */
  generateTablePreview(rawData, headerRowIndex) {
    if (headerRowIndex >= rawData.length) return null
    
    const headerRow = rawData[headerRowIndex]
    const headers = headerRow.map((cell, index) => ({
      index,
      value: cell.value || `列${index + 1}`,
      originalValue: cell.value
    })).filter(h => h.value.trim() !== '')
    
    const dataRows = rawData.slice(headerRowIndex + 1).map(row => {
      const rowObj = {}
      headers.forEach(header => {
        if (row[header.index]) {
          rowObj[header.value] = row[header.index].value
        }
      })
      return rowObj
    }).filter(row => Object.values(row).some(v => v && v.trim() !== ''))
    
    return {
      headers,
      dataRows: dataRows.slice(0, 5), // 只预览前5行
      totalRows: dataRows.length
    }
  }

  /**
   * 生成解析选项
   * @param {Array} rawData - 原始数据
   * @param {Object} headerAnalysis - 表头分析
   * @returns {Array} 解析选项列表
   */
  generateParseOptions(rawData, headerAnalysis) {
    const options = []
    
    // 添加建议的表头选项
    headerAnalysis.suggestions.forEach(suggestion => {
      options.push({
        type: 'suggested',
        label: `第${suggestion.rowIndex + 1}行作为表头 (推荐度: ${Math.round(suggestion.confidence * 100)}%)`,
        headerRowIndex: suggestion.rowIndex,
        reason: suggestion.reason,
        preview: suggestion.preview
      })
    })
    
    // 添加手动选项
    for (let i = 0; i < Math.min(rawData.length, 10); i++) {
      const hasContent = rawData[i].some(cell => cell.value.trim() !== '')
      if (hasContent) {
        options.push({
          type: 'manual',
          label: `第${i + 1}行作为表头`,
          headerRowIndex: i,
          preview: this.generateTablePreview(rawData, i)
        })
      }
    }
    
    // 添加无表头选项
    options.push({
      type: 'no-header',
      label: '无表头，使用默认列名',
      headerRowIndex: -1,
      preview: this.generateTablePreviewWithoutHeader(rawData)
    })
    
    return options
  }

  /**
   * 生成无表头的预览
   * @param {Array} rawData - 原始数据
   * @returns {Object} 预览数据
   */
  generateTablePreviewWithoutHeader(rawData) {
    if (rawData.length === 0) return null
    
    const maxCols = Math.max(...rawData.map(row => row.length))
    const headers = Array.from({ length: maxCols }, (_, i) => ({
      index: i,
      value: `列${i + 1}`,
      originalValue: ''
    }))
    
    const dataRows = rawData.map(row => {
      const rowObj = {}
      headers.forEach(header => {
        if (row[header.index]) {
          rowObj[header.value] = row[header.index].value
        }
      })
      return rowObj
    }).filter(row => Object.values(row).some(v => v && v.trim() !== ''))
    
    return {
      headers,
      dataRows: dataRows.slice(0, 5),
      totalRows: dataRows.length
    }
  }

  /**
   * 保留原始 Excel 结构信息
   * @param {Object} worksheet - 工作表
   * @returns {Object} 原始结构信息
   */
  preserveOriginalStructure(worksheet) {
    return {
      range: worksheet['!ref'],
      merges: worksheet['!merges'] || [],
      cols: worksheet['!cols'] || [],
      rows: worksheet['!rows'] || []
    }
  }

  /**
   * 根据选择的选项解析为标准表格数据
   * @param {Object} excelResult - Excel 解析结果
   * @param {Object} selectedOption - 选择的解析选项
   * @returns {Array} 标准表格数据
   */
  parseWithSelectedOption(excelResult, selectedOption) {
    const { rawData } = excelResult
    const { headerRowIndex } = selectedOption
    
    if (headerRowIndex === -1) {
      // 无表头模式
      return this.convertToStandardFormat(rawData, null)
    } else {
      // 有表头模式
      const headerRow = rawData[headerRowIndex]
      const dataRows = rawData.slice(headerRowIndex + 1)
      return this.convertToStandardFormat(dataRows, headerRow)
    }
  }

  /**
   * 转换为标准格式
   * @param {Array} dataRows - 数据行
   * @param {Array|null} headerRow - 表头行
   * @returns {Array} 标准格式数据
   */
  convertToStandardFormat(dataRows, headerRow = null) {
    if (dataRows.length === 0) return []
    
    const maxCols = Math.max(...dataRows.map(row => row.length))
    const headers = headerRow 
      ? headerRow.map((cell, index) => cell.value.trim() || `列${index + 1}`)
      : Array.from({ length: maxCols }, (_, i) => `列${i + 1}`)
    
    return dataRows.map(row => {
      const rowObj = {}
      headers.forEach((header, index) => {
        const cellValue = row[index] ? row[index].value : ''
        rowObj[header] = typeof cellValue === 'string' ? cellValue.trim() : String(cellValue)
      })
      return rowObj
    }).filter(row => {
      // 过滤掉完全空的行
      return Object.values(row).some(value => value !== '')
    })
  }

  /**
   * 验证和清理数据
   * @param {Array} data - 原始数据
   * @returns {Array} 清理后的数据
   */
  validateAndCleanData(data) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('数据格式不正确')
    }

    // 获取第一行的字段作为标准
    const firstRow = data[0]
    if (!firstRow || typeof firstRow !== 'object') {
      throw new Error('数据格式不正确，需要对象数组')
    }

    const fields = Object.keys(firstRow)
    if (fields.length === 0) {
      throw new Error('数据中没有找到有效字段')
    }

    // 清理和标准化数据
    const cleanedData = data.map((row, index) => {
      const cleanedRow = {}
      
      fields.forEach(field => {
        let value = row[field]
        
        // 处理各种数据类型
        if (value === null || value === undefined) {
          value = ''
        } else if (typeof value === 'number') {
          value = value.toString()
        } else if (typeof value === 'boolean') {
          value = value.toString()
        } else {
          value = String(value).trim()
        }
        
        cleanedRow[field] = value
      })
      
      return cleanedRow
    }).filter(row => {
      // 过滤掉完全空的行
      return Object.values(row).some(value => value !== '')
    })

    if (cleanedData.length === 0) {
      throw new Error('处理后没有有效数据')
    }

    return cleanedData
  }

  /**
   * 获取文件信息
   * @param {File} file - 文件对象
   * @returns {Object} 文件信息
   */
  getFileInfo(file) {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      extension: this.getFileExtension(file.name),
      fileType: this.getFileType(file),
      isSupported: this.isSupported(file),
      sizeText: this.formatFileSize(file.size)
    }
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// 创建单例实例
export const fileProcessor = new FileProcessor()