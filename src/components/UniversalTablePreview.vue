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
        <!-- 拖拽模式切换 -->
        <el-radio-group v-model="dragMode" size="small" @change="handleDragModeChange">
          <el-radio-button label="none">
            <el-icon><Lock /></el-icon>
            <span>禁止拖拽</span>
          </el-radio-button>
          <el-radio-button label="column">
            <el-icon><DCaret /></el-icon>
            <span>列拖拽</span>
          </el-radio-button>
          <el-radio-button label="row">
            <el-icon><Sort /></el-icon>
            <span>行拖拽</span>
          </el-radio-button>
        </el-radio-group>

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
          :key="tableKey"
          :data="processedTableData"
          :span-method="spanMethod"
          :border="spanConfig.showBorder"
          :stripe="spanConfig.stripe"
          height="100%"
          :style="{ width: tableScrollWidth, minWidth: tableScrollWidth }"
          class="preview-table"
        >
          <!-- 动态生成列结构 -->
          <template v-if="spanConfig.mergeType === 'column' || spanConfig.mergeType === 'mixed'">
            <!-- 合并列组 -->
            <el-table-column
              v-if="mergedColumnGroup.length > 0"
              align="center"
            >
              <!-- 自定义表头插槽 -->
              <template #header>
                <div class="editable-header-wrapper">
                  <!-- 编辑模式 -->
                  <el-input
                    v-if="isEditingHeader"
                    ref="headerInputRef"
                    v-model="customHeaderLabel"
                    size="small"
                    @blur="finishEditHeader"
                    @keydown="handleHeaderKeydown"
                    class="header-input"
                    placeholder="请输入表头名称"
                  />
                  <!-- 显示模式 -->
                  <div
                    v-else
                    class="editable-header-label"
                    @click="startEditHeader"
                    :title="'点击编辑表头名称'"
                  >
                    {{ getMergedColumnGroupLabel() }}
                    <el-icon class="edit-icon"><Edit /></el-icon>
                  </div>
                </div>
              </template>

              <el-table-column
                v-for="field in mergedColumnGroup"
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
            </el-table-column>
            
            <!-- 非合并列 -->
            <el-table-column
              v-for="field in nonMergedColumns"
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
          </template>
          
          <!-- 行合并或正常表格 -->
          <template v-else>
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
          </template>
        </el-table>

        <!-- Ant Design Vue 表格 -->
        <a-table
          v-else-if="currentLibrary === 'ant-design-vue'"
          :data-source="processedTableData"
          :bordered="spanConfig.showBorder"
          :pagination="false"
          :scroll="{ x: 'max-content' }"
          size="middle"
          class="preview-table"
        >
          <!-- 列合并或混合合并模式 -->
          <template v-if="spanConfig.mergeType === 'column' || spanConfig.mergeType === 'mixed'">
            <!-- 合并列组 -->
            <a-table-column-group
              v-if="mergedColumnGroup.length > 0"
              align="center"
            >
              <!-- 自定义表头 -->
              <template #title>
                <div class="editable-header-wrapper">
                  <!-- 编辑模式 -->
                  <input
                    v-if="isEditingHeader"
                    ref="headerInputRef"
                    v-model="customHeaderLabel"
                    @blur="finishEditHeader"
                    @keydown="handleHeaderKeydown"
                    class="antd-header-input"
                    placeholder="请输入表头名称"
                  />
                  <!-- 显示模式 -->
                  <div
                    v-else
                    class="editable-header-label"
                    @click="startEditHeader"
                    :title="'点击编辑表头名称'"
                  >
                    {{ getMergedColumnGroupLabel() }}
                    <span class="edit-icon-antd">✏️</span>
                  </div>
                </div>
              </template>

              <!-- 子列 -->
              <a-table-column
                v-for="field in mergedColumnGroup"
                :key="field"
                :data-index="field"
                :title="field"
                :width="getColumnMinWidth(field)"
                :ellipsis="true"
              />
            </a-table-column-group>

            <!-- 非合并列 -->
            <a-table-column
              v-for="field in nonMergedColumns"
              :key="field"
              :data-index="field"
              :title="field"
              :width="getColumnMinWidth(field)"
              :ellipsis="true"
              :custom-cell="(record, index) => {
                if (spanConfig.mergeType === 'mixed' && field === nonMergedColumns[0]) {
                  return calculateAntdMixedRowSpan(tableData, index, field, spanConfig)
                }
                return {}
              }"
            />
          </template>

          <!-- 行合并模式 -->
          <template v-else>
            <a-table-column
              v-for="field in tableFields"
              :key="field"
              :data-index="field"
              :title="field"
              :width="getColumnMinWidth(field)"
              :ellipsis="true"
              :custom-cell="(record, index) => {
                if (spanConfig.mergeColumns && spanConfig.mergeColumns.includes(field)) {
                  return calculateAntdCellSpan(tableData, index, field, spanConfig)
                }
                return {}
              }"
            />
          </template>
        </a-table>

        <!-- Naive UI 表格 -->
        <n-data-table
          v-else-if="currentLibrary === 'naive-ui'"
          :data="processedTableData"
          :columns="naiveColumnsWithSlots"
          :bordered="spanConfig.showBorder"
          :striped="spanConfig.stripe"
          :pagination="false"
          size="medium"
          :single-line="false"
          :scroll-x="tableFields.length > 6 ? 1200 : undefined"
          class="preview-table"
        />

        <!-- 其他UI库的表格组件（Vuetify等） -->
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

        <!-- Vuetify 特殊处理 - 使用自定义表格结构支持完整合并 -->
        <div v-else-if="currentLibrary === 'vuetify'" class="vuetify-table-wrapper">
          <table class="vuetify-custom-table" :class="{ 'bordered': spanConfig.showBorder, 'striped': spanConfig.stripe }">
            <!-- 多层表头 -->
            <thead>
              <!-- 列合并或混合合并的表头 -->
              <template v-if="spanConfig.mergeType === 'column' || spanConfig.mergeType === 'mixed'">
                <!-- 第一层表头：合并列组 -->
                <tr class="vuetify-header-row">
                  <th
                    v-if="mergedColumnGroup.length > 0"
                    :colspan="mergedColumnGroup.length"
                    class="vuetify-header merged-header"
                  >
                    <!-- 可编辑表头 -->
                    <div class="editable-header-wrapper">
                      <!-- 编辑模式 -->
                      <input
                        v-if="isEditingHeader"
                        ref="headerInputRef"
                        v-model="customHeaderLabel"
                        @blur="finishEditHeader"
                        @keydown="handleHeaderKeydown"
                        class="vuetify-header-input"
                        placeholder="请输入表头名称"
                      />
                      <!-- 显示模式 -->
                      <div
                        v-else
                        class="editable-header-label"
                        @click="startEditHeader"
                        :title="'点击编辑表头名称'"
                      >
                        {{ getMergedColumnGroupLabel() }}
                        <el-icon class="edit-icon"><Edit /></el-icon>
                      </div>
                    </div>
                  </th>
                  <th
                    v-for="field in nonMergedColumns"
                    :key="field"
                    :rowspan="2"
                    class="vuetify-header normal-header"
                  >
                    {{ field }}
                  </th>
                </tr>
                <!-- 第二层表头：合并列组的子列 -->
                <tr class="vuetify-header-row">
                  <th 
                    v-for="field in mergedColumnGroup" 
                    :key="field" 
                    class="vuetify-header sub-header"
                  >
                    {{ field }}
                  </th>
                </tr>
              </template>
              
              <!-- 行合并的表头 -->
              <template v-else>
                <tr>
                  <th v-for="field in tableFields" :key="field" class="vuetify-header">
                    {{ field }}
                  </th>
                </tr>
              </template>
            </thead>
            
            <tbody>
              <tr v-for="(row, rowIndex) in processedTableData" :key="rowIndex" 
                  :class="{ 'striped-row': spanConfig.stripe && rowIndex % 2 === 1 }">
                <!-- 列合并或混合合并的数据行 -->
                <template v-if="spanConfig.mergeType === 'column' || spanConfig.mergeType === 'mixed'">
                  <!-- 合并列组的数据 -->
                  <td v-for="(field, colIndex) in mergedColumnGroup" :key="field" 
                      class="vuetify-cell merged-group-cell">
                    {{ row[field] }}
                  </td>
                  <!-- 非合并列的数据 -->
                  <td v-for="(field, colIndex) in nonMergedColumns" :key="field" 
                      :class="getVuetifyMixedCellClass(row, field, rowIndex, colIndex)"
                      :style="getVuetifyMixedCellStyle(row, field, rowIndex, colIndex)"
                      :rowspan="getVuetifyMixedRowspan(row, field, rowIndex)"
                      v-show="shouldShowVuetifyMixedCell(row, field, rowIndex)"
                      class="vuetify-cell">
                    {{ row[field] }}
                  </td>
                </template>
                
                <!-- 行合并的数据行（原有逻辑） -->
                <template v-else>
                  <td v-for="(field, colIndex) in tableFields" :key="field" 
                      :class="getVuetifyCustomCellClass(row, field, rowIndex, colIndex)"
                      :style="getVuetifyCustomCellStyle(row, field, rowIndex, colIndex)"
                      :rowspan="getVuetifyCustomRowspan(row, field)"
                      :colspan="getVuetifyCustomColspan(row, field)"
                      v-show="shouldShowVuetifyCustomCell(row, field)"
                      class="vuetify-cell">
                    {{ row[field] }}
                  </td>
                </template>
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
import { ref, computed, watch, inject, nextTick, h, toRef, onMounted, onBeforeUnmount } from 'vue'
import { Loading, Refresh, Lock, DCaret, Sort, Edit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { uiLibraryManager } from '../adapters/UILibraryManager.js'
import { message } from 'ant-design-vue'
import Sortable from 'sortablejs'

export default {
  name: 'UniversalTablePreview',
  components: {
    Loading,
    Lock,
    DCaret,
    Sort
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
  emits: ['span-method', 'data-change', 'header-label-change'],
  setup(props, { emit }) {
    // 注入UI库实例
    const antd = inject('$antd', null)
    const naive = inject('$naive', null) 
    const vuetify = inject('$vuetify', null)

    // 所有UI库都已安装，直接标记为可用
    const isLoadingLibrary = ref(false)
    const loadingProgress = ref(0)
    const libraryLoadError = ref('')
    const availableLibraries = ref(new Set(['element-plus', 'ant-design-vue', 'naive-ui', 'vuetify']))

    // 拖拽相关状态
    const dragMode = ref('none') // 'none' | 'column' | 'row'
    const columnSortable = ref(null)
    const rowSortable = ref(null)
    const localTableData = ref([...props.tableData])
    const localTableFields = ref([])
    const tableKey = ref(0) // 用于强制表格重新渲染
    const isDragging = ref(false) // 标记是否正在拖拽操作中

    // 可编辑表头相关状态
    const customHeaderLabel = ref('') // 自定义表头名称
    const isEditingHeader = ref(false) // 是否正在编辑表头
    const headerInputRef = ref(null) // 输入框引用

    // 更新本地数据
    watch(() => props.tableData, (newData) => {
      localTableData.value = [...newData]
      // 数据更新时重置字段列表，强制表格重新渲染
      localTableFields.value = []
      tableKey.value++
    }, { deep: true, immediate: true })

    const tableFields = computed(() => {
      if (localTableData.value.length === 0) return []
      return localTableFields.value.length > 0
        ? localTableFields.value
        : Object.keys(localTableData.value[0])
    })

    // 合并列组和非合并列的计算属性
    const mergedColumnGroup = computed(() => {
      if (props.spanConfig.mergeType === 'column' || props.spanConfig.mergeType === 'mixed') {
        return props.spanConfig.mergeColumns || []
      }
      return []
    })

    const nonMergedColumns = computed(() => {
      if (props.spanConfig.mergeType === 'column' || props.spanConfig.mergeType === 'mixed') {
        const mergeColumns = props.spanConfig.mergeColumns || []
        return tableFields.value.filter(field => !mergeColumns.includes(field))
      }
      return tableFields.value
    })

    // 获取合并列组的标签
    const getMergedColumnGroupLabel = () => {
      // 优先使用自定义名称
      if (customHeaderLabel.value) {
        return customHeaderLabel.value
      }

      const mergeColumns = props.spanConfig.mergeColumns || []
      if (mergeColumns.length === 0) return ''

      // 根据列名推断分组名称
      const columnGroups = {
        'region,province,city': '地理信息',
        'phone,email': '联系方式',
        'category,type': '分类信息',
        'first_name,last_name': '姓名',
        'start_date,end_date': '时间范围',
        'width,height': '尺寸',
        'min,max': '范围',
        'address,zipcode': '地址信息'
      }

      const key = mergeColumns.join(',')
      return columnGroups[key] || `${mergeColumns[0]}等信息`
    }

    // 表头编辑相关方法
    const startEditHeader = () => {
      if (props.spanConfig.mergeType !== 'column' && props.spanConfig.mergeType !== 'mixed') {
        return // 只在列合并和混合合并模式下允许编辑
      }

      isEditingHeader.value = true
      // 如果没有自定义名称，使用当前默认名称
      if (!customHeaderLabel.value) {
        customHeaderLabel.value = getMergedColumnGroupLabel()
      }

      // 聚焦输入框
      nextTick(() => {
        if (headerInputRef.value) {
          headerInputRef.value.focus()
          headerInputRef.value.select()
        }
      })
    }

    const finishEditHeader = () => {
      isEditingHeader.value = false

      // 如果输入为空，恢复默认名称
      if (!customHeaderLabel.value || customHeaderLabel.value.trim() === '') {
        customHeaderLabel.value = ''
      }

      // 通知父组件表头名称已更改
      emit('header-label-change', customHeaderLabel.value)

      ElMessage.success({
        message: `表头名称已更新为: ${getMergedColumnGroupLabel()}`,
        duration: 2000
      })
    }

    const cancelEditHeader = () => {
      isEditingHeader.value = false
      // 恢复之前的值或默认值
      customHeaderLabel.value = customHeaderLabel.value || ''
    }

    const handleHeaderKeydown = (event) => {
      if (event.key === 'Enter') {
        finishEditHeader()
      } else if (event.key === 'Escape') {
        cancelEditHeader()
      }
    }

    // 监听合并列变化，重置自定义表头
    watch(() => props.spanConfig.mergeColumns, () => {
      customHeaderLabel.value = ''
    }, { deep: true })

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
        default:
          return 'div'
      }
    }

    // 获取表格属性
    const getTableProps = () => {
      switch (props.currentLibrary) {
        case 'ant-design-vue':
          return {
            dataSource: localTableData.value, // 使用本地数据
            columns: antdColumns.value,
            bordered: props.spanConfig.showBorder,
            size: 'middle',
            pagination: false,
            scroll: { x: 'max-content' },
            rowKey: (record, index) => index
          }
        case 'naive-ui':
          return {
            data: localTableData.value, // 使用本地数据
            columns: naiveColumns.value,
            bordered: props.spanConfig.showBorder,
            striped: props.spanConfig.stripe,
            size: 'medium',
            'single-line': false,
            pagination: false,
            'scroll-x': tableFields.value.length > 6 ? 1200 : undefined
          }
        case 'vuetify':
          return {
            items: processedTableData.value,
            headers: vuetifyHeaders.value,
            'items-per-page': -1,
            'hide-default-footer': true
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
        'vuetify': 'Vuetify'
      }
      return names[libraryId] || libraryId
    }

    // 获取处理后的表格数据 - 使用适配器统一处理
    const processedTableData = computed(() => {
      if (!localTableData.value || localTableData.value.length === 0) {
        return []
      }

      try {
        // 使用UILibraryManager统一处理数据，但Ant Design Vue不需要预处理
        const adapter = uiLibraryManager.getAdapter(props.currentLibrary)
        if (adapter && typeof adapter.processTableData === 'function' && props.currentLibrary !== 'ant-design-vue') {
          return adapter.processTableData(localTableData.value, props.spanConfig)
        }

        // 降级处理：根据当前UI库类型进行不同的数据处理
        switch (props.currentLibrary) {
          case 'ant-design-vue':
            // Ant Design Vue 按照官方文档，不需要预处理数据
            return localTableData.value

          case 'vuetify':
            // Vuetify 需要添加合并元数据
            return processVuetifyData(localTableData.value, props.spanConfig)

          case 'naive-ui':
          case 'element-plus':
          default:
            // Naive UI 和 Element Plus 使用原始数据
            return localTableData.value
        }
      } catch (error) {
        console.error('处理表格数据时出错:', error)
        return localTableData.value
      }
    })

    // Ant Design Vue 数据处理函数 - 修复列错位问题
    const processAntdData = (tableData, spanConfig) => {
      if (!spanConfig || !spanConfig.mergeColumns || spanConfig.mergeColumns.length === 0) {
        return tableData.map((row, index) => ({ ...row, _originalIndex: index }))
      }
      
      const processedData = []
      const { mergeColumns, mergeCondition = 'same', customRule, startRow = 0, endRow } = spanConfig
      
      if (process.env.NODE_ENV === 'development') {
        console.log('processAntdData - 开始处理数据:', {
          dataLength: tableData.length,
          mergeColumns,
          startRow,
          endRow
        })
      }
      
      for (let i = 0; i < tableData.length; i++) {
        const row = { ...tableData[i], _originalIndex: i }
        
        // 初始化所有列的合并信息
        const fields = Object.keys(tableData[i])
        fields.forEach(field => {
          if (!mergeColumns.includes(field)) {
            // 非合并列默认不合并
            row[`${field}_rowSpan`] = 1
            row[`${field}_colSpan`] = 1
          }
        })
        
        // 检查是否在合并范围内
        if (i >= startRow && (endRow === undefined || i <= endRow)) {
          mergeColumns.forEach(column => {
            const spanInfo = calculateAntdSpan(tableData, i, column, mergeCondition, customRule, startRow, endRow)
            row[`${column}_rowSpan`] = spanInfo.rowSpan
            row[`${column}_colSpan`] = spanInfo.colSpan
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`处理行 ${i}, 列 ${column}:`, spanInfo)
            }
          })
        } else {
          // 不在合并范围内的行，设置默认值
          mergeColumns.forEach(column => {
            row[`${column}_rowSpan`] = 1
            row[`${column}_colSpan`] = 1
          })
        }
        
        processedData.push(row)
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('processAntdData - 处理完成:', processedData)
      }
      
      return processedData
    }
    
    // Ant Design Vue 合并计算 - 降级备用
    const calculateAntdSpan = (data, rowIndex, column, mergeCondition, customRule, startRow = 0, endRow) => {
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
        if (shouldMergeValues(data[i][column], currentValue, mergeCondition, customRule)) {
          rowSpan++
        } else {
          break
        }
      }

      // 检查是否为合并区域的第一行 - 只在合并范围内检查
      for (let i = rowIndex - 1; i >= startRow; i--) {
        if (shouldMergeValues(data[i][column], currentValue, mergeCondition, customRule)) {
          return { rowSpan: 0, colSpan: 0 }
        } else {
          break
        }
      }

      return { rowSpan, colSpan }
    }

    // Vuetify 数据处理函数 - 支持行、列、混合合并
    const processVuetifyData = (tableData, spanConfig) => {
      if (!spanConfig || !spanConfig.mergeColumns || spanConfig.mergeColumns.length === 0) {
        return tableData
      }
      
      const processedData = []
      const { mergeColumns, mergeType = 'row', mergeCondition = 'same', customRule, startRow = 0, endRow } = spanConfig
      
      // 预处理：为每个单元格计算合并信息
      for (let i = 0; i < tableData.length; i++) {
        const row = { ...tableData[i] }
        row._merge = {}
        
        // 为每个需要合并的列计算合并信息
        mergeColumns.forEach(column => {
          const spanInfo = calculateVuetifySpan(tableData, i, column, spanConfig)
          row._merge[column] = spanInfo
        })
        
        processedData.push(row)
      }
      
      return processedData
    }
    
    // Vuetify 完整的合并计算 - 支持行、列、混合合并
    const calculateVuetifySpan = (data, rowIndex, column, spanConfig) => {
      const { mergeType = 'row', mergeCondition = 'same', customRule, startRow = 0, endRow } = spanConfig
      const currentValue = data[rowIndex][column]
      const actualEndRow = endRow !== undefined ? endRow : data.length - 1
      
      // 检查是否在合并范围内
      if (rowIndex < startRow || rowIndex > actualEndRow) {
        return { rowspan: 1, colspan: 1, shouldShow: true }
      }
      
      if (mergeType === 'row') {
        return calculateVuetifyRowSpan(data, rowIndex, column, spanConfig)
      } else if (mergeType === 'column') {
        return calculateVuetifyColSpan(data, rowIndex, column, spanConfig)
      } else if (mergeType === 'mixed') {
        return calculateVuetifyMixedSpan(data, rowIndex, column, spanConfig)
      }
      
      return { rowspan: 1, colspan: 1, shouldShow: true }
    }
    
    // 行合并计算
    const calculateVuetifyRowSpan = (data, rowIndex, column, spanConfig) => {
      const { mergeCondition = 'same', customRule, startRow = 0, endRow } = spanConfig
      const currentValue = data[rowIndex][column]
      const actualEndRow = endRow !== undefined ? endRow : data.length - 1
      let rowspan = 1
      let shouldShow = true

      // 向下计算行合并数量 - 只在合并范围内
      const maxIndex = Math.min(actualEndRow, data.length - 1)
      for (let i = rowIndex + 1; i <= maxIndex; i++) {
        if (shouldMergeValues(data[i][column], currentValue, mergeCondition, customRule)) {
          rowspan++
        } else {
          break
        }
      }

      // 检查是否应该隐藏（不是合并的第一行） - 只在合并范围内检查
      for (let i = rowIndex - 1; i >= startRow; i--) {
        if (shouldMergeValues(data[i][column], currentValue, mergeCondition, customRule)) {
          shouldShow = false
          break
        } else {
          break
        }
      }

      return { rowspan, colspan: 1, shouldShow }
    }
    
    // 列合并计算
    const calculateVuetifyColSpan = (data, rowIndex, column, spanConfig) => {
      const { mergeColumns, mergeCondition = 'same', customRule } = spanConfig
      const currentValue = data[rowIndex][column]
      const allFields = Object.keys(data[0])
      const currentFieldIndex = allFields.indexOf(column)
      let colspan = 1
      let shouldShow = true

      // 向右计算列合并数量
      for (let i = currentFieldIndex + 1; i < allFields.length; i++) {
        const nextField = allFields[i]
        // 只有在合并列列表中的列才能参与合并
        if (!mergeColumns.includes(nextField)) break
        
        if (shouldMergeValues(data[rowIndex][nextField], currentValue, mergeCondition, customRule)) {
          colspan++
        } else {
          break
        }
      }

      // 检查是否应该隐藏（不是合并的第一列）
      for (let i = currentFieldIndex - 1; i >= 0; i--) {
        const prevField = allFields[i]
        if (!mergeColumns.includes(prevField)) break
        
        if (shouldMergeValues(data[rowIndex][prevField], currentValue, mergeCondition, customRule)) {
          shouldShow = false
          break
        } else {
          break
        }
      }

      return { rowspan: 1, colspan, shouldShow }
    }
    
    // 混合合并计算（同时考虑行和列）
    const calculateVuetifyMixedSpan = (data, rowIndex, column, spanConfig) => {
      const { mergeColumns, mergeCondition = 'same', customRule, startRow = 0, endRow } = spanConfig
      const currentValue = data[rowIndex][column]
      const allFields = Object.keys(data[0])
      const currentFieldIndex = allFields.indexOf(column)
      const actualEndRow = endRow !== undefined ? endRow : data.length - 1
      
      let rowspan = 1
      let colspan = 1
      let shouldShow = true

      // 1. 先计算行合并 - 向下查找相同值的行
      const maxRowIndex = Math.min(actualEndRow, data.length - 1)
      for (let i = rowIndex + 1; i <= maxRowIndex; i++) {
        if (shouldMergeValues(data[i][column], currentValue, mergeCondition, customRule)) {
          rowspan++
        } else {
          break
        }
      }

      // 2. 再计算列合并 - 向右查找相同值的列
      for (let i = currentFieldIndex + 1; i < allFields.length; i++) {
        const nextField = allFields[i]
        if (!mergeColumns.includes(nextField)) break
        
        // 检查这一列的所有相关行是否都有相同值
        let canMergeColumn = true
        for (let row = rowIndex; row < rowIndex + rowspan; row++) {
          if (!shouldMergeValues(data[row][nextField], currentValue, mergeCondition, customRule)) {
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

      // 3. 检查是否应该隐藏（不是合并区域的左上角）
      // 检查行方向
      for (let i = rowIndex - 1; i >= startRow; i--) {
        if (shouldMergeValues(data[i][column], currentValue, mergeCondition, customRule)) {
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
          
          if (shouldMergeValues(data[rowIndex][prevField], currentValue, mergeCondition, customRule)) {
            shouldShow = false
            break
          } else {
            break
          }
        }
      }

      return { rowspan, colspan, shouldShow }
    }

    // 通用合并条件判断函数 - 增强错误处理
    const shouldMergeValues = (value1, value2, mergeCondition, customRule) => {
      try {
        if (mergeCondition === 'custom' && customRule) {
          // 使用更安全的方式执行自定义规则
          const mergeFunction = new Function('value1', 'value2', `
            try {
              return ${customRule}
            } catch (e) {
              console.error('Custom rule execution error:', e)
              return value1 === value2
            }
          `)
          return mergeFunction(value1, value2)
        }
        
        // 默认情况下使用严格等于比较
        return value1 === value2
      } catch (error) {
        console.error('合并条件判断出错:', error)
        return value1 === value2
      }
    }

    // Ant Design Vue 合并计算函数 - 按照官方文档实现
    const calculateAntdCellSpan = (tableData, rowIndex, field, spanConfig) => {
      const { mergeType = 'row', mergeColumns = [], mergeCondition = 'same', customRule, startRow = 0, endRow } = spanConfig
      const currentValue = tableData[rowIndex][field]
      
      if (mergeType === 'row') {
        return calculateAntdRowSpan(tableData, rowIndex, field, spanConfig)
      } else if (mergeType === 'column') {
        return calculateAntdColumnSpan(tableData, rowIndex, field, spanConfig)
      } else if (mergeType === 'mixed') {
        return calculateAntdMixedSpan(tableData, rowIndex, field, spanConfig)
      }
      
      return { rowSpan: 1, colSpan: 1 }
    }
    
    const calculateAntdRowSpan = (tableData, rowIndex, field, spanConfig) => {
      const { mergeCondition = 'same', customRule, startRow = 0, endRow } = spanConfig
      const currentValue = tableData[rowIndex][field]
      let rowSpan = 1
      
      // 向下查找相同值
      const maxIndex = endRow !== undefined ? Math.min(endRow, tableData.length - 1) : tableData.length - 1
      for (let i = rowIndex + 1; i <= maxIndex; i++) {
        if (shouldMergeAntdValues(tableData[i][field], currentValue, mergeCondition, customRule)) {
          rowSpan++
        } else {
          break
        }
      }
      
      // 检查是否为合并区域的第一行
      for (let i = rowIndex - 1; i >= startRow; i--) {
        if (shouldMergeAntdValues(tableData[i][field], currentValue, mergeCondition, customRule)) {
          // 不是第一行，隐藏这个单元格
          return { rowSpan: 0, colSpan: 0 }
        } else {
          break
        }
      }
      
      return { rowSpan, colSpan: 1 }
    }
    
    const calculateAntdColumnSpan = (tableData, rowIndex, field, spanConfig) => {
      const { mergeColumns = [], mergeCondition = 'same', customRule } = spanConfig
      const currentValue = tableData[rowIndex][field]
      const allFields = Object.keys(tableData[0])
      const currentFieldIndex = allFields.indexOf(field)
      let colSpan = 1
      
      // 向右查找相邻的相同值列
      for (let i = currentFieldIndex + 1; i < allFields.length; i++) {
        const nextField = allFields[i]
        if (!mergeColumns.includes(nextField)) break
        
        if (shouldMergeAntdValues(tableData[rowIndex][nextField], currentValue, mergeCondition, customRule)) {
          colSpan++
        } else {
          break
        }
      }
      
      // 检查是否是合并区域的第一列
      for (let i = currentFieldIndex - 1; i >= 0; i--) {
        const prevField = allFields[i]
        if (!mergeColumns.includes(prevField)) break
        
        if (shouldMergeAntdValues(tableData[rowIndex][prevField], currentValue, mergeCondition, customRule)) {
          return { rowSpan: 0, colSpan: 0 }
        } else {
          break
        }
      }
      
      return { rowSpan: 1, colSpan }
    }
    
    const calculateAntdMixedSpan = (tableData, rowIndex, field, spanConfig) => {
      const { mergeColumns = [], mergeCondition = 'same', customRule, startRow = 0, endRow } = spanConfig
      const currentValue = tableData[rowIndex][field]
      const allFields = Object.keys(tableData[0])
      const currentFieldIndex = allFields.indexOf(field)
      const actualEndRow = endRow !== undefined ? endRow : tableData.length - 1
      
      let rowSpan = 1
      let colSpan = 1
      
      // 1. 先计算行合并
      const maxRowIndex = Math.min(actualEndRow, tableData.length - 1)
      for (let i = rowIndex + 1; i <= maxRowIndex; i++) {
        if (shouldMergeAntdValues(tableData[i][field], currentValue, mergeCondition, customRule)) {
          rowSpan++
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
        for (let row = rowIndex; row < rowIndex + rowSpan; row++) {
          if (!shouldMergeAntdValues(tableData[row][nextField], currentValue, mergeCondition, customRule)) {
            canMergeColumn = false
            break
          }
        }
        
        if (canMergeColumn) {
          colSpan++
        } else {
          break
        }
      }
      
      // 3. 检查是否应该隐藏（不是合并区域的左上角）
      // 检查行方向
      for (let i = rowIndex - 1; i >= startRow; i--) {
        if (shouldMergeAntdValues(tableData[i][field], currentValue, mergeCondition, customRule)) {
          return { rowSpan: 0, colSpan: 0 }
        } else {
          break
        }
      }
      
      // 检查列方向
      for (let i = currentFieldIndex - 1; i >= 0; i--) {
        const prevField = allFields[i]
        if (!mergeColumns.includes(prevField)) break
        
        if (shouldMergeAntdValues(tableData[rowIndex][prevField], currentValue, mergeCondition, customRule)) {
          return { rowSpan: 0, colSpan: 0 }
        } else {
          break
        }
      }
      
      return { rowSpan, colSpan }
    }
    
    // Ant Design Vue 合并条件判断
    const shouldMergeAntdValues = (value1, value2, mergeCondition, customRule) => {
      try {
        if (mergeCondition === 'custom' && customRule) {
          const mergeFunction = new Function('value1', 'value2', `
            try {
              return ${customRule}
            } catch (e) {
              console.error('Custom rule execution error:', e)
              return value1 === value2
            }
          `)
          return mergeFunction(value1, value2)
        }
        return value1 === value2
      } catch (error) {
        console.error('Ant Design Vue 合并条件判断出错:', error)
        return value1 === value2
      }
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

      if (mergeType === 'row') {
        // 检查是否为要合并的列
        if (!mergeColumns.includes(column.property)) {
          return { rowspan: 1, colspan: 1 }
        }
        return calculateRowSpan({ row, column, rowIndex, columnIndex })
      } else if (mergeType === 'column') {
        // 列合并已通过表头结构实现，数据行不需要特殊处理
        return { rowspan: 1, colspan: 1 }
      } else if (mergeType === 'mixed') {
        // 混合合并：表头列合并 + 数据行合并
        // 对于非列合并组中的列，进行行合并
        const isInColumnGroup = mergeColumns.includes(column.property)
        if (!isInColumnGroup) {
          // 找一个合适的行合并依据列（比如第一个非合并列组的列）
          const rowMergeColumns = tableFields.value.filter(field => !mergeColumns.includes(field))
          if (rowMergeColumns.length > 0 && column.property === rowMergeColumns[0]) {
            return calculateMixedRowSpan({ row, column, rowIndex, columnIndex })
          }
        }
        return { rowspan: 1, colspan: 1 }
      }
      
      return { rowspan: 1, colspan: 1 }
    }

    // 混合合并的行合并计算（基于部门等字段进行行合并）
    const calculateMixedRowSpan = ({ row, column, rowIndex, columnIndex }) => {
      // 对于混合合并，我们基于 department 等字段进行行合并
      const departmentValue = row['department']
      if (!departmentValue) return { rowspan: 1, colspan: 1 }

      let rowspan = 1

      // 向下查找相同部门的行
      for (let i = rowIndex + 1; i < localTableData.value.length; i++) {
        if (shouldMerge(localTableData.value[i]['department'], departmentValue)) {
          rowspan++
        } else {
          break
        }
      }

      // 检查是否为合并区域的第一行
      for (let i = rowIndex - 1; i >= 0; i--) {
        if (shouldMerge(localTableData.value[i]['department'], departmentValue)) {
          return { rowspan: 0, colspan: 0 }
        } else {
          break
        }
      }

      return { rowspan, colspan: 1 }
    }

    const calculateRowSpan = ({ row, column, rowIndex, columnIndex }) => {
      const currentValue = row[column.property]
      let rowspan = 1
      let colspan = 1

      // 向下查找相同值
      for (let i = rowIndex + 1; i < localTableData.value.length; i++) {
        if (shouldMerge(localTableData.value[i][column.property], currentValue)) {
          rowspan++
        } else {
          break
        }
      }

      // 检查是否为合并区域的第一行
      for (let i = rowIndex - 1; i >= 0; i--) {
        if (shouldMerge(localTableData.value[i][column.property], currentValue)) {
          return { rowspan: 0, colspan: 0 }
        } else {
          break
        }
      }

      return { rowspan, colspan }
    }

    const calculateColumnSpan = ({ row, column, rowIndex, columnIndex }) => {
      const { mergeColumns } = props.spanConfig
      const currentValue = row[column.property]
      let colspan = 1
      let rowspan = 1
      
      // 检查当前列是否在合并列列表中
      if (!mergeColumns.includes(column.property)) {
        return { rowspan: 1, colspan: 1 }
      }
      
      // 获取所有列的顺序
      const allColumns = tableFields.value
      const currentColIndex = allColumns.indexOf(column.property)
      
      // 向右查找相邻的相同值列
      for (let i = currentColIndex + 1; i < allColumns.length; i++) {
        const nextColumn = allColumns[i]
        
        // 只检查在合并列列表中的列
        if (!mergeColumns.includes(nextColumn)) break
        
        if (shouldMerge(row[nextColumn], currentValue)) {
          colspan++
        } else {
          break
        }
      }
      
      // 检查是否是合并区域的第一列（避免重复渲染）
      for (let i = currentColIndex - 1; i >= 0; i--) {
        const prevColumn = allColumns[i]
        
        // 只检查在合并列列表中的列
        if (!mergeColumns.includes(prevColumn)) break
        
        if (shouldMerge(row[prevColumn], currentValue)) {
          // 不是第一列，隐藏此单元格
          return { rowspan: 0, colspan: 0 }
        } else {
          break
        }
      }
      
      return { rowspan, colspan }
    }

    const calculateMixedSpan = ({ row, column, rowIndex, columnIndex }) => {
      const { mergeColumns } = props.spanConfig
      const currentValue = row[column.property]
      let rowspan = 1
      let colspan = 1

      // 检查当前列是否在合并列列表中
      if (!mergeColumns.includes(column.property)) {
        return { rowspan: 1, colspan: 1 }
      }

      // 1. 先计算行合并
      // 向下查找相同值的行
      for (let i = rowIndex + 1; i < localTableData.value.length; i++) {
        if (shouldMerge(localTableData.value[i][column.property], currentValue)) {
          rowspan++
        } else {
          break
        }
      }

      // 检查是否为行合并区域的第一行
      for (let i = rowIndex - 1; i >= 0; i--) {
        if (shouldMerge(localTableData.value[i][column.property], currentValue)) {
          // 不是第一行，但还需要检查列合并
          break
        } else {
          break
        }
      }

      // 2. 再计算列合并（在同一行内）
      const allColumns = tableFields.value
      const currentColIndex = allColumns.indexOf(column.property)

      // 向右查找相邻的相同值列
      for (let i = currentColIndex + 1; i < allColumns.length; i++) {
        const nextColumn = allColumns[i]

        // 只检查在合并列列表中的列
        if (!mergeColumns.includes(nextColumn)) break

        // 检查当前行的这一列是否也有相同值
        if (shouldMerge(row[nextColumn], currentValue)) {
          // 还需要检查涉及到的所有行的这一列是否都有相同值
          let canMergeColumn = true
          for (let r = rowIndex; r < rowIndex + rowspan; r++) {
            if (!shouldMerge(localTableData.value[r][nextColumn], currentValue)) {
              canMergeColumn = false
              break
            }
          }

          if (canMergeColumn) {
            colspan++
          } else {
            break
          }
        } else {
          break
        }
      }

      // 3. 检查是否是合并区域的左上角（避免重复渲染）
      // 检查行方向
      for (let i = rowIndex - 1; i >= 0; i--) {
        if (shouldMerge(localTableData.value[i][column.property], currentValue)) {
          return { rowspan: 0, colspan: 0 }
        } else {
          break
        }
      }

      // 检查列方向
      for (let i = currentColIndex - 1; i >= 0; i--) {
        const prevColumn = allColumns[i]

        if (!mergeColumns.includes(prevColumn)) break

        if (shouldMerge(row[prevColumn], currentValue)) {
          return { rowspan: 0, colspan: 0 }
        } else {
          break
        }
      }

      return { rowspan, colspan }
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

    // Ant Design Vue 列配置 - 按照官方文档实现
    const antdColumns = computed(() => {
      if (localTableData.value.length === 0) return []

      const fields = Object.keys(localTableData.value[0])
      const { mergeColumns = [], mergeType = 'row', mergeCondition = 'same', customRule, startRow = 0, endRow } = props.spanConfig || {}
      
      if (mergeType === 'column' || mergeType === 'mixed') {
        // 列合并或混合合并：创建多层表头结构
        const columns = []

        // 添加合并列组（带自定义表头）
        if (mergeColumns.length > 0) {
          columns.push({
            title: getMergedColumnGroupLabel(), // 使用普通 title，Ant Design Vue 会自动响应式更新
            align: 'center',
            children: mergeColumns.map(field => ({
              title: field,
              dataIndex: field,
              key: field,
              width: getColumnMinWidth(field),
              ellipsis: true
            }))
          })
        }
        
        // 添加非合并列
        const nonMergedFields = fields.filter(field => !mergeColumns.includes(field))
        nonMergedFields.forEach(field => {
          const column = {
            title: field,
            dataIndex: field,
            key: field,
            width: getColumnMinWidth(field),
            ellipsis: true,
            showSorterTooltip: false
          }
          
          // 混合合并：对非合并列组的第一列进行行合并
          if (mergeType === 'mixed' && field === nonMergedFields[0]) {
            column.customCell = (record, index) => {
              return calculateAntdMixedRowSpan(props.tableData, index, field, props.spanConfig)
            }
          }
          
          columns.push(column)
        })
        
        return columns
      } else {
        // 行合并：原有逻辑
        return fields.map(field => ({
          title: field,
          dataIndex: field,
          key: field,
          width: getColumnMinWidth(field),
          // 按照官方文档，使用customCell函数
          customCell: (record, index) => {
            // 只对需要合并的列进行处理
            if (!mergeColumns.includes(field)) {
              return { rowSpan: 1, colSpan: 1 }
            }
            
            // 检查是否在合并范围内
            if (index < startRow || (endRow !== undefined && index > endRow)) {
              return { rowSpan: 1, colSpan: 1 }
            }
            
            return calculateAntdCellSpan(props.tableData, index, field, props.spanConfig)
          },
          ellipsis: true,
          showSorterTooltip: false
        }))
      }
    })

    // Ant Design Vue 混合合并的行合并计算
    const calculateAntdMixedRowSpan = (tableData, rowIndex, field, spanConfig) => {
      // 基于department字段进行行合并
      const departmentValue = tableData[rowIndex]['department']
      if (!departmentValue) return { rowSpan: 1, colSpan: 1 }
      
      let rowSpan = 1
      
      // 向下查找相同部门的行
      for (let i = rowIndex + 1; i < tableData.length; i++) {
        if (shouldMergeAntdValues(tableData[i]['department'], departmentValue, 'same', '')) {
          rowSpan++
        } else {
          break
        }
      }
      
      // 检查是否为合并区域的第一行
      for (let i = rowIndex - 1; i >= 0; i--) {
        if (shouldMergeAntdValues(tableData[i]['department'], departmentValue, 'same', '')) {
          return { rowSpan: 0, colSpan: 0 }
        } else {
          break
        }
      }
      
      return { rowSpan, colSpan: 1 }
    }

    // Naive UI 列配置 - 使用官方 rowSpan 和 colSpan 函数
    const naiveColumns = computed(() => {
      if (localTableData.value.length === 0) return []

      const fields = Object.keys(localTableData.value[0])
      const { mergeColumns = [], mergeType = 'row', mergeCondition = 'same', customRule, startRow = 0, endRow } = props.spanConfig || {}

      if (mergeType === 'column' || mergeType === 'mixed') {
        // 列合并或混合合并：创建多层表头结构
        const columns = []

        // 添加合并列组（使用 title 渲染函数）
        if (mergeColumns.length > 0) {
          columns.push({
            key: 'mergedGroup',
            align: 'center',
            // 使用 title 渲染函数自定义表头
            title: () => {
              return h('div', {
                class: 'editable-header-wrapper',
                style: { minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
              }, [
                // 编辑模式
                isEditingHeader.value
                  ? h('input', {
                      ref: (el) => { if (el) headerInputRef.value = el },
                      value: customHeaderLabel.value,
                      onInput: (e) => { customHeaderLabel.value = e.target.value },
                      onBlur: finishEditHeader,
                      onKeydown: handleHeaderKeydown,
                      class: 'naive-header-input',
                      placeholder: '请输入表头名称',
                      style: {
                        width: '100%',
                        maxWidth: '200px',
                        padding: '6px 12px',
                        border: '2px solid #3b82f6',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: '600',
                        outline: 'none',
                        background: 'white'
                      }
                    })
                  : h('div', {
                      class: 'editable-header-label',
                      onClick: startEditHeader,
                      title: '点击编辑表头名称',
                      style: {
                        cursor: 'pointer',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                      }
                    }, [
                      getMergedColumnGroupLabel(),
                      h('span', {
                        class: 'edit-icon-naive',
                        style: { opacity: '0.5', fontSize: '14px' }
                      }, ' ✏️')
                    ])
              ])
            },
            children: mergeColumns.map(field => ({
              title: field,
              key: field
            }))
          })
        }

        // 添加非合并列
        const nonMergedFields = fields.filter(field => !mergeColumns.includes(field))
        nonMergedFields.forEach(field => {
          const column = {
            title: field,
            key: field
          }

          // 混合合并：对非合并列组的第一列进行行合并
          if (mergeType === 'mixed' && field === nonMergedFields[0]) {
            column.rowSpan = (rowData, rowIndex) => {
              const spanInfo = calculateNaiveUIMixedRowSpan(props.tableData, rowIndex, field, props.spanConfig)
              return spanInfo.rowSpan
            }
            column.colSpan = (rowData, rowIndex) => {
              const spanInfo = calculateNaiveUIMixedRowSpan(props.tableData, rowIndex, field, props.spanConfig)
              return spanInfo.colSpan
            }
          }

          columns.push(column)
        })

        return columns
      } else {
        // 行合并：原有逻辑
        return fields.map(field => ({
          title: field,
          key: field,
          // 使用 Naive UI 官方的 rowSpan 和 colSpan 函数
          rowSpan: mergeColumns.includes(field) ? (rowData, rowIndex) => {
            const spanInfo = calculateNaiveUISpan(props.tableData, rowIndex, field, props.spanConfig)
            return spanInfo.rowSpan
          } : undefined,
          colSpan: mergeColumns.includes(field) ? (rowData, rowIndex) => {
            const spanInfo = calculateNaiveUISpan(props.tableData, rowIndex, field, props.spanConfig)
            return spanInfo.colSpan
          } : undefined
        }))
      }
    })

    // Naive UI 带插槽的列配置（用于模板渲染）
    const naiveColumnsWithSlots = computed(() => {
      return naiveColumns.value
    })

    // Naive UI 混合合并的行合并计算
    const calculateNaiveUIMixedRowSpan = (tableData, rowIndex, field, spanConfig) => {
      // 基于department字段进行行合并
      const departmentValue = tableData[rowIndex]['department']
      if (!departmentValue) return { rowSpan: 1, colSpan: 1 }
      
      let rowSpan = 1
      
      // 向下查找相同部门的行
      for (let i = rowIndex + 1; i < tableData.length; i++) {
        if (shouldMergeNaiveUIValues(tableData[i]['department'], departmentValue, 'same', '')) {
          rowSpan++
        } else {
          break
        }
      }
      
      // 检查是否为合并区域的第一行
      for (let i = rowIndex - 1; i >= 0; i--) {
        if (shouldMergeNaiveUIValues(tableData[i]['department'], departmentValue, 'same', '')) {
          return { rowSpan: 0, colSpan: 0 }
        } else {
          break
        }
      }
      
      return { rowSpan, colSpan: 1 }
    }
    
    // Naive UI 合并计算函数 - 按照官方文档实现
    const calculateNaiveUISpan = (tableData, rowIndex, field, spanConfig) => {
      const { mergeType = 'row', mergeColumns = [], mergeCondition = 'same', customRule, startRow = 0, endRow } = spanConfig || {}
      const currentValue = tableData[rowIndex][field]
      
      // 检查是否在合并范围内
      const actualEndRow = endRow !== undefined ? endRow : tableData.length - 1
      if (rowIndex < startRow || rowIndex > actualEndRow) {
        return { rowSpan: 1, colSpan: 1 }
      }
      
      if (mergeType === 'row') {
        return calculateNaiveUIRowSpan(tableData, rowIndex, field, spanConfig)
      } else if (mergeType === 'column') {
        return calculateNaiveUIColumnSpan(tableData, rowIndex, field, spanConfig)
      } else if (mergeType === 'mixed') {
        return calculateNaiveUIMixedSpan(tableData, rowIndex, field, spanConfig)
      }
      
      return { rowSpan: 1, colSpan: 1 }
    }
    
    const calculateNaiveUIRowSpan = (tableData, rowIndex, field, spanConfig) => {
      const { mergeCondition = 'same', customRule, startRow = 0, endRow } = spanConfig
      const currentValue = tableData[rowIndex][field]
      let rowSpan = 1
      
      // 向下计算行合并 - 只在合并范围内
      const actualEndRow = endRow !== undefined ? endRow : tableData.length - 1
      const maxIndex = Math.min(actualEndRow, tableData.length - 1)
      for (let i = rowIndex + 1; i <= maxIndex; i++) {
        if (shouldMergeNaiveUIValues(tableData[i][field], currentValue, mergeCondition, customRule)) {
          rowSpan++
        } else {
          break
        }
      }

      // 检查是否为合并区域的第一行 - 只在合并范围内检查
      for (let i = rowIndex - 1; i >= startRow; i--) {
        if (shouldMergeNaiveUIValues(tableData[i][field], currentValue, mergeCondition, customRule)) {
          // 不是第一行，隐藏这个单元格
          return { rowSpan: 0, colSpan: 0 }
        } else {
          break
        }
      }

      return { rowSpan, colSpan: 1 }
    }
    
    const calculateNaiveUIColumnSpan = (tableData, rowIndex, field, spanConfig) => {
      const { mergeColumns = [], mergeCondition = 'same', customRule } = spanConfig
      const currentValue = tableData[rowIndex][field]
      const allFields = Object.keys(tableData[0])
      const currentFieldIndex = allFields.indexOf(field)
      let colSpan = 1
      
      // 向右查找相邻的相同值列
      for (let i = currentFieldIndex + 1; i < allFields.length; i++) {
        const nextField = allFields[i]
        if (!mergeColumns.includes(nextField)) break
        
        if (shouldMergeNaiveUIValues(tableData[rowIndex][nextField], currentValue, mergeCondition, customRule)) {
          colSpan++
        } else {
          break
        }
      }
      
      // 检查是否是合并区域的第一列
      for (let i = currentFieldIndex - 1; i >= 0; i--) {
        const prevField = allFields[i]
        if (!mergeColumns.includes(prevField)) break
        
        if (shouldMergeNaiveUIValues(tableData[rowIndex][prevField], currentValue, mergeCondition, customRule)) {
          return { rowSpan: 0, colSpan: 0 }
        } else {
          break
        }
      }
      
      return { rowSpan: 1, colSpan }
    }
    
    const calculateNaiveUIMixedSpan = (tableData, rowIndex, field, spanConfig) => {
      const { mergeColumns = [], mergeCondition = 'same', customRule, startRow = 0, endRow } = spanConfig
      const currentValue = tableData[rowIndex][field]
      const allFields = Object.keys(tableData[0])
      const currentFieldIndex = allFields.indexOf(field)
      const actualEndRow = endRow !== undefined ? endRow : tableData.length - 1
      
      let rowSpan = 1
      let colSpan = 1
      
      // 1. 先计算行合并
      const maxRowIndex = Math.min(actualEndRow, tableData.length - 1)
      for (let i = rowIndex + 1; i <= maxRowIndex; i++) {
        if (shouldMergeNaiveUIValues(tableData[i][field], currentValue, mergeCondition, customRule)) {
          rowSpan++
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
        for (let row = rowIndex; row < rowIndex + rowSpan; row++) {
          if (!shouldMergeNaiveUIValues(tableData[row][nextField], currentValue, mergeCondition, customRule)) {
            canMergeColumn = false
            break
          }
        }
        
        if (canMergeColumn) {
          colSpan++
        } else {
          break
        }
      }
      
      // 3. 检查是否应该隐藏（不是合并区域的左上角）
      // 检查行方向
      for (let i = rowIndex - 1; i >= startRow; i--) {
        if (shouldMergeNaiveUIValues(tableData[i][field], currentValue, mergeCondition, customRule)) {
          return { rowSpan: 0, colSpan: 0 }
        } else {
          break
        }
      }
      
      // 检查列方向
      for (let i = currentFieldIndex - 1; i >= 0; i--) {
        const prevField = allFields[i]
        if (!mergeColumns.includes(prevField)) break
        
        if (shouldMergeNaiveUIValues(tableData[rowIndex][prevField], currentValue, mergeCondition, customRule)) {
          return { rowSpan: 0, colSpan: 0 }
        } else {
          break
        }
      }
      
      return { rowSpan, colSpan }
    }
    
    // Naive UI 合并条件判断
    const shouldMergeNaiveUIValues = (value1, value2, mergeCondition, customRule) => {
      try {
        if (mergeCondition === 'custom' && customRule) {
          const mergeFunction = new Function('value1', 'value2', `
            try {
              return ${customRule}
            } catch (e) {
              console.error('Custom rule execution error:', e)
              return value1 === value2
            }
          `)
          return mergeFunction(value1, value2)
        }
        return value1 === value2
      } catch (error) {
        console.error('Naive UI 合并条件判断出错:', error)
        return value1 === value2
      }
    }

    // Vuetify 表头配置
    const vuetifyHeaders = computed(() => {
      if (localTableData.value.length === 0) return []

      const fields = Object.keys(localTableData.value[0])
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
      let classes = []
      
      // 只有合并列才检查合并信息
      const mergeColumns = (props.spanConfig && props.spanConfig.mergeColumns) || []
      if (mergeColumns.includes(field)) {
        const mergeInfo = row._merge && row._merge[field]
        
        if (mergeInfo && mergeInfo.shouldShow) {
          if (mergeInfo.rowspan > 1 || mergeInfo.colspan > 1) {
            classes.push('merged-cell-custom')
            
            if (mergeInfo.rowspan > 1) {
              classes.push(`rowspan-${mergeInfo.rowspan}`)
            }
            
            if (mergeInfo.colspan > 1) {
              classes.push(`colspan-${mergeInfo.colspan}`)
            }
            
            // 添加合并类型类名
            const mergeType = props.spanConfig?.mergeType || 'row'
            classes.push(`merge-type-${mergeType}`)
          }
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
      
      if (mergeInfo && mergeInfo.shouldShow && (mergeInfo.rowspan > 1 || mergeInfo.colspan > 1)) {
        const style = {
          verticalAlign: 'middle',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10
        }
        
        // 如果有行合并，计算高度
        if (mergeInfo.rowspan > 1) {
          const rowHeight = 48 // Vuetify 默认行高
          const borderHeight = mergeInfo.rowspan - 1 // 内部边框高度
          const totalHeight = rowHeight * mergeInfo.rowspan + borderHeight
          style.height = `${totalHeight}px`
        }
        
        // 如果有列合并，可以添加特殊样式
        if (mergeInfo.colspan > 1) {
          style.fontWeight = '600'
          style.backgroundColor = '#f8f9fa'
        }
        
        return style
      }
      
      return {}
    }
    
    const getVuetifyCustomRowspan = (row, field) => {
      const mergeColumns = (props.spanConfig && props.spanConfig.mergeColumns) || []
      if (!mergeColumns.includes(field)) {
        return 1 // 非合并列，默认 rowspan 为 1
      }
      
      const mergeInfo = row._merge && row._merge[field]
      return mergeInfo && mergeInfo.shouldShow ? mergeInfo.rowspan : 1
    }
    
    const getVuetifyCustomColspan = (row, field) => {
      const mergeColumns = (props.spanConfig && props.spanConfig.mergeColumns) || []
      if (!mergeColumns.includes(field)) {
        return 1 // 非合并列，默认 colspan 为 1
      }
      
      const mergeInfo = row._merge && row._merge[field]
      return mergeInfo && mergeInfo.shouldShow ? mergeInfo.colspan : 1
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

    // Vuetify 混合合并相关函数
    const shouldShowVuetifyMixedCell = (row, field, rowIndex) => {
      // 对于混合合并，非合并列组中的第一列需要检查行合并
      const nonMergedFields = nonMergedColumns.value
      if (nonMergedFields.length > 0 && field === nonMergedFields[0]) {
        const departmentValue = row['department']
        if (!departmentValue) return true

        // 检查是否为合并区域的第一行
        for (let i = rowIndex - 1; i >= 0; i--) {
          if (localTableData.value[i]['department'] === departmentValue) {
            return false // 不是第一行，隐藏
          } else {
            break
          }
        }
      }
      return true
    }

    const getVuetifyMixedRowspan = (row, field, rowIndex) => {
      // 对于混合合并，非合并列组中的第一列进行行合并
      const nonMergedFields = nonMergedColumns.value
      if (nonMergedFields.length > 0 && field === nonMergedFields[0]) {
        const departmentValue = row['department']
        if (!departmentValue) return 1

        let rowspan = 1

        // 向下查找相同部门的行
        for (let i = rowIndex + 1; i < localTableData.value.length; i++) {
          if (localTableData.value[i]['department'] === departmentValue) {
            rowspan++
          } else {
            break
          }
        }

        return rowspan
      }
      return 1
    }
    
    const getVuetifyMixedCellClass = (row, field, rowIndex, colIndex) => {
      const classes = []
      
      // 对于混合合并，非合并列组中的第一列需要行合并样式
      const nonMergedFields = nonMergedColumns.value
      if (nonMergedFields.length > 0 && field === nonMergedFields[0]) {
        const rowspan = getVuetifyMixedRowspan(row, field, rowIndex)
        if (rowspan > 1) {
          classes.push('merged-cell-custom', 'merge-type-mixed', `rowspan-${rowspan}`)
        }
      }
      
      return classes.join(' ')
    }
    
    const getVuetifyMixedCellStyle = (row, field, rowIndex, colIndex) => {
      const style = {}
      
      // 对于混合合并，非合并列组中的第一列需要行合并样式
      const nonMergedFields = nonMergedColumns.value
      if (nonMergedFields.length > 0 && field === nonMergedFields[0]) {
        const rowspan = getVuetifyMixedRowspan(row, field, rowIndex)
        if (rowspan > 1) {
          style.verticalAlign = 'middle'
          style.textAlign = 'center'
          style.fontWeight = '500'
          
          // 计算合并单元格的高度
          const rowHeight = 48 // Vuetify 默认行高
          const borderHeight = rowspan - 1
          const totalHeight = rowHeight * rowspan + borderHeight
          style.height = `${totalHeight}px`
        }
      }
      
      return style
    }

    const getColumnMinWidth = (field) => {
      const columnCount = tableFields.value.length

      // 计算字段名和内容的最大长度
      const maxLength = Math.max(
        field.length,
        ...localTableData.value.map(row => String(row[field] || '').length)
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

    // 拖拽相关方法
    // 根据当前 UI 库获取表头选择器
    const getHeaderSelector = () => {
      const selectors = {
        'element-plus': '.el-table__header-wrapper tr',
        'ant-design-vue': '.ant-table-thead tr',
        'naive-ui': '.n-data-table-thead tr',
        'vuetify': '.vuetify-custom-table thead tr' // 使用自定义表格
      }
      return selectors[props.currentLibrary] || '.el-table__header-wrapper tr'
    }

    // 根据当前 UI 库获取表体选择器
    const getBodySelector = () => {
      const selectors = {
        'element-plus': '.el-table__body-wrapper tbody',
        'ant-design-vue': '.ant-table-tbody',
        'naive-ui': '.n-data-table-tbody',
        'vuetify': '.vuetify-custom-table tbody'
      }
      return selectors[props.currentLibrary] || '.el-table__body-wrapper tbody'
    }

    const initColumnDrag = () => {
      // 对于某些 UI 库，可能需要更多时间来渲染 DOM
      const attemptInit = (retryCount = 0) => {
        nextTick(() => {
          const selector = getHeaderSelector()
          const el = document.querySelector(selector)

          if (!el) {
            if (retryCount < 3) {
              // 重试最多3次，每次延迟增加
              console.log(`列拖拽初始化重试 ${retryCount + 1}/3，选择器: ${selector}`)
              setTimeout(() => attemptInit(retryCount + 1), 100 * (retryCount + 1))
            } else {
              console.warn(`拖拽初始化失败：未找到表头元素 (${selector})`)
              console.log('当前 UI 库:', props.currentLibrary)
              console.log('请在浏览器控制台检查表格的实际 DOM 结构')
            }
            return
          }

          console.log(`✓ 列拖拽已成功初始化 (${props.currentLibrary})`)

          if (columnSortable.value) {
            columnSortable.value.destroy()
          }

          columnSortable.value = Sortable.create(el, {
            animation: 150,
            onEnd: (evt) => {
              const { oldIndex, newIndex } = evt
              if (oldIndex === newIndex) return

              // 标记正在拖拽操作中
              isDragging.value = true

              // 更新字段顺序
              const fields = [...tableFields.value]
              const oldFieldName = fields[oldIndex]
              const newFieldName = fields[newIndex]
              const [movedField] = fields.splice(oldIndex, 1)
              fields.splice(newIndex, 0, movedField)

              // 更新本地字段列表
              localTableFields.value = fields

              // 重新排列数据列
              const newData = localTableData.value.map(row => {
                const newRow = {}
                fields.forEach(field => {
                  newRow[field] = row[field]
                })
                return newRow
              })

              localTableData.value = newData
              emit('data-change', newData)
            }
          })
        })
      }

      attemptInit()
    }

    const initRowDrag = () => {
      // 对于某些 UI 库，可能需要更多时间来渲染 DOM
      const attemptInit = (retryCount = 0) => {
        nextTick(() => {
          const selector = getBodySelector()
          const el = document.querySelector(selector)

          if (!el) {
            if (retryCount < 3) {
              // 重试最多3次，每次延迟增加
              console.log(`行拖拽初始化重试 ${retryCount + 1}/3，选择器: ${selector}`)
              setTimeout(() => attemptInit(retryCount + 1), 100 * (retryCount + 1))
            } else {
              console.warn(`拖拽初始化失败：未找到表体元素 (${selector})`)
              console.log('当前 UI 库:', props.currentLibrary)
              console.log('请在浏览器控制台检查表格的实际 DOM 结构')
            }
            return
          }

          if (rowSortable.value) {
            rowSortable.value.destroy()
          }

          rowSortable.value = Sortable.create(el, {
            animation: 150,
            onEnd: (evt) => {
              const { oldIndex, newIndex } = evt
              if (oldIndex === newIndex) return

              // 标记正在拖拽操作中
              isDragging.value = true

              const newData = [...localTableData.value]
              const [movedRow] = newData.splice(oldIndex, 1)
              newData.splice(newIndex, 0, movedRow)

              localTableData.value = newData
              emit('data-change', newData)
            }
          })
        })
      }

      attemptInit()
    }

    const destroyDrag = () => {
      if (columnSortable.value) {
        columnSortable.value.destroy()
        columnSortable.value = null
      }
      if (rowSortable.value) {
        rowSortable.value.destroy()
        rowSortable.value = null
      }
    }

    const handleDragModeChange = (mode) => {
      destroyDrag()

      if (mode === 'column') {
        initColumnDrag()
      } else if (mode === 'row') {
        initRowDrag()
      } else {
      }
    }

    // 监听拖拽模式变化
    watch(dragMode, (newMode) => {
      handleDragModeChange(newMode)
    })

    // 监听数据变化，重新初始化拖拽实例
    watch([localTableData, localTableFields], () => {
      // 只有在拖拽操作导致的数据变化时才重新初始化
      if (isDragging.value && dragMode.value !== 'none') {
        // 等待 DOM 更新完成后重新初始化拖拽
        nextTick(() => {
          setTimeout(() => {
            console.log('数据更新后重新初始化拖拽实例')
            if (dragMode.value === 'column') {
              if (columnSortable.value) {
                columnSortable.value.destroy()
                columnSortable.value = null
              }
              initColumnDrag()
            } else if (dragMode.value === 'row') {
              if (rowSortable.value) {
                rowSortable.value.destroy()
                rowSortable.value = null
              }
              initRowDrag()
            }
            // 重置拖拽标记
            isDragging.value = false
          }, 100) // 延迟100ms确保DOM完全更新
        })
      }
    }, { deep: true })

    // 监听 UI 库切换，重新初始化拖拽
    watch(() => props.currentLibrary, (newLibrary, oldLibrary) => {
      if (newLibrary !== oldLibrary && dragMode.value !== 'none') {
        // 销毁旧的拖拽实例
        destroyDrag()
        // 等待 DOM 更新后重新初始化
        nextTick(() => {
          handleDragModeChange(dragMode.value)
        })
      }
    })

    // 组件挂载时初始化
    onMounted(() => {
      if (dragMode.value !== 'none') {
        handleDragModeChange(dragMode.value)
      }
    })

    // 组件卸载时销毁拖拽实例
    onBeforeUnmount(() => {
      destroyDrag()
    })

    const refreshPreview = () => {
      message.success('这是一个 Demo!')
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
      mergedColumnGroup,
      nonMergedColumns,
      getMergedColumnGroupLabel,
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
      calculateMixedRowSpan,
      antdColumns,
      calculateAntdMixedRowSpan,
      naiveColumns,
      naiveColumnsWithSlots,
      calculateNaiveUIMixedRowSpan,
      calculateNaiveUISpan,
      calculateNaiveUIRowSpan,
      calculateNaiveUIColumnSpan,
      calculateNaiveUIMixedSpan,
      shouldMergeNaiveUIValues,
      calculateAntdCellSpan,
      calculateAntdRowSpan,
      calculateAntdColumnSpan,
      calculateAntdMixedSpan,
      shouldMergeAntdValues,
      vuetifyHeaders,
      shouldShowVuetifyCell,
      getVuetifyCellClass,
      shouldShowVuetifyCustomCell,
      getVuetifyCustomCellClass,
      getVuetifyCustomCellStyle,
      getVuetifyCustomRowspan,
      getVuetifyCustomColspan,
      shouldShowVuetifyMixedCell,
      getVuetifyMixedRowspan,
      getVuetifyMixedCellClass,
      getVuetifyMixedCellStyle,
      calculateVuetifySpan,
      calculateVuetifyRowSpan,
      calculateVuetifyColSpan,
      calculateVuetifyMixedSpan,
      getColumnMinWidth,
      refreshPreview,
      getMergeTypeText,
      tableScrollWidth,
      Refresh,
      // 拖拽相关
      dragMode,
      handleDragModeChange,
      tableKey, // 用于强制表格重新渲染
      // 可编辑表头相关
      customHeaderLabel,
      isEditingHeader,
      headerInputRef,
      startEditHeader,
      finishEditHeader,
      cancelEditHeader,
      handleHeaderKeydown,
      Edit, // 编辑图标
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

/* Vuetify表格边框控制 */
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

.vuetify-custom-table:not(.bordered) {
  border: none;
}

/* 多层表头样式 */
.vuetify-header-row {
  background: #f5f5f5;
}

.vuetify-header {
  background: #f5f5f5;
  color: #333;
  font-weight: 600;
  padding: 12px 16px;
  text-align: center;
  position: relative;
}

/* 边框模式下的表头边框 */
.vuetify-custom-table.bordered .vuetify-header {
  border-bottom: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
}

/* 非边框模式下的表头边框 */
.vuetify-custom-table:not(.bordered) .vuetify-header {
  border-bottom: 1px solid #e0e0e0;
  border-right: none;
}

.vuetify-header.merged-header {
  background: #f5f5f5;
  color: #444;
  font-weight: 700;
  font-size: 15px;
}

.vuetify-header.normal-header {
  background: #f5f5f5;
  vertical-align: middle;
}

.vuetify-header.sub-header {
  background: #f0f0f0;
  color: #555;
  font-size: 13px;
  border-top: none;
}

/* 最后一列不显示右边框 */
.vuetify-header:last-child,
.vuetify-cell:last-child {
  border-right: none !important;
}

.vuetify-cell {
  padding: 12px 16px;
  transition: background-color 0.2s;
  position: relative;
  vertical-align: top;
}

/* 边框模式下的单元格边框 */
.vuetify-custom-table.bordered .vuetify-cell {
  border-bottom: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
}

/* 非边框模式下的单元格边框 */
.vuetify-custom-table:not(.bordered) .vuetify-cell {
  border-bottom: 1px solid #e0e0e0;
  border-right: none;
}

.vuetify-cell.merged-group-cell {
  background: #f8f8f8;
}


/* 合并单元格特殊样式 - 支持行、列、混合合并 */
.merged-cell-custom {
  background: #fafafa !important;
  font-weight: 500;
  border-bottom: 1px solid #e0e0e0 !important;
  vertical-align: middle !important;
  text-align: center !important;
  position: relative;
}

/* 行合并样式 */
.merge-type-row .merged-cell-custom {
  background: #f5f5f5 !important;
  border-left: 2px solid #888;
}

/* 列合并样式 */
.merge-type-column .merged-cell-custom {
  background: #f5f5f5 !important;
  border-top: 2px solid #888;
}

/* 混合合并样式 */
.merge-type-mixed .merged-cell-custom {
  background: #f5f5f5 !important;
  border: 1px solid #999;
}

/* 列合并特定样式 */
.colspan-2 { min-width: 200px; }
.colspan-3 { min-width: 300px; }
.colspan-4 { min-width: 400px; }
.colspan-5 { min-width: 500px; }

/* 行合并特定样式 */
.rowspan-2 { min-height: 96px; }
.rowspan-3 { min-height: 144px; }
.rowspan-4 { min-height: 192px; }
.rowspan-5 { min-height: 240px; }

/* 隐藏被合并的单元格的边框 */
.vuetify-custom-table tbody tr:has(.merged-cell-custom) + tr .vuetify-cell,
.vuetify-custom-table tbody tr:has(.merged-cell-custom) + tr + tr .vuetify-cell {
  border-top: none !important;
}

/* Vuetify斑马纹控制 */
.vuetify-custom-table.striped tbody tr:nth-child(odd) .vuetify-cell {
  background-color: #f9f9f9;
}

.vuetify-custom-table.striped tbody tr:nth-child(odd) .merged-cell-custom {
  background-color: #f0f0f0 !important;
}

/* 手动斑马纹控制（通过striped-row类） */
.vuetify-custom-table.striped .striped-row .vuetify-cell {
  background-color: #f9f9f9;
}

.vuetify-custom-table.striped .striped-row .merged-cell-custom {
  background-color: #f0f0f0 !important;
}

/* 悬停效果 */
.vuetify-custom-table tbody tr:hover .vuetify-cell {
  background-color: #f5f5f5;
}

.vuetify-custom-table tbody tr:hover .merged-cell-custom {
  background-color: #eeeeee !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .vuetify-header,
  .vuetify-cell {
    padding: 8px 12px;
    font-size: 13px;
  }
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

/* 可编辑表头样式 */
.editable-header-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  width: 100%;
}

.editable-header-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  user-select: none;
  font-weight: 600;
}

.editable-header-label:hover {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.editable-header-label:hover .edit-icon {
  opacity: 1;
  transform: scale(1.1);
}

.edit-icon {
  opacity: 0.5;
  font-size: 14px;
  transition: all 0.2s ease;
  color: #6b7280;
}

/* Element Plus 表头输入框 */
.header-input {
  max-width: 200px;
}

.header-input :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 2px #3b82f6 !important;
}

/* Vuetify 表头输入框 */
.vuetify-header-input {
  width: 100%;
  max-width: 200px;
  padding: 6px 12px;
  border: 2px solid #3b82f6;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  outline: none;
  background: white;
  transition: all 0.2s ease;
}

.vuetify-header-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Ant Design Vue 表头样式 */
.antd-custom-header-cell {
  padding: 0 !important;
}

.antd-header-input {
  width: 100%;
  max-width: 200px;
  padding: 6px 12px;
  border: 2px solid #3b82f6;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  outline: none;
  background: white;
  transition: all 0.2s ease;
}

.antd-header-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.edit-icon-antd,
.edit-icon-naive {
  opacity: 0.5;
  font-size: 14px;
  transition: all 0.2s ease;
  margin-left: 4px;
}

.editable-header-label:hover .edit-icon-antd,
.editable-header-label:hover .edit-icon-naive {
  opacity: 1;
  transform: scale(1.1);
}

/* Naive UI 表头输入框 */
.naive-header-input {
  width: 100%;
  max-width: 200px;
  padding: 6px 12px;
  border: 2px solid #3b82f6;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  outline: none;
  background: white;
  transition: all 0.2s ease;
}

.naive-header-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 表头编辑提示动画 */
@keyframes pulse-edit {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

.editable-header-label .edit-icon {
  animation: pulse-edit 2s ease-in-out infinite;
}

.editable-header-label:hover .edit-icon {
  animation: none;
}
</style>