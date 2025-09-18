import { UILibraryAdapter } from './UILibraryAdapter.js'

/**
 * Naive UI 适配器
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
    const { mergeType, mergeColumns, mergeCondition, customRule } = config
    
    return `const createColumns = (tableData) => {
  if (tableData.length === 0) return []
  
  const fields = Object.keys(tableData[0])
  const mergeColumns = ${JSON.stringify(mergeColumns)}
  
  return fields.map(field => ({
    title: field,
    key: field,
    render: mergeColumns.includes(field) ? (rowData, rowIndex) => {
      const spanInfo = calculateSpanForCell(tableData, rowIndex, field)
      
      if (spanInfo.rowSpan === 0 || spanInfo.colSpan === 0) {
        return null
      }
      
      return h('div', {
        style: {
          gridRow: \`span \${spanInfo.rowSpan}\`,
          gridColumn: \`span \${spanInfo.colSpan}\`
        }
      }, rowData[field])
    } : (rowData) => rowData[field]
  }))
}

const calculateSpanForCell = (data, rowIndex, column) => {
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
      :bordered="${showBorder || true}"
      :striped="${stripe || false}"
      :scroll-x="1200"
    />
  </div>
</template>

<script setup>
import { ref, computed, h } from 'vue'

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
      :bordered="${showBorder || true}"
      :striped="${stripe || false}"
      :scroll-x="1200"
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
    ${spanMethodCode.replace(/const /g, '').replace('h(', 'this.$createElement(')}
  }
}
</script>

<style scoped>
.table-container {
  padding: 20px;
}
</style>`
  }

  processTableData(tableData, spanConfig) {
    // Naive UI 不需要预处理数据，在渲染时处理
    return tableData
  }

  getTableConfig(config) {
    return {
      component: 'n-data-table',
      props: {
        data: 'tableData',
        columns: 'tableColumns',
        bordered: config.showBorder || true,
        striped: config.stripe || false
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
        'Naive UI 使用 render 函数实现单元格合并',
        '通过自定义渲染函数控制单元格显示',
        '支持复杂的单元格内容渲染'
      ],
      links: [
        {
          title: 'Naive UI 数据表格文档',
          url: 'https://www.naiveui.com/zh-CN/os-theme/components/data-table'
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

  generateSpanMethod(config) {
    const { mergeType, mergeColumns, mergeCondition, customRule } = config
    
    return `const processDataWithMerge = (data) => {
  const processedData = []
  const mergeColumns = ${JSON.stringify(mergeColumns)}
  
  for (let i = 0; i < data.length; i++) {
    const row = { ...data[i] }
    
    mergeColumns.forEach(column => {
      const spanInfo = calculateMergeSpan(data, i, column)
      row._merge = row._merge || {}
      row._merge[column] = spanInfo
    })
    
    processedData.push(row)
  }
  
  return processedData
}

const calculateMergeSpan = (data, rowIndex, column) => {
  const currentValue = data[rowIndex][column]
  let rowspan = 1
  let shouldShow = true

  // 计算行合并数量
  for (let i = rowIndex + 1; i < data.length; i++) {
    if (shouldMerge(data[i][column], currentValue)) {
      rowspan++
    } else {
      break
    }
  }

  // 检查是否应该隐藏（不是合并的第一行）
  for (let i = rowIndex - 1; i >= 0; i--) {
    if (shouldMerge(data[i][column], currentValue)) {
      shouldShow = false
      break
    } else {
      break
    }
  }

  return { rowspan, shouldShow }
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
  if (mergeInfo && mergeInfo.shouldShow && mergeInfo.rowspan > 1) {
    return \`merged-cell rowspan-\${mergeInfo.rowspan}\`
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

/**
 * Quasar 适配器
 */
export class QuasarAdapter extends UILibraryAdapter {
  constructor(config = {}) {
    super(config)
    this.name = 'Quasar'
    this.version = '2.x'
    this.cdnLinks = {
      css: ['https://cdn.jsdelivr.net/npm/quasar@2/dist/quasar.prod.css'],
      js: ['https://cdn.jsdelivr.net/npm/quasar@2/dist/quasar.umd.prod.js']
    }
  }

