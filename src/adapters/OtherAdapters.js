import { UILibraryAdapter } from './UILibraryAdapter.js'

/**
 * Naive UI 适配器
 * 使用官方 rowSpan 和 colSpan 函数实现表格合并
 */
export class NaiveAdapter extends UILibraryAdapter {
  constructor(config = {}) {
    super(config)
    this.name = 'Naive UI'
    this.version = '2.x'
    this.cdnLinks = {
      css: ['https://unpkg.com/naive-ui/dist/index.css'],
      js: ['https://unpkg.com/naive-ui/dist/index.js']
    }
  }

  generateSpanMethod(config) {
    const { mergeType, mergeColumns, mergeCondition, customRule, startRow = 0, endRow } = config
    
    return `const createColumns = (tableData) => {
  if (tableData.length === 0) return []
  
  const fields = Object.keys(tableData[0])
  const mergeColumns = ${JSON.stringify(mergeColumns)}
  
  return fields.map(field => ({
    title: field,
    key: field,
    // 使用 Naive UI 官方的 rowSpan 和 colSpan 函数
    rowSpan: mergeColumns.includes(field) ? (rowData, rowIndex) => {
      const spanInfo = calculateNaiveSpanForCell(tableData, rowIndex, field)
      return spanInfo.rowSpan
    } : undefined,
    colSpan: mergeColumns.includes(field) ? (rowData, rowIndex) => {
      const spanInfo = calculateNaiveSpanForCell(tableData, rowIndex, field)
      return spanInfo.colSpan
    } : undefined
  }))
}

const calculateNaiveSpanForCell = (data, rowIndex, column) => {
  const currentValue = data[rowIndex][column]
  let rowSpan = 1
  let colSpan = 1
  
  // 检查是否在合并范围内
  const startRow = ${startRow}
  const endRow = ${endRow !== undefined ? endRow : 'data.length - 1'}
  
  if (rowIndex < startRow || rowIndex > endRow) {
    return { rowSpan: 1, colSpan: 1 }
  }

  // 向下计算行合并 - 只在合并范围内
  const maxIndex = Math.min(endRow, data.length - 1)
  for (let i = rowIndex + 1; i <= maxIndex; i++) {
    if (shouldMerge(data[i][column], currentValue)) {
      rowSpan++
    } else {
      break
    }
  }

  // 检查是否为合并区域的第一行 - 只在合并范围内检查
  for (let i = rowIndex - 1; i >= startRow; i--) {
    if (shouldMerge(data[i][column], currentValue)) {
      // 不是第一行，隐藏这个单元格
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
}`
  }

  generateVue3Code(config) {
    const { showBorder, stripe } = config
    const spanMethodCode = this.generateSpanMethod(config)

    return `<template>
  <div class="table-container">
    <n-data-table
      :data="tableData"
      :columns="tableColumns"
      :bordered="${showBorder !== false}"
      :striped="${stripe || false}"
      :scroll-x="1200"
      :pagination="false"
      :single-line="false"
      size="medium"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const tableData = ref([
  // 在这里添加你的数据
])

${spanMethodCode}

const tableColumns = computed(() => {
  return createColumns(tableData.value)
})
</script>

<style scoped>
.table-container {
  padding: 20px;
}

/* Naive UI 表格合并样式优化 */
:deep(.n-data-table .n-data-table-td) {
  vertical-align: middle;
}

:deep(.n-data-table .n-data-table-td[rowspan]) {
  text-align: center;
  font-weight: 500;
  background-color: #fafafa;
}

:deep(.n-data-table .n-data-table-thead .n-data-table-th) {
  background-color: #f5f5f5;
  font-weight: 600;
}
</style>`
  }

  generateVue2Code(config) {
    const { showBorder, stripe } = config
    const spanMethodCode = this.generateSpanMethod(config)

    return `<template>
  <div class="table-container">
    <n-data-table
      :data="tableData"
      :columns="tableColumns"
      :bordered="${showBorder !== false}"
      :striped="${stripe || false}"
      :scroll-x="1200"
      :pagination="false"
      :single-line="false"
      size="medium"
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
      ]
    }
  },
  computed: {
    tableColumns() {
      return this.createColumns(this.tableData)
    }
  },
  methods: {
    ${spanMethodCode.replace(/const /g, '')}
  }
}
</script>

<style scoped>
.table-container {
  padding: 20px;
}

/* Naive UI 表格合并样式优化 */
>>> .n-data-table .n-data-table-td {
  vertical-align: middle;
}

>>> .n-data-table .n-data-table-td[rowspan] {
  text-align: center;
  font-weight: 500;
  background-color: #fafafa;
}

>>> .n-data-table .n-data-table-thead .n-data-table-th {
  background-color: #f5f5f5;
  font-weight: 600;
}
</style>`
  }

