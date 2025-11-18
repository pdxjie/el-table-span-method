import { UILibraryAdapter } from './UILibraryAdapter.js'

/**
 * Element Plus/Element UI 适配器
 */
export class ElementAdapter extends UILibraryAdapter {
  constructor(config = {}) {
    super(config)
    this.name = 'Element Plus'
    this.version = '2.8.x'
    this.cdnLinks = {
      css: ['https://unpkg.com/element-plus/dist/index.css'],
      js: ['https://unpkg.com/element-plus/dist/index.full.js']
    }
  }

  getFeatures() {
    return {
      rowSpan: true,
      colSpan: true,
      mixedSpan: true,
      customRender: true,
      virtualScroll: true,
      sortable: true,
      resizable: true
    }
  }

  generateSpanMethod(config) {
    const { mergeType, mergeColumns, mergeCondition, customRule } = config
    
    return `const spanMethod = ({ row, column, rowIndex, columnIndex }) => {
  const mergeColumns = ${JSON.stringify(mergeColumns)}
  const mergeType = '${mergeType}'
  
  if (!mergeColumns.includes(column.property)) {
    return { rowspan: 1, colspan: 1 }
  }

  if (mergeType === 'row') {
    return calculateRowSpan({ row, column, rowIndex, columnIndex })
  } else if (mergeType === 'column') {
    return calculateColumnSpan({ row, column, rowIndex, columnIndex })
  } else if (mergeType === 'mixed') {
    return calculateMixedSpan({ row, column, rowIndex, columnIndex })
  }
  
  return { rowspan: 1, colspan: 1 }
}

const calculateRowSpan = ({ row, column, rowIndex, columnIndex }) => {
  const currentValue = row[column.property]
  let rowspan = 1
  let colspan = 1

  for (let i = rowIndex + 1; i < tableData.value.length; i++) {
    if (shouldMerge(tableData.value[i][column.property], currentValue)) {
      rowspan++
    } else {
      break
    }
  }

  for (let i = rowIndex - 1; i >= 0; i--) {
    if (shouldMerge(tableData.value[i][column.property], currentValue)) {
      return { rowspan: 0, colspan: 0 }
    } else {
      break
    }
  }

  return { rowspan, colspan }
}

const shouldMerge = (value1, value2) => {
  ${mergeCondition === 'custom' && customRule ? 
    `try {
    return (${customRule})(value1, value2)
  } catch (error) {
    console.error('自定义规则执行错误:', error)
    return value1 === value2
  }` : 
    'return value1 === value2'
  }
}`
  }

  generateVue3Code(config) {
    const { mergeColumns, showBorder, stripe } = config
    const spanMethodCode = this.generateSpanMethod(config)

    return `<template>
  <div class="table-container">
    <el-table
      :data="tableData"
      :span-method="spanMethod"
      :border="${showBorder || true}"
      :stripe="${stripe || false}"
      style="width: 100%"
    >
      <el-table-column
        v-for="field in tableFields"
        :key="field"
        :prop="field"
        :label="field"
        show-overflow-tooltip
      />
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const tableData = ref([
  // 在这里添加你的数据
])

const tableFields = computed(() => {
  if (tableData.value.length === 0) return []
  return Object.keys(tableData.value[0])
})

${spanMethodCode}
</script>

<style scoped>
.table-container {
  padding: 20px;
}
</style>`
  }