  generateSpanMethod(config) {
    const { mergeType, mergeColumns, mergeCondition, customRule } = config
    
    return `const processTableForMerge = (data) => {
  const processedData = []
  const mergeColumns = ${JSON.stringify(mergeColumns)}
  
  for (let i = 0; i < data.length; i++) {
    const row = { ...data[i] }
    
    mergeColumns.forEach(column => {
      const mergeInfo = calculateCellMerge(data, i, column)
      row._cellMerge = row._cellMerge || {}
      row._cellMerge[column] = mergeInfo
    })
    
    processedData.push(row)
  }
  
  return processedData
}

const calculateCellMerge = (data, rowIndex, column) => {
  const currentValue = data[rowIndex][column]
  let rowspan = 1
  let shouldRender = true

  // 向下查找相同值
  for (let i = rowIndex + 1; i < data.length; i++) {
    if (shouldMerge(data[i][column], currentValue)) {
      rowspan++
    } else {
      break
    }
  }

  // 检查是否为合并区域的首行
  for (let i = rowIndex - 1; i >= 0; i--) {
    if (shouldMerge(data[i][column], currentValue)) {
      shouldRender = false
      break
    } else {
      break
    }
  }

  return { rowspan, shouldRender }
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

const createTableColumns = (data) => {
  if (data.length === 0) return []
  
  const fields = Object.keys(data[0])
  const mergeColumns = ${JSON.stringify(mergeColumns)}
  
  return fields.map(field => ({
    name: field,
    label: field,
    field: field,
    align: 'left',
    sortable: true,
    ...(mergeColumns.includes(field) && {
      style: (row) => {
        const mergeInfo = row._cellMerge && row._cellMerge[field]
        if (mergeInfo && !mergeInfo.shouldRender) {
          return 'display: none;'
        }
        return ''
      },
      classes: (row) => {
        const mergeInfo = row._cellMerge && row._cellMerge[field]
        if (mergeInfo && mergeInfo.shouldRender && mergeInfo.rowspan > 1) {
          return \`merged-cell rowspan-\${mergeInfo.rowspan}\`
        }
        return ''
      }
    })
  }))
}`
  }

  generateVue3Code(config) {
    const { showBorder, stripe } = config
    const spanMethodCode = this.generateSpanMethod(config)

    return `<template>
  <div class="table-container">
    <q-table
      :data="processedTableData"
      :columns="tableColumns"
      :class="{ 'table-bordered': ${showBorder || true}, 'table-striped': ${stripe || false} }"
      row-key="index"
    >
      <!-- 使用 body-cell 插槽自定义单元格 -->
      <template #body-cell="props">
        <q-td
          v-if="shouldRenderCell(props.row, props.col.name)"
          :props="props"
          :rowspan="getCellRowspan(props.row, props.col.name)"
          :class="getCellClasses(props.row, props.col.name)"
        >
          {{ props.value }}
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const tableData = ref([
  // 在这里添加你的数据
])

${spanMethodCode}

const processedTableData = computed(() => {
  return processTableForMerge(tableData.value)
})

const tableColumns = computed(() => {
  return createTableColumns(tableData.value)
})

const shouldRenderCell = (row, colName) => {
  const mergeInfo = row._cellMerge && row._cellMerge[colName]
  return !mergeInfo || mergeInfo.shouldRender
}

const getCellRowspan = (row, colName) => {
  const mergeInfo = row._cellMerge && row._cellMerge[colName]
  return mergeInfo && mergeInfo.shouldRender ? mergeInfo.rowspan : 1
}

const getCellClasses = (row, colName) => {
  const mergeInfo = row._cellMerge && row._cellMerge[colName]
  if (mergeInfo && mergeInfo.shouldRender && mergeInfo.rowspan > 1) {
    return \`merged-cell rowspan-\${mergeInfo.rowspan}\`
  }
  return ''
}
</script>

<style scoped>
.table-container {
  padding: 20px;
}

.merged-cell {
  vertical-align: middle !important;
  text-align: center !important;
}

/* Quasar 表格合并样式 */
:deep(.q-table .merged-cell) {
  vertical-align: middle !important;
  text-align: center !important;
  border-bottom: 1px solid #e0e0e0 !important;
}

:deep(.q-table tbody tr td.merged-cell) {
  border-bottom: 1px solid transparent !important;
}

:deep(.q-table tbody tr td.merged-cell:not([rowspan="1"])) {
  border-bottom: 1px solid #e0e0e0 !important;
}

.table-bordered {
  border: 1px solid #e0e0e0;
}

.table-bordered :deep(.q-table th),
.table-bordered :deep(.q-table td) {
  border: 1px solid #e0e0e0;
}

.table-striped :deep(.q-table tbody tr:nth-child(odd)) {
  background-color: #f5f5f5;
}
</style>`
  }

