<template>
  <div class="universal-table-preview">
    <div class="preview-header">
      <div class="header-info">
        <div class="title-section">
          <h3 class="preview-title">表格预览</h3>
          <span class="ui-library-badge">{{ currentLibraryName }}</span>
          <span class="data-count" v-if="tableData.length > 0">
            {{ tableData.length }} 行数据
          </span>
          <span class="column-count" v-if="tableFields.length > 6">
            {{ tableFields.length }} 列 - 可横向滚动
          </span>
        </div>
      </div>

      <div class="header-actions">
        <el-button
          size="small"
          :icon="Refresh"
          @click="refreshPreview"
          type="default"
        >
          刷新
        </el-button>
      </div>
    </div>

    <div class="preview-content">
      <!-- 动态表格容器 -->
      <div v-if="tableData.length > 0" class="table-container" :data-columns="tableFields.length">
        <!-- Element Plus 表格 -->
        <el-table
          v-if="currentLibrary === 'element-plus'"
          :data="processedTableData"
          :span-method="spanMethod"
          :border="spanConfig.showBorder"
          :stripe="spanConfig.stripe"
          height="100%"
          :style="{ width: tableScrollWidth, minWidth: tableScrollWidth }"
          class="preview-table"
        >
          <el-table-column
            v-for="(field, index) in tableFields"
            :key="field"
            :prop="field"
            :label="field"
            :min-width="getColumnMinWidth(field)"
            show-overflow-tooltip
          >
            <template #default="scope">
              <div class="cell-content">
                {{ scope.row[field] }}
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 其他UI库的表格组件 - 仅在对应库加载后渲染 -->
        <component
          v-else-if="isCurrentLibraryAvailable && currentLibrary !== 'vuetify'"
          :is="getTableComponent()"
          v-bind="getTableProps()"
          class="preview-table"
        >
          <!-- 动态插槽内容 -->
          <template v-for="(slot, name) in getTableSlots()" :key="name" #[name]="slotProps">
            <component :is="slot" v-bind="slotProps" />
          </template>
        </component>

        <!-- Vuetify 特殊处理 - 使用自定义表格结构 -->
        <div v-else-if="currentLibrary === 'vuetify'" class="vuetify-table-wrapper">
          <table class="vuetify-custom-table" :class="{ 'bordered': spanConfig.showBorder, 'striped': spanConfig.stripe }">
            <thead>
              <tr>
                <th v-for="field in tableFields" :key="field" class="vuetify-header">
                  {{ field }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in processedTableData" :key="rowIndex" 
                  :class="{ 'striped-row': spanConfig.stripe && rowIndex % 2 === 1 }">
                <td v-for="(field, colIndex) in tableFields" :key="field" 
                    :class="getVuetifyCustomCellClass(row, field, rowIndex, colIndex)"
                    :style="getVuetifyCustomCellStyle(row, field, rowIndex, colIndex)"
                    v-show="shouldShowVuetifyCustomCell(row, field)">
                  {{ row[field] }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 降级显示原生表格 - 如果当前库不可用则降级到原生表格 -->
        <table v-else class="fallback-table" :class="{ 'table-bordered': spanConfig.showBorder, 'table-striped': spanConfig.stripe }">
          <thead>
            <tr>
              <th v-for="field in tableFields" :key="field">{{ field }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in processedTableData" :key="index">
              <td v-for="field in tableFields" :key="field">{{ row[field] }}</td>
            </tr>
          </tbody>
        </table>

      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-else>
        <el-empty
          description="暂无表格数据"
          :image-size="80"
        >
          <template #description>
            <p class="empty-text">请先在左侧配置面板中导入数据</p>
          </template>
          <template #default>
            <el-button type="primary" size="small">
              导入数据
            </el-button>
          </template>
        </el-empty>
      </div>
    </div>

    <!-- 合并信息提示 -->
    <div class="merge-info" v-if="tableData.length > 0 && spanConfig.mergeColumns && spanConfig.mergeColumns.length > 0">
      <div class="info-item">
        <el-tag size="small" type="success">
          {{ getMergeTypeText() }}
        </el-tag>
        <span class="info-text">
          合并列: {{ spanConfig.mergeColumns.join(', ') }}
        </span>
        <span class="library-info">
          {{ currentLibraryName }} 实现
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, inject, nextTick, h, toRef } from 'vue'
import { Loading, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { uiLibraryManager } from '../adapters/UILibraryManager.js'

export default {
  name: 'UniversalTablePreview',
  components: {
    Loading
  },
  props: {
    tableData: {
      type: Array,
      default: () => []
    },
    spanConfig: {
      type: Object,
      default: () => ({})
    },
    currentLibrary: {
      type: String,
      default: 'element-plus'
    }
  },
  emits: ['span-method'],
  setup(props, { emit }) {
    // 注入UI库实例
    const antd = inject('$antd', null)
    const naive = inject('$naive', null) 
    const vuetify = inject('$vuetify', null)
    const quasar = inject('$quasar', null)

    // 所有UI库都已安装，直接标记为可用
    const isLoadingLibrary = ref(false)
    const loadingProgress = ref(0)
    const libraryLoadError = ref('')
    const availableLibraries = ref(new Set(['element-plus', 'ant-design-vue', 'naive-ui', 'vuetify', 'quasar']))

    const tableFields = computed(() => {
      if (props.tableData.length === 0) return []
      return Object.keys(props.tableData[0])
    })

    const currentLibraryName = computed(() => {
      const adapter = uiLibraryManager.getAdapter(props.currentLibrary)
      return adapter ? adapter.name : props.currentLibrary
    })

    // 检查当前UI库是否可用
    const isCurrentLibraryAvailable = computed(() => {
      return availableLibraries.value.has(props.currentLibrary)
    })

    // 获取表格组件
    const getTableComponent = () => {
      switch (props.currentLibrary) {
        case 'ant-design-vue':
          return 'a-table'
        case 'naive-ui':
          return 'n-data-table'
        case 'vuetify':
          return 'v-data-table'
        case 'quasar':
          return 'q-table'
        default:
          return 'div'
      }
    }

    // 获取表格属性
    const getTableProps = () => {
      switch (props.currentLibrary) {
        case 'ant-design-vue':
          return {
            dataSource: processedTableData.value,
            columns: antdColumns.value,
            bordered: props.spanConfig.showBorder,
            size: 'small'
          }
        case 'naive-ui':
          return {
            data: processedTableData.value,
            columns: naiveColumns.value,
            bordered: props.spanConfig.showBorder,
            size: 'small',
            'single-line': false
          }
        case 'vuetify':
          return {
            items: processedTableData.value,
            headers: vuetifyHeaders.value,
            'items-per-page': -1,
            'hide-default-footer': true
          }
        case 'quasar':
          return {
            data: processedTableData.value,
            columns: quasarColumns.value,
            rowKey: 'id',
            flat: true,
            bordered: props.spanConfig.showBorder
          }
        default:
          return {}
      }
    }

    // 获取表格插槽
    const getTableSlots = () => {
      switch (props.currentLibrary) {
        case 'vuetify':
          return {
            // 对于每个合并列使用动态插槽
            ...tableFields.value.reduce((slots, field) => {
              const mergeColumns = (props.spanConfig && props.spanConfig.mergeColumns) || []
              if (mergeColumns.includes(field)) {
                slots[`item.${field}`] = ({ item }) => {
                  if (shouldShowVuetifyCell(item, field)) {
                    return h('td', {
                      class: getVuetifyCellClass(item, field),
                      rowspan: getVuetifyRowspan(item, field)
                    }, item[field])
                  }
                  return null
                }
              }
              return slots
            }, {})
          }
        case 'quasar':
          return {
            'body-cell': (props) => {
              if (shouldRenderQuasarCell(props.row, props.col.name)) {
                return h('q-td', {
                  class: getQuasarCellClasses(props.row, props.col.name),
                  rowspan: getQuasarCellRowspan(props.row, props.col.name)
                }, props.value)
              }
              return null
            }
          }
        default:
          return {}
      }
    }

    // 由于所有UI库都已安装，不需要动态加载
    const loadUILibrary = async (libraryId) => {
      // 所有UI库都已预安装，直接返回成功
      if (availableLibraries.value.has(libraryId)) {
        ElMessage.success(`${getLibraryDisplayName(libraryId)} 已就绪！`)
        return true
      }
      return false
    }

    // 获取UI库显示名称
    const getLibraryDisplayName = (libraryId) => {
      const names = {
        'ant-design-vue': 'Ant Design Vue',
        'naive-ui': 'Naive UI',
        'vuetify': 'Vuetify',
        'quasar': 'Quasar'
      }
      return names[libraryId] || libraryId
    }

    // 获取处理后的表格数据 - 每个UI库独立处理
    const processedTableData = computed(() => {
      if (!props.tableData || props.tableData.length === 0) {
        return []
      }
      
      try {
        // 根据当前UI库类型进行不同的数据处理
        switch (props.currentLibrary) {
          case 'ant-design-vue':
            // Ant Design Vue 需要预处理数据添加合并信息
            return processAntdData(props.tableData, props.spanConfig)
          
          case 'vuetify':
            // Vuetify 需要添加合并元数据
            return processVuetifyData(props.tableData, props.spanConfig)
          
          case 'quasar':
            // Quasar 需要添加合并信息
            return processQuasarData(props.tableData, props.spanConfig)
          
          case 'naive-ui':
          case 'element-plus':
          default:
            // Naive UI 和 Element Plus 使用原始数据
            return props.tableData
        }
      } catch (error) {
        console.error('处理表格数据时出错:', error)
        return props.tableData
      }
    })

    // Ant Design Vue 数据处理函数
    const processAntdData = (tableData, spanConfig) => {
      if (!spanConfig || !spanConfig.mergeColumns || spanConfig.mergeColumns.length === 0) {
        return tableData
      }
      
      const processedData = []
      const { mergeColumns, mergeCondition = 'same', customRule } = spanConfig
      
      for (let i = 0; i < tableData.length; i++) {
        const row = { ...tableData[i] }
        
        mergeColumns.forEach(column => {
          const spanInfo = calculateAntdSpan(tableData, i, column, mergeCondition, customRule)
          row[`${column}_rowSpan`] = spanInfo.rowSpan
          row[`${column}_colSpan`] = spanInfo.colSpan
        })
        
        processedData.push(row)
      }
      
      return processedData
    }
    
    // Ant Design Vue 合并计算
    const calculateAntdSpan = (data, rowIndex, column, mergeCondition, customRule) => {
      const currentValue = data[rowIndex][column]
      let rowSpan = 1
      let colSpan = 1

      // 计算行合并
      for (let i = rowIndex + 1; i < data.length; i++) {
        if (shouldMergeValues(data[i][column], currentValue, mergeCondition, customRule)) {
          rowSpan++
        } else {
          break
        }
      }

      // 检查是否为合并区域的第一行
      for (let i = rowIndex - 1; i >= 0; i--) {
        if (shouldMergeValues(data[i][column], currentValue, mergeCondition, customRule)) {
          return { rowSpan: 0, colSpan: 0 }
        } else {
          break
        }
      }

      return { rowSpan, colSpan }
    }

    // Vuetify 数据处理函数
    const processVuetifyData = (tableData, spanConfig) => {
      if (!spanConfig || !spanConfig.mergeColumns || spanConfig.mergeColumns.length === 0) {
        return tableData
      }
      
      const processedData = []
      const { mergeColumns, mergeCondition = 'same', customRule } = spanConfig
      
      for (let i = 0; i < tableData.length; i++) {
        const row = { ...tableData[i] }
        
        mergeColumns.forEach(column => {
          const spanInfo = calculateVuetifySpan(tableData, i, column, mergeCondition, customRule)
          row._merge = row._merge || {}
          row._merge[column] = spanInfo
        })
        
        processedData.push(row)
      }
      
      return processedData
    }
    
    // Vuetify 合并计算
    const calculateVuetifySpan = (data, rowIndex, column, mergeCondition, customRule) => {
      const currentValue = data[rowIndex][column]
      let rowspan = 1
      let shouldShow = true

      // 计算行合并数量
      for (let i = rowIndex + 1; i < data.length; i++) {
        if (shouldMergeValues(data[i][column], currentValue, mergeCondition, customRule)) {
          rowspan++
        } else {
          break
        }
      }

      // 检查是否应该隐藏（不是合并的第一行）
      for (let i = rowIndex - 1; i >= 0; i--) {
        if (shouldMergeValues(data[i][column], currentValue, mergeCondition, customRule)) {
          shouldShow = false
          break
        } else {
          break
        }
      }

      return { rowspan, shouldShow }
    }

    // Quasar 数据处理函数
    const processQuasarData = (tableData, spanConfig) => {
      if (!spanConfig || !spanConfig.mergeColumns || spanConfig.mergeColumns.length === 0) {
        return tableData
      }
      
      const processedData = []
      const { mergeColumns, mergeCondition = 'same', customRule } = spanConfig
      
      for (let i = 0; i < tableData.length; i++) {
        const row = { ...tableData[i] }
        
        mergeColumns.forEach(column => {
          const mergeInfo = calculateQuasarSpan(tableData, i, column, mergeCondition, customRule)
          row._cellMerge = row._cellMerge || {}
          row._cellMerge[column] = mergeInfo
        })
        
        processedData.push(row)
      }
      
      return processedData
    }
    
    // Quasar 合并计算
    const calculateQuasarSpan = (data, rowIndex, column, mergeCondition, customRule) => {
      const currentValue = data[rowIndex][column]
      let rowspan = 1
      let shouldRender = true

      // 向下查找相同值
      for (let i = rowIndex + 1; i < data.length; i++) {
        if (shouldMergeValues(data[i][column], currentValue, mergeCondition, customRule)) {
          rowspan++
        } else {
          break
        }
      }

      // 检查是否为合并区域的首行
      for (let i = rowIndex - 1; i >= 0; i--) {
        if (shouldMergeValues(data[i][column], currentValue, mergeCondition, customRule)) {
          shouldRender = false
          break
        } else {
          break
        }
      }

      return { rowspan, shouldRender }
    }

    // 通用合并条件判断函数
    const shouldMergeValues = (value1, value2, mergeCondition, customRule) => {
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

    // Element Plus span-method
    const spanMethod = ({ row, column, rowIndex, columnIndex }) => {
      try {
        const adapter = uiLibraryManager.getAdapter('element-plus')
        if (adapter) {
          const result = calculateSpan({ row, column, rowIndex, columnIndex })
          emit('span-method', { row, column, rowIndex, columnIndex })
          return result
        }
      } catch (error) {
        console.error('计算合并时出错:', error)
      }
      return { rowspan: 1, colspan: 1 }
    }

    const calculateSpan = ({ row, column, rowIndex, columnIndex }) => {
      const { mergeType, mergeColumns, mergeCondition, startRow, endRow } = props.spanConfig
      
      // 检查是否在合并范围内
      if (startRow !== undefined && rowIndex < startRow) {
        return { rowspan: 1, colspan: 1 }
      }
      if (endRow !== undefined && rowIndex > endRow) {
        return { rowspan: 1, colspan: 1 }
      }
      
      // 检查是否为要合并的列
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
      
      // 向下查找相同值
      for (let i = rowIndex + 1; i < props.tableData.length; i++) {
        if (shouldMerge(props.tableData[i][column.property], currentValue)) {
          rowspan++
        } else {
          break
        }
      }
      
      // 检查是否为合并区域的第一行
      for (let i = rowIndex - 1; i >= 0; i--) {
        if (shouldMerge(props.tableData[i][column.property], currentValue)) {
          return { rowspan: 0, colspan: 0 }
        } else {
          break
        }
      }
      
      return { rowspan, colspan }
    }

    const calculateColumnSpan = ({ row, column, rowIndex, columnIndex }) => {
      // 列合并逻辑
      return { rowspan: 1, colspan: 1 }
    }

    const calculateMixedSpan = ({ row, column, rowIndex, columnIndex }) => {
      // 混合合并逻辑
      return { rowspan: 1, colspan: 1 }
    }

    const shouldMerge = (value1, value2) => {
      const { mergeCondition, customRule } = props.spanConfig
      
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

    // Ant Design Vue 列配置
    const antdColumns = computed(() => {
      if (props.tableData.length === 0) return []
      
      const fields = Object.keys(props.tableData[0])
      const { mergeColumns = [] } = props.spanConfig || {}
      
      return fields.map(field => ({
        title: field,
        dataIndex: field,
        key: field,
        customCell: mergeColumns.includes(field) ? (record) => {
          const rowSpan = record[`${field}_rowSpan`] || 1
          const colSpan = record[`${field}_colSpan`] || 1
          return { rowSpan, colSpan }
        } : undefined
      }))
    })

    // Naive UI 列配置
    const naiveColumns = computed(() => {
      if (props.tableData.length === 0) return []
      
      const fields = Object.keys(props.tableData[0])
      const { mergeColumns = [] } = props.spanConfig || {}
      
      return fields.map(field => ({
        title: field,
        key: field,
        render: mergeColumns.includes(field) ? (rowData, rowIndex) => {
          // Naive UI 的合并渲染逻辑
          return rowData[field]
        } : (rowData) => rowData[field]
      }))
    })

    // Vuetify 表头配置
    const vuetifyHeaders = computed(() => {
      if (props.tableData.length === 0) return []
      
      const fields = Object.keys(props.tableData[0])
      return fields.map(field => ({
        title: field,
        value: field,
        sortable: true
      }))
    })

    // Vuetify 自定义表格合并方法
    const shouldShowVuetifyCustomCell = (row, field) => {
      // 检查是否为需要合并的列
      const mergeColumns = (props.spanConfig && props.spanConfig.mergeColumns) || []
      if (!mergeColumns.includes(field)) {
        return true // 非合并列，始终显示
      }
      
      // 对于合并列，检查合并信息
      const mergeInfo = row._merge && row._merge[field]
      if (!mergeInfo) {
        return true // 没有合并信息，显示
      }
      
      return mergeInfo.shouldShow // 根据合并信息决定是否显示
    }

    const getVuetifyCustomCellClass = (row, field, rowIndex, colIndex) => {
      let classes = ['vuetify-cell']
      
      // 只有合并列才检查合并信息
      const mergeColumns = (props.spanConfig && props.spanConfig.mergeColumns) || []
      if (mergeColumns.includes(field)) {
        const mergeInfo = row._merge && row._merge[field]
        
        if (mergeInfo && mergeInfo.shouldShow && mergeInfo.rowspan > 1) {
          classes.push('merged-cell-custom')
          classes.push(`rowspan-${mergeInfo.rowspan}`)
        }
      }
      
      return classes.join(' ')
    }

    const getVuetifyCustomCellStyle = (row, field, rowIndex, colIndex) => {
      // 只有合并列才检查合并信息
      const mergeColumns = (props.spanConfig && props.spanConfig.mergeColumns) || []
      if (!mergeColumns.includes(field)) {
        return {} // 非合并列，不需要特殊样式
      }
      
      const mergeInfo = row._merge && row._merge[field]
      
      if (mergeInfo && mergeInfo.shouldShow && mergeInfo.rowspan > 1) {
        // 计算合并单元格的高度
        const rowHeight = 48 // Vuetify 默认行高
        const borderHeight = mergeInfo.rowspan - 1 // 内部边框高度
        const totalHeight = rowHeight * mergeInfo.rowspan + borderHeight
        
        return {
          height: `${totalHeight}px`,
          verticalAlign: 'middle',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10
        }
      }
      
      return {}
    }

    // 更新原有的Vuetify方法保持兼容性
    const shouldShowVuetifyCell = (item, field) => {
      const mergeInfo = item._merge && item._merge[field]
      return !mergeInfo || mergeInfo.shouldShow
    }

    const getVuetifyCellClass = (item, field) => {
      const mergeInfo = item._merge && item._merge[field]
      if (mergeInfo && mergeInfo.shouldShow && mergeInfo.rowspan > 1) {
        return `merged-cell merged-cell-vuetify rowspan-${mergeInfo.rowspan}`
      }
      return ''
    }

    const getVuetifyRowspan = (item, field) => {
      const mergeInfo = item._merge && item._merge[field]
      return mergeInfo && mergeInfo.shouldShow ? mergeInfo.rowspan : 1
    }

    // Quasar 列配置
    const quasarColumns = computed(() => {
      if (props.tableData.length === 0) return []
      
      const fields = Object.keys(props.tableData[0])
      return fields.map(field => ({
        name: field,
        label: field,
        field: field,
        align: 'left',
        sortable: true
      }))
    })

    // Quasar 合并相关方法
    const shouldRenderQuasarCell = (row, colName) => {
      const mergeInfo = row._cellMerge && row._cellMerge[colName]
      return !mergeInfo || mergeInfo.shouldRender
    }

    const getQuasarCellRowspan = (row, colName) => {
      const mergeInfo = row._cellMerge && row._cellMerge[colName]
      return mergeInfo && mergeInfo.shouldRender ? mergeInfo.rowspan : 1
    }

    const getQuasarCellClasses = (row, colName) => {
      const mergeInfo = row._cellMerge && row._cellMerge[colName]
      if (mergeInfo && mergeInfo.shouldRender && mergeInfo.rowspan > 1) {
        return `merged-cell merged-cell-quasar rowspan-${mergeInfo.rowspan}`
      }
      return ''
    }

    const getColumnMinWidth = (field) => {
      const columnCount = tableFields.value.length

      // 计算字段名和内容的最大长度
      const maxLength = Math.max(
        field.length,
        ...props.tableData.map(row => String(row[field] || '').length)
      )

      // 根据列数调整最小宽度策略
      if (columnCount <= 5) {
        // 列数少时，让列自动扩展填充表格
        return Math.max(maxLength * 8 + 40, 120)
      } else {
        // 列数多时，设置固定的合理宽度，确保所有列都能显示
        const baseWidth = Math.max(maxLength * 6 + 32, 100)
        return Math.min(baseWidth, 150) // 限制最大宽度避免过宽
      }
    }

    const refreshPreview = () => {
      // 强制重新渲染表格
      // 可以在这里添加刷新逻辑
    }

    const getMergeTypeText = () => {
      const typeMap = {
        'row': '行合并',
        'column': '列合并',
        'mixed': '混合合并'
      }
      return typeMap[props.spanConfig.mergeType] || '行合并'
    }

    // 计算表格需要的总宽度
    const tableScrollWidth = computed(() => {
      const columnCount = tableFields.value.length
      if (columnCount === 0) return '100%'

      // 如果列数较少，使用自适应宽度
      if (columnCount <= 6) {
        return '100%'
      }

      // 计算所有列的最小宽度总和
      const totalWidth = tableFields.value.reduce((total, field) => {
        return total + getColumnMinWidth(field)
      }, 0)

      // 为多列表格设置固定宽度，确保有滚动条
      const minScrollWidth = columnCount * 120 // 每列至少120px
      const calculatedWidth = Math.max(totalWidth, minScrollWidth, 1400)

      return calculatedWidth + 'px'
    })

    // 监听当前UI库变化
    watch(() => props.currentLibrary, async (newLibrary) => {
      if (uiLibraryManager.hasAdapter(newLibrary)) {
        uiLibraryManager.setCurrentAdapter(newLibrary)
      }
    }, { immediate: true })

    return {
      tableFields,
      currentLibraryName,
      processedTableData,
      isCurrentLibraryAvailable,
      isLoadingLibrary,
      loadingProgress,
      libraryLoadError,
      loadUILibrary,
      getTableComponent,
      getTableProps,
      getTableSlots,
      spanMethod,
      antdColumns,
      naiveColumns,
      vuetifyHeaders,
      quasarColumns,
      shouldShowVuetifyCell,
      getVuetifyCellClass,
      getVuetifyRowspan,
      shouldShowVuetifyCustomCell,
      getVuetifyCustomCellClass,
      getVuetifyCustomCellStyle,
      shouldRenderQuasarCell,
      getQuasarCellRowspan,
      getQuasarCellClasses,
      getColumnMinWidth,
      refreshPreview,
      getMergeTypeText,
      tableScrollWidth,
      Refresh,
      // 暴露props给模板使用
      spanConfig: toRef(props, 'spanConfig'),
      currentLibrary: toRef(props, 'currentLibrary'),
      tableData: toRef(props, 'tableData')
    }
  }
}
</script>

<style scoped>
.universal-table-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 200px);
}

/* 预览头部 */
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 16px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.header-info {
  flex: 1;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.ui-library-badge {
  font-size: 12px;
  color: #3b82f6;
  background: #eff6ff;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 600;
  border: 1px solid #dbeafe;
}

.data-count {
  font-size: 13px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.column-count {
  font-size: 12px;
  color: #f59e0b;
  background: #fef3c7;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 预览内容 */
.preview-content {
  flex: 1;
  min-height: 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}

.table-container {
  flex: 1;
  min-height: 0;
  overflow: auto;
  width: 100%;
  position: relative;
}

/* 通用表格样式 */
.preview-table {
  border-radius: 8px;
  min-width: fit-content;
}

/* 降级表格样式 */
.fallback-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.fallback-table th,
.fallback-table td {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.fallback-table th {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
  font-size: 13px;
}

.fallback-table.table-bordered th,
.fallback-table.table-bordered td {
  border: 1px solid #e5e7eb;
}

.fallback-table.table-striped tbody tr:nth-child(odd) {
  background-color: #fafafa;
}

/* 单元格内容 */
.cell-content {
  line-height: 1.5;
  word-break: break-word;
  position: relative;
}

/* 合并单元格样式 */
.merged-cell {
  vertical-align: top;
  border-bottom: 1px solid #e0e0e0 !important;
}

/* Vuetify 特定的合并单元格样式 */
.merged-cell-vuetify {
  vertical-align: middle !important;
  text-align: center !important;
  position: relative;
}

/* 移除合并单元格之间的边框 */
.merged-cell-vuetify::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 1px;
  background: transparent;
  z-index: 10;
}

/* Vuetify 表格合并样式 */
:deep(.v-data-table .merged-cell-vuetify) {
  border-bottom: none !important;
  vertical-align: middle !important;
  text-align: center !important;
}

/* 为合并的单元格添加边框处理 */
:deep(.v-data-table tbody tr td.merged-cell-vuetify) {
  border-bottom: 1px solid transparent !important;
  vertical-align: middle !important;
}

/* 最后一个合并单元格恢复底部边框 */
:deep(.v-data-table tbody tr td.merged-cell-vuetify:not([rowspan="1"])) {
  border-bottom: 1px solid #e0e0e0 !important;
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

/* 隐藏被合并的单元格的边框 */
.vuetify-custom-table tbody tr:has(.merged-cell-custom) + tr .vuetify-cell,
.vuetify-custom-table tbody tr:has(.merged-cell-custom) + tr + tr .vuetify-cell {
  border-top: none !important;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .vuetify-header,
  .vuetify-cell {
    padding: 8px 12px;
    font-size: 13px;
  }
}
.merged-cell-quasar {
  vertical-align: middle !important;
  text-align: center !important;
}

/* Quasar 表格合并样式 */
:deep(.q-table .merged-cell-quasar) {
  vertical-align: middle !important;
  text-align: center !important;
  border-bottom: 1px solid #e0e0e0 !important;
}

/* 移除Quasar合并单元格之间的边框 */
:deep(.q-table tbody tr td.merged-cell-quasar) {
  border-bottom: 1px solid transparent !important;
}

/* 最后一个Quasar合并单元格恢复底部边框 */
:deep(.q-table tbody tr td.merged-cell-quasar:not([rowspan="1"])) {
  border-bottom: 1px solid #e0e0e0 !important;
}

/* 空状态 */
.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: #fafbfc;
}

.empty-text {
  margin: 8px 0 16px 0;
  color: #6b7280;
  font-size: 14px;
}

/* 合并信息 */
.merge-info {
  margin-top: 12px;
  padding: 12px 16px;
  background: #f0f9ff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
  flex-shrink: 0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-text {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.library-info {
  font-size: 12px;
  color: #6b7280;
  margin-left: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .preview-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding-bottom: 12px;
  }

  .header-actions {
    align-self: stretch;
  }

  .title-section {
    gap: 8px;
    flex-wrap: wrap;
  }

  .preview-title {
    font-size: 15px;
  }

  .table-container {
    height: 100%;
  }

  .empty-state {
    padding: 20px 16px;
  }

  .merge-info {
    margin-top: 8px;
    padding: 8px 12px;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .library-info {
    margin-left: 0;
  }
}

/* 加载状态 */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  background: #fafbfc;
}

.loading-content {
  text-align: center;
  padding: 40px;
}

.loading-icon {
  font-size: 48px;
  color: #3b82f6;
  margin-bottom: 16px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 16px;
  color: #374151;
  margin-bottom: 16px;
  font-weight: 500;
}

.loading-tip {
  font-size: 13px;
  color: #6b7280;
  margin-top: 8px;
}

/* 错误状态 */
.error-state {
  padding: 20px;
  background: #fafbfc;
}

.error-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

/* 库加载提示 */
.library-notice {
  padding: 20px;
  background: #fafbfc;
}

.notice-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.table-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.table-container::-webkit-scrollbar-corner {
  background: #f1f5f9;
}
</style>