  generateVue2Code(config) {
    const { mergeColumns, mergeType, mergeCondition, customRule, showBorder, stripe } = config

    return `<template>
  <div class="table-container">
    <el-table
      :data="tableData"
      :span-method="spanMethod"
      :border="${showBorder || true}"
      :stripe="${stripe || false}"
      style="width: 100%"
    >
      <el-table-column
        v-for="field in tableFields"
        :key="field"
        :prop="field"
        :label="field"
        show-overflow-tooltip
      />
    </el-table>
  </div>
</template>

<script>
export default {
  name: 'TableWithSpan',
  data() {
    return {
      tableData: [
        // 在这里添加你的数据
      ],
      mergeColumns: ${JSON.stringify(mergeColumns)},
      mergeType: '${mergeType}'
    }
  },
  computed: {
    tableFields() {
      if (this.tableData.length === 0) return []
      return Object.keys(this.tableData[0])
    }
  },
  methods: {
    spanMethod({ row, column, rowIndex, columnIndex }) {
      if (!this.mergeColumns.includes(column.property)) {
        return { rowspan: 1, colspan: 1 }
      }

      if (this.mergeType === 'row') {
        return this.calculateRowSpan({ row, column, rowIndex, columnIndex })
      } else if (this.mergeType === 'column') {
        return this.calculateColumnSpan({ row, column, rowIndex, columnIndex })
      } else if (this.mergeType === 'mixed') {
        return this.calculateMixedSpan({ row, column, rowIndex, columnIndex })
      }

      return { rowspan: 1, colspan: 1 }
    },

    calculateRowSpan({ row, column, rowIndex, columnIndex }) {
      const currentValue = row[column.property]
      let rowspan = 1
      let colspan = 1

      // 向下扫描：计算相同值的连续行数
      for (let i = rowIndex + 1; i < this.tableData.length; i++) {
        if (this.shouldMerge(this.tableData[i][column.property], currentValue)) {
          rowspan++
        } else {
          break
        }
      }

      // 向上检查：判断是否为合并区域的第一行
      for (let i = rowIndex - 1; i >= 0; i--) {
        if (this.shouldMerge(this.tableData[i][column.property], currentValue)) {
          return { rowspan: 0, colspan: 0 }
        } else {
          break
        }
      }

      return { rowspan, colspan }
    },

    calculateColumnSpan({ row, column, rowIndex, columnIndex }) {
      const currentValue = row[column.property]
      let rowspan = 1
      let colspan = 1
      const allFields = this.tableFields

      // 向右扫描：计算相同值的连续列数
      for (let i = columnIndex + 1; i < allFields.length; i++) {
        const nextField = allFields[i]
        if (!this.mergeColumns.includes(nextField)) break

        if (this.shouldMerge(row[nextField], currentValue)) {
          colspan++
        } else {
          break
        }
      }

      // 向左检查：判断是否为合并区域的第一列
      for (let i = columnIndex - 1; i >= 0; i--) {
        const prevField = allFields[i]
        if (!this.mergeColumns.includes(prevField)) break

        if (this.shouldMerge(row[prevField], currentValue)) {
          return { rowspan: 0, colspan: 0 }
        } else {
          break
        }
      }

      return { rowspan, colspan }
    },

    calculateMixedSpan({ row, column, rowIndex, columnIndex }) {
      const currentValue = row[column.property]
      const allFields = this.tableFields
      let rowspan = 1
      let colspan = 1

      // 1. 先计算行合并
      for (let i = rowIndex + 1; i < this.tableData.length; i++) {
        if (this.shouldMerge(this.tableData[i][column.property], currentValue)) {
          rowspan++
        } else {
          break
        }
      }

      // 2. 再计算列合并
      for (let i = columnIndex + 1; i < allFields.length; i++) {
        const nextField = allFields[i]
        if (!this.mergeColumns.includes(nextField)) break

        // 检查这一列的所有相关行是否都有相同值
        let canMergeColumn = true
        for (let r = rowIndex; r < rowIndex + rowspan; r++) {
          if (!this.shouldMerge(this.tableData[r][nextField], currentValue)) {
            canMergeColumn = false
            break
          }
        }

        if (canMergeColumn) {
          colspan++
        } else {
          break
        }
      }

      // 3. 检查是否应该隐藏（向上检查行）
      for (let i = rowIndex - 1; i >= 0; i--) {
        if (this.shouldMerge(this.tableData[i][column.property], currentValue)) {
          return { rowspan: 0, colspan: 0 }
        } else {
          break
        }
      }

      // 检查是否应该隐藏（向左检查列）
      for (let i = columnIndex - 1; i >= 0; i--) {
        const prevField = allFields[i]
        if (!this.mergeColumns.includes(prevField)) break

        if (this.shouldMerge(row[prevField], currentValue)) {
          return { rowspan: 0, colspan: 0 }
        } else {
          break
        }
      }

      return { rowspan, colspan }
    },

    shouldMerge(value1, value2) {
      ${mergeCondition === 'custom' && customRule ?
        `try {
        return (${customRule})(value1, value2)
      } catch (error) {
        console.error('自定义规则执行错误:', error)
        return value1 === value2
      }` :
        'return value1 === value2'
      }
    }
  }
}
</script>

<style scoped>
.table-container {
  padding: 20px;
}
</style>`
  }

