<template>
  <div class="table-preview">
    <div class="preview-header">
      <div class="header-info">
        <div class="title-section">
          <h3 class="preview-title">表格预览</h3>
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
      <div class="table-container" v-if="tableData.length > 0" :data-columns="tableFields.length">
        <el-table
          :data="tableData"
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
            :class-name="''"
          >
            <template #default="scope">
              <div class="cell-content">
                {{ scope.row[field] }}
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

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
    <div class="merge-info" v-if="tableData.length > 0 && spanConfig.mergeColumns.length > 0">
      <div class="info-item">
        <el-tag size="small" type="success">
          {{ spanConfig.mergeType === 'row' ? '行合并' : spanConfig.mergeType === 'column' ? '列合并' : '混合合并' }}
        </el-tag>
        <span class="info-text">
          合并列: {{ spanConfig.mergeColumns.join(', ') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { Grid, Refresh } from '@element-plus/icons-vue'

export default {
  name: 'TablePreview',
  components: {
    Grid,
    Refresh
  },
  props: {
    tableData: {
      type: Array,
      default: () => []
    },
    spanConfig: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['span-method'],
  setup(props, { emit }) {
    const tableFields = computed(() => {
      if (props.tableData.length === 0) return []
      return Object.keys(props.tableData[0])
    })

    const spanMethod = ({ row, column, rowIndex, columnIndex }) => {
      const result = calculateSpan({ row, column, rowIndex, columnIndex })
      emit('span-method', { row, column, rowIndex, columnIndex })
      return result
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

    const getMergedColumnClass = (field) => {
      return ''
    }

    const getCellClass = (row, field) => {
      return ''
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

    return {
      tableFields,
      spanMethod,
      getColumnMinWidth,
      refreshPreview,
      getMergedColumnClass,
      getCellClass,
      tableScrollWidth
    }
  }
}
</script>

<style scoped>
.table-preview {
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

/* 表格样式 */
.preview-table {
  border-radius: 8px;
  min-width: fit-content;
}

:deep(.el-table) {
  background: transparent;
  border-radius: 8px;
  min-width: fit-content;
}

:deep(.el-table .el-table__cell) {
  padding: 12px 8px;
  border-color: #f0f0f0;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.el-table th.el-table__cell) {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
  border-color: #e5e7eb;
  font-size: 13px;
}

:deep(.el-table--border .el-table__cell) {
  border-right: 1px solid #f0f0f0;
}

:deep(.el-table .el-table__body tr:hover > td) {
  background-color: #f8fafc;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: #fafafa;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped:hover td) {
  background-color: #f5f5f5;
}

/* 单元格内容 */
.cell-content {
  line-height: 1.5;
  word-break: break-word;
  position: relative;
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

:deep(.el-empty) {
  padding: 20px;
}

:deep(.el-empty__image) {
  width: 80px;
  height: 80px;
}

:deep(.el-empty__description) {
  color: #6b7280;
  font-size: 14px;
  margin-top: 16px;
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

/* 按钮样式 */
:deep(.el-button) {
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
}

:deep(.el-button--default) {
  background-color: #ffffff;
  border-color: #d1d5db;
  color: #374151;
}

:deep(.el-button--default:hover) {
  background-color: #f9fafb;
  border-color: #9ca3af;
  color: #111827;
}

:deep(.el-button--primary) {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

:deep(.el-button--primary:hover) {
  background-color: #2563eb;
  border-color: #2563eb;
}

/* 标签样式 */
:deep(.el-tag) {
  border-radius: 6px;
  border: none;
  font-weight: 500;
}

:deep(.el-tag--success) {
  background-color: #dcfce7;
  color: #166534;
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
  }

  .preview-title {
    font-size: 15px;
  }

  .table-container {
    height: 100%;
  }

  :deep(.el-table .el-table__cell) {
    padding: 8px 6px;
    font-size: 13px;
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
}

@media (max-width: 480px) {
  .data-count {
    font-size: 12px;
    padding: 2px 6px;
  }

  .table-container {
    height: 100%;
  }

  :deep(.el-table .el-table__cell) {
    padding: 6px 4px;
    font-size: 12px;
  }

  :deep(.el-table th.el-table__cell) {
    font-size: 12px;
  }
}

/* 滚动条优化 */
.table-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
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

/* 表格列数提示 */
.table-container::before {
  content: attr(data-columns) " 列数据";
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 10;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.table-container:hover::before {
  opacity: 1;
}
</style>