  generateVue2Code(config) {
    const { showBorder, stripe } = config
    const spanMethodCode = this.generateSpanMethod(config)

    return `<template>
  <div class="table-container">
    <q-table
      :data="processedTableData"
      :columns="tableColumns"
      :class="{ 'table-bordered': ${showBorder || true}, 'table-striped': ${stripe || false} }"
      row-key="index"
    >
      <!-- 使用 body-cell 插槽自定义单元格 -->
      <template v-slot:body-cell="props">
        <q-td
          v-if="shouldRenderCell(props.row, props.col.name)"
          :props="props"
          :rowspan="getCellRowspan(props.row, props.col.name)"
          :class="getCellClasses(props.row, props.col.name)"
        >
          {{ props.value }}
        </q-td>
      </template>
    </q-table>
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
    processedTableData() {
      return this.processTableForMerge(this.tableData)
    },
    tableColumns() {
      return this.createTableColumns(this.tableData)
    }
  },
  methods: {
    ${spanMethodCode.replace(/const /g, '')},
    
    shouldRenderCell(row, colName) {
      const mergeInfo = row._cellMerge && row._cellMerge[colName]
      return !mergeInfo || mergeInfo.shouldRender
    },
    
    getCellRowspan(row, colName) {
      const mergeInfo = row._cellMerge && row._cellMerge[colName]
      return mergeInfo && mergeInfo.shouldRender ? mergeInfo.rowspan : 1
    },
    
    getCellClasses(row, colName) {
      const mergeInfo = row._cellMerge && row._cellMerge[colName]
      if (mergeInfo && mergeInfo.shouldRender && mergeInfo.rowspan > 1) {
        return \`merged-cell rowspan-\${mergeInfo.rowspan}\`
      }
      return ''
    }
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
}

.table-bordered {
  border: 1px solid #e0e0e0;
}

.table-bordered >>> .q-table th,
.table-bordered >>> .q-table td {
  border: 1px solid #e0e0e0;
}

.table-bordered >>> .q-table .merged-cell {
  vertical-align: middle !important;
  text-align: center !important;
}

.table-bordered >>> .q-table tbody tr td.merged-cell {
  border-bottom: 1px solid transparent !important;
}

.table-bordered >>> .q-table tbody tr td.merged-cell:not([rowspan="1"]) {
  border-bottom: 1px solid #e0e0e0 !important;
}

.table-striped >>> .q-table tbody tr:nth-child(odd) {
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
        const mergeInfo = this.calculateCellMerge(tableData, i, column, mergeCondition, customRule)
        row._cellMerge = row._cellMerge || {}
        row._cellMerge[column] = mergeInfo
      })
      
      processedData.push(row)
    }
    
    return processedData
  }

  calculateCellMerge(data, rowIndex, column, mergeCondition, customRule) {
    const currentValue = data[rowIndex][column]
    let rowspan = 1
    let shouldRender = true

    // 向下查找相同值
    for (let i = rowIndex + 1; i < data.length; i++) {
      if (this.shouldMerge(data[i][column], currentValue, mergeCondition, customRule)) {
        rowspan++
      } else {
        break
      }
    }

    // 检查是否为合并区域的首行
    for (let i = rowIndex - 1; i >= 0; i--) {
      if (this.shouldMerge(data[i][column], currentValue, mergeCondition, customRule)) {
        shouldRender = false
        break
      } else {
        break
      }
    }

    return { rowspan, shouldRender }
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
      component: 'q-table',
      props: {
        data: 'processedTableData',
        columns: 'tableColumns',
        'row-key': 'index',
        class: [config.showBorder ? 'table-bordered' : '', config.stripe ? 'table-striped' : ''].filter(Boolean).join(' ')
      }
    }
  }

  getInstallCommands() {
    return {
      npm: 'npm install quasar @quasar/extras',
      yarn: 'yarn add quasar @quasar/extras',
      pnpm: 'pnpm add quasar @quasar/extras'
    }
  }

  getImportStatements() {
    return [
      "import { Quasar } from 'quasar'",
      "import quasarLang from 'quasar/lang/zh-hans'",
      "import 'quasar/src/css/index.sass'"
    ]
  }

  getDocumentation() {
    return {
      notes: [
        'Quasar 使用 body-cell 插槽和 rowspan 属性实现合并',
        '通过控制单元格的渲染来实现合并效果',
        '支持丰富的表格定制选项'
      ],
      links: [
        {
          title: 'Quasar 表格文档',
          url: 'https://quasar.dev/vue-components/table'
        }
      ]
    }
  }
}