  getTableConfig(config) {
    return {
      component: 'el-table',
      props: {
        'span-method': 'spanMethod',
        border: config.showBorder || true,
        stripe: config.stripe || false,
        'show-overflow-tooltip': true
      },
      columnComponent: 'el-table-column',
      columnProps: {
        'show-overflow-tooltip': true
      }
    }
  }

  getInstallCommands() {
    return {
      npm: 'npm install element-plus',
      yarn: 'yarn add element-plus',
      pnpm: 'pnpm add element-plus'
    }
  }

  getImportStatements() {
    return [
      "import ElementPlus from 'element-plus'",
      "import 'element-plus/dist/index.css'"
    ]
  }

  getDocumentation() {
    return {
      notes: [
        'Element Plus 使用 span-method 属性来实现单元格合并',
        '返回值格式：{ rowspan: number, colspan: number }',
        'rowspan/colspan 为 0 时隐藏单元格'
      ],
      links: [
        {
          title: 'Element Plus 表格文档',
          url: 'https://element-plus.org/zh-CN/component/table.html#%E5%90%88%E5%B9%B6%E8%A1%8C%E6%88%96%E5%88%97'
        }
      ]
    }
  }
}

/**
 * Ant Design Vue 适配器
 */
export class AntdAdapter extends UILibraryAdapter {
  constructor(config = {}) {
    super(config)
    this.name = 'Ant Design Vue'
    this.version = '4.x'
    this.cdnLinks = {
      css: ['https://unpkg.com/ant-design-vue/dist/antd.min.css'],
      js: ['https://unpkg.com/ant-design-vue/dist/antd.min.js']
    }
  }

  getFeatures() {
    return {
      rowSpan: true,
      colSpan: false, // Ant Design Vue 对列合并支持有限
      mixedSpan: false, // 混合合并会降级为行合并
      customRender: true,
      virtualScroll: false,
      sortable: true,
      resizable: false
    }
  }

  generateSpanMethod(config) {
    const { mergeType, mergeColumns, mergeCondition, customRule } = config
    
    return `const processDataForMerge = (tableData) => {
  const processedData = []
  const mergeColumns = ${JSON.stringify(mergeColumns)}
  
  for (let i = 0; i < tableData.length; i++) {
    const row = { ...tableData[i] }
    
    mergeColumns.forEach(column => {
      const spanInfo = calculateSpanForRow(tableData, i, column)
      row[\`\${column}_rowSpan\`] = spanInfo.rowSpan
      row[\`\${column}_colSpan\`] = spanInfo.colSpan
    })
    
    processedData.push(row)
  }
  
  return processedData
}

const calculateSpanForRow = (data, rowIndex, column) => {
  const currentValue = data[rowIndex][column]
  let rowSpan = 1
  let colSpan = 1

  // 计算行合并
  for (let i = rowIndex + 1; i < data.length; i++) {
    if (shouldMerge(data[i][column], currentValue)) {
      rowSpan++
    } else {
      break
    }
  }

  // 检查是否为合并区域的第一行
  for (let i = rowIndex - 1; i >= 0; i--) {
    if (shouldMerge(data[i][column], currentValue)) {
      return { rowSpan: 0, colSpan: 0 }
    } else {
      break
    }
  }

  return { rowSpan, colSpan }
}

const shouldMerge = (value1, value2) => {
  ${mergeCondition === 'custom' && customRule ? 
    `try {
    return (${customRule})(value1, value2)
  } catch (error) {
    console.error('自定义规则执行错误:', error)
    return value1 === value2
  }` : 
    'return value1 === value2'
  }
}

const getRowSpanColSpan = (record, column) => {
  const rowSpan = record[\`\${column}_rowSpan\`] || 1
  const colSpan = record[\`\${column}_colSpan\`] || 1
  
  return {
    rowSpan,
    colSpan
  }
}`
  }