  processTableData(tableData, spanConfig) {
    // Naive UI 不需要预处理数据，使用 rowSpan 和 colSpan 函数在渲染时动态计算
    return tableData
  }
  
  getFeatures() {
    return {
      rowSpan: true,
      colSpan: true,
      mixedSpan: false, // 混合合并会降级为行合并
      customRender: true,
      virtualScroll: true,
      sortable: true,
      resizable: false
    }
  }

  getTableConfig(config) {
    return {
      component: 'n-data-table',
      props: {
        data: 'tableData',
        columns: 'tableColumns',
        bordered: config.showBorder !== false,
        striped: config.stripe || false,
        'single-line': false,
        pagination: false,
        size: 'medium'
      }
    }
  }

  getInstallCommands() {
    return {
      npm: 'npm install naive-ui',
      yarn: 'yarn add naive-ui',
      pnpm: 'pnpm add naive-ui'
    }
  }

  getImportStatements() {
    return [
      "import naive from 'naive-ui'",
      "import 'vfonts/Lato.css'",
      "import 'vfonts/FiraCode.css'"
    ]
  }

  getDocumentation() {
    return {
      notes: [
        'Naive UI 使用 rowSpan 和 colSpan 函数控制单元格合并',
        '返回 0 时隐藏单元格，实现合并效果',
        '支持动态计算合并范围和自定义合并条件',
        '⚠️ 推荐使用行合并，列合并支持有限'
      ],
      links: [
        {
          title: 'Naive UI 数据表格文档',
          url: 'https://www.naiveui.com/zh-CN/os-theme/components/data-table'
        },
        {
          title: '表格合并示例',
          url: 'https://www.naiveui.com/zh-CN/os-theme/components/data-table#colspan-rowspan.vue'
        }
      ]
    }
  }
}

/**
 * Vuetify 适配器
 */
export class VuetifyAdapter extends UILibraryAdapter {
  constructor(config = {}) {
    super(config)
    this.name = 'Vuetify'
    this.version = '3.x'
    this.cdnLinks = {
      css: ['https://unpkg.com/vuetify/dist/vuetify.min.css'],
      js: ['https://unpkg.com/vuetify/dist/vuetify.min.js']
    }
  }

  getFeatures() {
    return {
      rowSpan: true,
      colSpan: true,
      mixedSpan: true, // 支持混合合并
      customRender: true,
      virtualScroll: false,
      sortable: true,
      resizable: false
    }
  }

