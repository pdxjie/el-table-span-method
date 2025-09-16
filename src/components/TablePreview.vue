<template>
  <div class="table-preview">
    <div class="preview-header">
      <div class="header-info">
        <div class="title-section">
          <h3 class="preview-title">表格预览</h3>
          <span class="data-count" v-if="tableData.length > 0">
            {{ tableData.length }} 行数据
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
      <div class="table-container" v-if="tableData.length > 0">
        <el-table
          :data="tableData"
          :span-method="spanMethod"
          :border="spanConfig.showBorder"
          :stripe="spanConfig.stripe"
          style="width: 100%"
          class="preview-table"
        >
          <el-table-column
            v-for="(field, index) in tableFields"
            :key="field"
            :prop="field"
            :label="field"
            :width="getColumnWidth(field)"
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

    const getColumnWidth = (field) => {
      // 根据字段内容动态计算列宽
      const maxLength = Math.max(
        field.length,
        ...props.tableData.map(row => String(row[field] || '').length)
      )
      return Math.min(Math.max(maxLength * 12 + 40, 120), 200)
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

    return {
      tableFields,
      spanMethod,
      getColumnWidth,
      refreshPreview,
      getMergedColumnClass,
      getCellClass
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
}

/* 表格样式 */
.preview-table {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table) {
  background: transparent;
  border-radius: 8px;
}

:deep(.el-table .el-table__cell) {
  padding: 12px 8px;
  border-color: #f0f0f0;
  font-size: 14px;
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
  background: #f1f1f1;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>