  generateVue3Code(config) {
    const { mergeColumns, showBorder, stripe } = config

    return `<template>
  <div class="table-container">
    <a-table
      :data-source="tableData"
      :columns="columns"
      :bordered="${showBorder !== false}"
      size="middle"
      :pagination="false"
      :scroll="{ x: 'max-content' }"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const tableData = ref([
  // 在这里添加你的数据
])

const columns = computed(() => {
  if (tableData.value.length === 0) return []
  
  const fields = Object.keys(tableData.value[0])
  const mergeColumns = ${JSON.stringify(mergeColumns)}
  
  return fields.map(field => ({
    title: field,
    dataIndex: field,
    key: field,
    customCell: (record, index) => {
      // 只对需要合并的列进行处理
      if (!mergeColumns.includes(field)) {
        return { rowSpan: 1, colSpan: 1 }
      }
      
      return calculateCellSpan(tableData.value, index, field)
    }
  }))
})

const calculateCellSpan = (data, rowIndex, field) => {
  const currentValue = data[rowIndex][field]
  let rowSpan = 1
  
  // 向下查找相同值
  for (let i = rowIndex + 1; i < data.length; i++) {
    if (shouldMerge(data[i][field], currentValue)) {
      rowSpan++
    } else {
      break
    }
  }
  
  // 检查是否为合并区域的第一行
  for (let i = rowIndex - 1; i >= 0; i--) {
    if (shouldMerge(data[i][field], currentValue)) {
      // 不是第一行，隐藏这个单元格
      return { rowSpan: 0, colSpan: 0 }
    } else {
      break
    }
  }
  
  return { rowSpan, colSpan: 1 }
}

const shouldMerge = (value1, value2) => {
  return value1 === value2
}
</script>

<style scoped>
.table-container {
  padding: 20px;
}
</style>`
  }

  generateVue2Code(config) {
    const { mergeColumns, mergeCondition, customRule, showBorder, stripe } = config

    return `<template>
  <div class="table-container">
    <a-table
      :data-source="processedTableData"
      :columns="tableColumns"
      :bordered="${showBorder !== false}"
      :pagination="false"
      :scroll="{ x: 'max-content' }"
    />
  </div>
</template>

<script>
export default {
  name: 'TableWithSpan',
  data() {
    return {
      tableData: [
        // 在这里添加你的数据
      ],
      mergeColumns: ${JSON.stringify(mergeColumns)}
    }
  },
  computed: {
    processedTableData() {
      return this.processDataForMerge(this.tableData)
    },
    tableColumns() {
      if (this.tableData.length === 0) return []

      const fields = Object.keys(this.tableData[0])

      return fields.map(field => ({
        title: field,
        dataIndex: field,
        key: field,
        customCell: this.mergeColumns.includes(field) ? (record) => {
          return this.getRowSpanColSpan(record, field)
        } : undefined
      }))
    }
  },
  methods: {
    processDataForMerge(tableData) {
      const processedData = []

      for (let i = 0; i < tableData.length; i++) {
        const row = { ...tableData[i] }

        this.mergeColumns.forEach(column => {
          const spanInfo = this.calculateSpanForRow(tableData, i, column)
          row[\`\${column}_rowSpan\`] = spanInfo.rowSpan
          row[\`\${column}_colSpan\`] = spanInfo.colSpan
        })

        processedData.push(row)
      }

      return processedData
    },

    calculateSpanForRow(data, rowIndex, column) {
      const currentValue = data[rowIndex][column]
      let rowSpan = 1
      let colSpan = 1

      // 计算行合并
      for (let i = rowIndex + 1; i < data.length; i++) {
        if (this.shouldMerge(data[i][column], currentValue)) {
          rowSpan++
        } else {
          break
        }
      }

      // 检查是否为合并区域的第一行
      for (let i = rowIndex - 1; i >= 0; i--) {
        if (this.shouldMerge(data[i][column], currentValue)) {
          return { rowSpan: 0, colSpan: 0 }
        } else {
          break
        }
      }

      return { rowSpan, colSpan }
    },

    getRowSpanColSpan(record, column) {
      const rowSpan = record[\`\${column}_rowSpan\`] || 1
      const colSpan = record[\`\${column}_colSpan\`] || 1

      return {
        rowSpan,
        colSpan
      }
    },

    shouldMerge(value1, value2) {
      ${mergeCondition === 'custom' && customRule ?
        `try {
        return (${customRule})(value1, value2)
      } catch (error) {
        console.error('自定义规则执行错误:', error)
        return value1 === value2
      }` :
        'return value1 === value2'
      }
    }
  }
}
</script>

<style scoped>
.table-container {
  padding: 20px;
}
</style>`
  }

  getTableConfig(config) {
    return {
      component: 'a-table',
      props: {
        'data-source': 'processedTableData',
        columns: 'tableColumns',
        bordered: config.showBorder || true,
        stripe: config.stripe || false
      }
    }
  }