  generateSpanMethod(config) {
    const { mergeType, mergeColumns, mergeCondition, customRule, startRow = 0, endRow } = config
    
    return `const processDataWithMerge = (data) => {
  const processedData = []
  const mergeColumns = ${JSON.stringify(mergeColumns)}
  const mergeType = '${mergeType}'
  
  for (let i = 0; i < data.length; i++) {
    const row = { ...data[i] }
    row._merge = {}
    
    mergeColumns.forEach(column => {
      const spanInfo = calculateMergeSpan(data, i, column, mergeType)
      row._merge[column] = spanInfo
    })
    
    processedData.push(row)
  }
  
  return processedData
}

const calculateMergeSpan = (data, rowIndex, column, mergeType) => {
  const currentValue = data[rowIndex][column]
  const startRow = ${startRow}
  const endRow = ${endRow !== undefined ? endRow : 'data.length - 1'}
  
  // 检查是否在合并范围内
  if (rowIndex < startRow || rowIndex > endRow) {
    return { rowspan: 1, colspan: 1, shouldShow: true }
  }
  
  if (mergeType === 'row') {
    return calculateRowSpan(data, rowIndex, column, startRow, endRow)
  } else if (mergeType === 'column') {
    return calculateColSpan(data, rowIndex, column)
  } else if (mergeType === 'mixed') {
    return calculateMixedSpan(data, rowIndex, column, startRow, endRow)
  }
  
  return { rowspan: 1, colspan: 1, shouldShow: true }
}

const calculateRowSpan = (data, rowIndex, column, startRow, endRow) => {
  const currentValue = data[rowIndex][column]
  let rowspan = 1
  let shouldShow = true

  // 向下计算行合并数量
  const maxIndex = Math.min(endRow, data.length - 1)
  for (let i = rowIndex + 1; i <= maxIndex; i++) {
    if (shouldMerge(data[i][column], currentValue)) {
      rowspan++
    } else {
      break
    }
  }

  // 检查是否应该隐藏（不是合并的第一行）
  for (let i = rowIndex - 1; i >= startRow; i--) {
    if (shouldMerge(data[i][column], currentValue)) {
      shouldShow = false
      break
    } else {
      break
    }
  }

  return { rowspan, colspan: 1, shouldShow }
}

const calculateColSpan = (data, rowIndex, column) => {
  const currentValue = data[rowIndex][column]
  const allFields = Object.keys(data[0])
  const currentFieldIndex = allFields.indexOf(column)
  const mergeColumns = ${JSON.stringify(mergeColumns)}
  let colspan = 1
  let shouldShow = true

  // 向右计算列合并数量
  for (let i = currentFieldIndex + 1; i < allFields.length; i++) {
    const nextField = allFields[i]
    if (!mergeColumns.includes(nextField)) break
    
    if (shouldMerge(data[rowIndex][nextField], currentValue)) {
      colspan++
    } else {
      break
    }
  }

  // 检查是否应该隐藏（不是合并的第一列）
  for (let i = currentFieldIndex - 1; i >= 0; i--) {
    const prevField = allFields[i]
    if (!mergeColumns.includes(prevField)) break
    
    if (shouldMerge(data[rowIndex][prevField], currentValue)) {
      shouldShow = false
      break
    } else {
      break
    }
  }

  return { rowspan: 1, colspan, shouldShow }
}

const calculateMixedSpan = (data, rowIndex, column, startRow, endRow) => {
  const currentValue = data[rowIndex][column]
  const allFields = Object.keys(data[0])
  const currentFieldIndex = allFields.indexOf(column)
  const mergeColumns = ${JSON.stringify(mergeColumns)}
  
  let rowspan = 1
  let colspan = 1
  let shouldShow = true

  // 1. 先计算行合并
  const maxRowIndex = Math.min(endRow, data.length - 1)
  for (let i = rowIndex + 1; i <= maxRowIndex; i++) {
    if (shouldMerge(data[i][column], currentValue)) {
      rowspan++
    } else {
      break
    }
  }

  // 2. 再计算列合并
  for (let i = currentFieldIndex + 1; i < allFields.length; i++) {
    const nextField = allFields[i]
    if (!mergeColumns.includes(nextField)) break
    
    // 检查这一列的所有相关行是否都有相同值
    let canMergeColumn = true
    for (let row = rowIndex; row < rowIndex + rowspan; row++) {
      if (!shouldMerge(data[row][nextField], currentValue)) {
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

  // 3. 检查是否应该隐藏
  // 检查行方向
  for (let i = rowIndex - 1; i >= startRow; i--) {
    if (shouldMerge(data[i][column], currentValue)) {
      shouldShow = false
      break
    } else {
      break
    }
  }
  
  // 检查列方向（只有在行方向没有隐藏的情况下）
  if (shouldShow) {
    for (let i = currentFieldIndex - 1; i >= 0; i--) {
      const prevField = allFields[i]
      if (!mergeColumns.includes(prevField)) break
      
      if (shouldMerge(data[rowIndex][prevField], currentValue)) {
        shouldShow = false
        break
      } else {
        break
      }
    }
  }

  return { rowspan, colspan, shouldShow }
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

const getCellClass = (item, field) => {
  const mergeInfo = item._merge && item._merge[field]
  if (mergeInfo && mergeInfo.shouldShow && (mergeInfo.rowspan > 1 || mergeInfo.colspan > 1)) {
    return \`merged-cell rowspan-\${mergeInfo.rowspan} colspan-\${mergeInfo.colspan}\`
  }
  return ''
}

const shouldShowCell = (item, field) => {
  const mergeInfo = item._merge && item._merge[field]
  return !mergeInfo || mergeInfo.shouldShow
}`
  }

