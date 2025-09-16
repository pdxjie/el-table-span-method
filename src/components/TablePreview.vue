<template>
  <div class="table-preview">
    <div class="card-header">
      <span>
        <el-icon><Grid /></el-icon>
        表格预览
      </span>
      <div class="header-actions">
        <el-button size="small" @click="refreshPreview">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>
    
    <div class="preview-content">
      <el-table
        v-if="tableData.length > 0"
        :data="tableData"
        :span-method="spanMethod"
        :border="spanConfig.showBorder"
        :stripe="spanConfig.stripe"
        style="width: 100%"
      >
        <el-table-column
          v-for="(field, index) in tableFields"
          :key="field"
          :prop="field"
          :label="field"
          :width="getColumnWidth(field)"
          show-overflow-tooltip
        >
          <template #default="scope">
            <div class="cell-content">
              {{ scope.row[field] }}
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty 
        v-else 
        description="暂无数据，请先导入数据"
        :image-size="100"
      />
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
      // 刷新预览（如果需要的话）
    }

    return {
      tableFields,
      spanMethod,
      getColumnWidth,
      refreshPreview
    }
  }
}
</script>

<style scoped>
.table-preview {
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.1);
}

.card-header > span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
}

.card-header .el-icon {
  color: #667eea;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-content {
  max-height: 500px;
  overflow: auto;
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.cell-content {
  padding: 2px;
}

:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
  background: transparent;
}

:deep(.el-table .el-table__cell) {
  padding: 12px 10px;
  border-color: rgba(102, 126, 234, 0.1);
}

:deep(.el-table th.el-table__cell) {
  background: rgba(102, 126, 234, 0.08);
  color: #334155;
  font-weight: 600;
  border-color: rgba(102, 126, 234, 0.1);
}

:deep(.el-table--border .el-table__cell) {
  border-right: 1px solid #dee2e6;
}

:deep(.el-table--border .el-table__row:last-child .el-table__cell) {
  border-bottom: 1px solid #dee2e6;
}

:deep(.el-table .el-table__body tr:hover > td) {
  background-color: rgba(102, 126, 234, 0.05);
}

.el-empty {
  padding: 40px 20px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px dashed #ced4da;
}

:deep(.el-empty__image) {
  width: 60px;
  height: 60px;
}

:deep(.el-empty__description) {
  color: #6c757d;
  font-size: 13px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .preview-content {
    max-height: 400px;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 4px;
  }
  
  :deep(.el-table .el-table__cell) {
    padding: 8px 4px;
    font-size: 12px;
  }
}
</style>