  processTableData(tableData, config) {
    // Ant Design Vue 按照官方文档，不需要预处理数据
    // customCell 函数会直接在渲染时计算合并信息
    return tableData
  }

  calculateSpanForRow(data, rowIndex, column, config) {
    const { mergeCondition = 'same', customRule, startRow = 0, endRow } = config
    const currentValue = data[rowIndex][column]
    let rowSpan = 1
    let colSpan = 1
    
    // 检查是否在合并范围内
    if (rowIndex < startRow || (endRow !== undefined && rowIndex > endRow)) {
      return { rowSpan: 1, colSpan: 1 }
    }

    // 向下计算行合并 - 只在合并范围内
    const maxIndex = endRow !== undefined ? Math.min(endRow, data.length - 1) : data.length - 1
    for (let i = rowIndex + 1; i <= maxIndex; i++) {
      if (this.shouldMergeValues(data[i][column], currentValue, config)) {
        rowSpan++
      } else {
        break
      }
    }

    // 检查是否为合并区域的第一行 - 只在合并范围内检查
    for (let i = rowIndex - 1; i >= startRow; i--) {
      if (this.shouldMergeValues(data[i][column], currentValue, config)) {
        return { rowSpan: 0, colSpan: 0 }
      } else {
        break
      }
    }

    return { rowSpan, colSpan }
  }

  shouldMergeValues(value1, value2, config) {
    const { mergeCondition, customRule } = config
    
    if (mergeCondition === 'same') {
      return value1 === value2
    } else if (mergeCondition === 'custom' && customRule) {
      try {
        const mergeFunction = new Function('value1', 'value2', `return ${customRule}`)
        return mergeFunction(value1, value2)
      } catch (error) {
        console.error('自定义规则执行错误:', error)
        return value1 === value2
      }
    }
    
    return value1 === value2
  }
  
  // 只计算行合并
  calculateRowSpanOnly(data, rowIndex, column, config) {
    const { startRow = 0, endRow } = config
    const currentValue = data[rowIndex][column]
    let rowSpan = 1
    
    // 向下计算行合并 - 只在合并范围内
    const maxIndex = endRow !== undefined ? Math.min(endRow, data.length - 1) : data.length - 1
    for (let i = rowIndex + 1; i <= maxIndex; i++) {
      if (this.shouldMergeValues(data[i][column], currentValue, config)) {
        rowSpan++
      } else {
        break
      }
    }

    // 检查是否为合并区域的第一行 - 只在合并范围内检查
    for (let i = rowIndex - 1; i >= startRow; i--) {
      if (this.shouldMergeValues(data[i][column], currentValue, config)) {
        return { rowSpan: 0, colSpan: 0 }
      } else {
        break
      }
    }

    return { rowSpan, colSpan: 1 }
  }
  
  // 只计算列合并 - Ant Design Vue 不直接支持列合并，需要特殊处理
  calculateColSpanOnly(data, rowIndex, column, config) {
    // Ant Design Vue 对列合并的支持有限，返回默认值
    return { rowSpan: 1, colSpan: 1 }
  }
  
  // 混合合并 - Ant Design Vue 不支持真正的混合合并，降级为行合并
  calculateMixedSpan(data, rowIndex, column, config) {
    // 由于Ant Design Vue的限制，混合合并降级为行合并
    return this.calculateRowSpanOnly(data, rowIndex, column, config)
  }

  getInstallCommands() {
    return {
      npm: 'npm install ant-design-vue',
      yarn: 'yarn add ant-design-vue',
      pnpm: 'pnpm add ant-design-vue'
    }
  }

  getImportStatements() {
    return [
      "import Antd from 'ant-design-vue'",
      "import 'ant-design-vue/dist/antd.css'"
    ]
  }

  getDocumentation() {
    return {
      notes: [
        'Ant Design Vue 使用 customCell 返回 rowSpan 和 colSpan',
        '需要预处理数据计算合并信息',
        'rowSpan/colSpan 为 0 时隐藏单元格',
        '⚠️ 列合并功能在Ant Design Vue中支持有限',
        '⚠️ 混合合并会降级为行合并处理'
      ],
      links: [
        {
          title: 'Ant Design Vue 表格文档',
          url: 'https://antdv.com/components/table-cn#API'
        },
        {
          title: '表格合并单元格示例',
          url: 'https://antdv.com/components/table-cn#components-table-demo-colspan-rowspan'
        }
      ]
    }
  }
}