  generateVue3Code(config) {
    const { mergeColumns, showBorder, stripe } = config
    const spanMethodCode = this.generateSpanMethod(config)

    return `<template>
  <div class="table-container">
    <!-- 使用自定义表格结构实现完美的合并效果 -->
    <div class="vuetify-table-wrapper">
      <table class="vuetify-custom-table" :class="{ 'bordered': ${showBorder || true}, 'striped': ${stripe || false} }">
        <thead>
          <tr>
            <th v-for="field in tableHeaders" :key="field.value" class="vuetify-header">
              {{ field.title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in processedTableData" :key="rowIndex" 
              :class="{ 'striped-row': ${stripe || false} && rowIndex % 2 === 1 }">
            <td v-for="(field, colIndex) in tableHeaders" :key="field.value" 
                :class="getCustomCellClass(row, field.value, rowIndex, colIndex)"
                :style="getCustomCellStyle(row, field.value, rowIndex, colIndex)"
                v-show="shouldShowCustomCell(row, field.value)"
                class="vuetify-cell">
              {{ row[field.value] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const tableData = ref([
  // 在这里添加你的数据
])

const mergeColumns = ${JSON.stringify(mergeColumns)}

${spanMethodCode}

const processedTableData = computed(() => {
  return processDataWithMerge(tableData.value)
})

const tableHeaders = computed(() => {
  if (tableData.value.length === 0) return []
  
  const fields = Object.keys(tableData.value[0])
  return fields.map(field => ({
    title: field,
    value: field,
    sortable: true
  }))
})

// 自定义表格合并方法
const shouldShowCustomCell = (row, field) => {
  const mergeInfo = row._merge && row._merge[field]
  return !mergeInfo || mergeInfo.shouldShow
}

const getCustomCellClass = (row, field, rowIndex, colIndex) => {
  const mergeInfo = row._merge && row._merge[field]
  let classes = []
  
  if (mergeInfo && mergeInfo.shouldShow && mergeInfo.rowspan > 1) {
    classes.push('merged-cell-custom')
    classes.push(\`rowspan-\${mergeInfo.rowspan}\`)
  }
  
  return classes.join(' ')
}

const getCustomCellStyle = (row, field, rowIndex, colIndex) => {
  const mergeInfo = row._merge && row._merge[field]
  
  if (mergeInfo && mergeInfo.shouldShow && mergeInfo.rowspan > 1) {
    const rowHeight = 48
    const borderHeight = mergeInfo.rowspan - 1
    const totalHeight = rowHeight * mergeInfo.rowspan + borderHeight
    
    return {
      height: \`\${totalHeight}px\`,
      verticalAlign: 'middle',
      textAlign: 'center',
      position: 'relative',
      zIndex: 10
    }
  }
  
  return {}
}
</script>

<style scoped>
.table-container {
  padding: 20px;
}

/* Vuetify 自定义表格样式 */
.vuetify-table-wrapper {
  width: 100%;
  overflow: auto;
  border-radius: 8px;
}

.vuetify-custom-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.vuetify-custom-table.bordered {
  border: 1px solid #e0e0e0;
}

.vuetify-header {
  background: #f5f5f5;
  color: #333;
  font-weight: 600;
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
}

.vuetify-header:last-child {
  border-right: none;
}

.vuetify-custom-table.bordered .vuetify-header {
  border-right: 1px solid #e0e0e0;
}

.vuetify-cell {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
  transition: background-color 0.2s;
  position: relative;
}

.vuetify-cell:last-child {
  border-right: none;
}

.vuetify-custom-table.bordered .vuetify-cell {
  border-right: 1px solid #e0e0e0;
}

/* 合并单元格特殊样式 */
.merged-cell-custom {
  background: #fafafa !important;
  font-weight: 500;
  border-bottom: 1px solid #e0e0e0 !important;
  vertical-align: middle !important;
  text-align: center !important;
}

/* 条纹效果 */
.striped-row .vuetify-cell {
  background-color: #f9f9f9;
}

.striped-row .merged-cell-custom {
  background-color: #f0f0f0 !important;
}

/* 悬停效果 */
.vuetify-custom-table tbody tr:hover .vuetify-cell {
  background-color: #f0f8ff;
}

.vuetify-custom-table tbody tr:hover .merged-cell-custom {
  background-color: #e6f3ff !important;
}
</style>`
  }

  generateVue2Code(config) {
    const { mergeColumns, showBorder, stripe } = config
    const spanMethodCode = this.generateSpanMethod(config)

    return `<template>
  <div class="table-container">
    <v-data-table
      :items="processedTableData"
      :headers="tableHeaders"
      class="elevation-1"
      :class="{ 'table-bordered': ${showBorder || true}, 'table-striped': ${stripe || false} }"
    >
      <!-- 自定义单元格渲染 -->
      <template v-for="column in mergeColumns" :slot="\`item.\${column}\`" slot-scope="{ item }">
        <td 
          v-if="shouldShowCell(item, column)"
          :class="getCellClass(item, column)"
          :rowspan="item._merge && item._merge[column] ? item._merge[column].rowspan : 1"
        >
          {{ item[column] }}
        </td>
      </template>
    </v-data-table>
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
      return this.processDataWithMerge(this.tableData)
    },
    tableHeaders() {
      if (this.tableData.length === 0) return []
      
      const fields = Object.keys(this.tableData[0])
      return fields.map(field => ({
        text: field,
        value: field,
        sortable: true
      }))
    }
  },
  methods: {
    ${spanMethodCode.replace(/const /g, '')}
  }
}
</script>

<style scoped>
.table-container {
  padding: 20px;
}

.merged-cell {
  vertical-align: middle !important;
  text-align: center !important;
  position: relative;
}

/* Vuetify 表格合并样式 */
.table-bordered >>> .v-data-table {
  border: 1px solid #e0e0e0;
}

.table-bordered >>> .v-data-table .merged-cell {
  border-bottom: none !important;
  vertical-align: middle !important;
  text-align: center !important;
}

.table-bordered >>> .v-data-table tbody tr td.merged-cell {
  border-bottom: 1px solid transparent !important;
}

.table-bordered >>> .v-data-table tbody tr td.merged-cell:not([rowspan="1"]) {
  border-bottom: 1px solid #e0e0e0 !important;
}

.table-striped >>> .v-data-table tbody tr:nth-child(odd) {
  background-color: #f5f5f5;
}
</style>`
  }

  processTableData(tableData, spanConfig) {
    if (!tableData || tableData.length === 0) return []
    
    const { mergeColumns = [], mergeCondition = 'same', customRule } = spanConfig
    const processedData = []
    
    for (let i = 0; i < tableData.length; i++) {
      const row = { ...tableData[i] }
      
      mergeColumns.forEach(column => {
        const spanInfo = this.calculateMergeSpan(tableData, i, column, mergeCondition, customRule)
        row._merge = row._merge || {}
        row._merge[column] = spanInfo
      })
      
      processedData.push(row)
    }
    
    return processedData
  }

  calculateMergeSpan(data, rowIndex, column, mergeCondition, customRule) {
    const currentValue = data[rowIndex][column]
    let rowspan = 1
    let shouldShow = true

    // 计算行合并数量
    for (let i = rowIndex + 1; i < data.length; i++) {
      if (this.shouldMerge(data[i][column], currentValue, mergeCondition, customRule)) {
        rowspan++
      } else {
        break
      }
    }

    // 检查是否应该隐藏（不是合并的第一行）
    for (let i = rowIndex - 1; i >= 0; i--) {
      if (this.shouldMerge(data[i][column], currentValue, mergeCondition, customRule)) {
        shouldShow = false
        break
      } else {
        break
      }
    }

    return { rowspan, shouldShow }
  }

  shouldMerge(value1, value2, mergeCondition, customRule) {
    if (mergeCondition === 'custom' && customRule) {
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

  getTableConfig(config) {
    return {
      component: 'v-data-table',
      props: {
        items: 'processedTableData',
        headers: 'tableHeaders',
        class: ['elevation-1', config.showBorder ? 'table-bordered' : '', config.stripe ? 'table-striped' : ''].filter(Boolean).join(' ')
      }
    }
  }

  getInstallCommands() {
    return {
      npm: 'npm install vuetify',
      yarn: 'yarn add vuetify',
      pnpm: 'pnpm add vuetify'
    }
  }

  getImportStatements() {
    return [
      "import 'vuetify/styles'",
      "import { createVuetify } from 'vuetify'",
      "import * as components from 'vuetify/components'",
      "import * as directives from 'vuetify/directives'"
    ]
  }

  getDocumentation() {
    return {
      notes: [
        'Vuetify 使用自定义插槽和 rowspan 属性实现合并',
        '需要预处理数据标记合并信息',
        '通过CSS控制合并单元格样式'
      ],
      links: [
        {
          title: 'Vuetify 数据表格文档',
          url: 'https://vuetifyjs.com/en/components/data-tables/'
        }
      ]
    }
  }
}