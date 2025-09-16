<template>
  <el-dialog
    v-model="visible"
    title="选择 Excel 表头"
    width="80%"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div class="excel-header-selector">
      <div class="info-section">
        <el-alert
          title="Excel 文件解析成功"
          :description="`工作表: ${(excelData && excelData.sheetName) || ''} | 共 ${(excelData && excelData.rawData && excelData.rawData.length) || 0} 行数据`"
          type="success"
          :closable="false"
        />
      </div>

      <div class="content-section">
        <div class="left-panel">
          <h3>原始 Excel 预览</h3>
          <div class="raw-preview">
            <el-table
              :data="rawPreviewData"
              border
              size="small"
              max-height="400"
            >
              <el-table-column
                v-for="(col, index) in maxColumns"
                :key="index"
                :label="`${String.fromCharCode(65 + index)}列`"
                :prop="`col${index}`"
                min-width="100"
              >
                <template #default="scope">
                  <div 
                    :class="getCellClass(scope.$index, index)"
                    class="excel-cell"
                  >
                    {{ scope.row[`col${index}`] || '' }}
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <div class="right-panel">
          <h3>表头选择方案</h3>
          <div class="options-section">
            <el-radio-group v-model="selectedOptionIndex" @change="handleOptionChange">
              <div 
                v-for="(option, index) in ((excelData && excelData.parseOptions) || [])" 
                :key="index"
                class="option-item"
              >
                <el-radio :value="index" class="option-radio">
                  <div class="option-content">
                    <div class="option-header">
                      <span class="option-label">{{ option && option.label || '' }}</span>
                      <el-tag v-if="option && option.type === 'suggested'" type="success" size="small">
                        推荐
                      </el-tag>
                    </div>
                    <div v-if="option && option.reason" class="option-reason">
                      {{ option.reason }}
                    </div>
                  </div>
                </el-radio>
              </div>
            </el-radio-group>
          </div>

          <div v-if="selectedOption && selectedOption.preview" class="preview-section">
            <h4>预览效果</h4>
            <div class="table-preview">
              <el-table
                :data="selectedOption.preview.dataRows || []"
                border
                size="small"
                max-height="200"
              >
                <el-table-column
                  v-for="header in (selectedOption.preview.headers || [])"
                  :key="header.index"
                  :label="header.value"
                  :prop="header.value"
                  min-width="100"
                  show-overflow-tooltip
                />
              </el-table>
              <p class="preview-info">
                表头: {{ (selectedOption.preview.headers || []).length }} 列 | 
                数据: {{ selectedOption.preview.totalRows || 0 }} 行
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="selectedOptionIndex === null">
          确认使用此方案
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'ExcelHeaderSelector',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    excelData: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue', 'confirm', 'cancel'],
  setup(props, { emit }) {
    const visible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    const selectedOptionIndex = ref(0)

    const selectedOption = computed(() => {
      if (selectedOptionIndex.value !== null && 
          props.excelData && 
          props.excelData.parseOptions && 
          Array.isArray(props.excelData.parseOptions) &&
          props.excelData.parseOptions[selectedOptionIndex.value]) {
        return props.excelData.parseOptions[selectedOptionIndex.value]
      }
      return null
    })

    // 计算最大列数
    const maxColumns = computed(() => {
      if (!props.excelData || 
          !props.excelData.rawData || 
          !Array.isArray(props.excelData.rawData) || 
          props.excelData.rawData.length === 0) {
        return 0
      }
      return Math.max(...props.excelData.rawData.map(row => (row && Array.isArray(row)) ? row.length : 0))
    })

    // 转换原始数据为表格显示格式
    const rawPreviewData = computed(() => {
      if (!props.excelData || 
          !props.excelData.rawData || 
          !Array.isArray(props.excelData.rawData) || 
          props.excelData.rawData.length === 0) {
        return []
      }
      
      return props.excelData.rawData.slice(0, 15).map((row, rowIndex) => {
        const rowData = { _rowIndex: rowIndex }
        for (let i = 0; i < maxColumns.value; i++) {
          rowData[`col${i}`] = (row && row[i] && row[i].value) ? row[i].value : ''
        }
        return rowData
      })
    })

    const getCellClass = (rowIndex, colIndex) => {
      const classes = ['excel-cell']
      
      // 高亮选中的表头行
      if (selectedOption.value && selectedOption.value.headerRowIndex === rowIndex) {
        classes.push('header-row')
      }
      
      // 高亮合并单元格
      if (props.excelData && 
          props.excelData.rawData && 
          props.excelData.rawData[rowIndex] && 
          props.excelData.rawData[rowIndex][colIndex]) {
        const cell = props.excelData.rawData[rowIndex][colIndex]
        if (cell && cell.merged) {
          classes.push('merged-cell')
        }
      }
      
      return classes.join(' ')
    }

    const handleOptionChange = () => {
      // 选项改变时的处理
    }

    const handleConfirm = () => {
      if (selectedOption.value) {
        emit('confirm', {
          option: selectedOption.value,
          optionIndex: selectedOptionIndex.value
        })
      }
    }

    const handleCancel = () => {
      emit('cancel')
    }

    // 监听 excelData 变化，自动选择推荐选项
    watch(() => props.excelData, (newData) => {
      if (newData && 
          newData.parseOptions && 
          Array.isArray(newData.parseOptions) && 
          newData.parseOptions.length > 0) {
        // 优先选择推荐选项
        const suggestedIndex = newData.parseOptions.findIndex(option => option && option.type === 'suggested')
        selectedOptionIndex.value = suggestedIndex >= 0 ? suggestedIndex : 0
      }
    }, { immediate: true })

    return {
      visible,
      selectedOptionIndex,
      selectedOption,
      maxColumns,
      rawPreviewData,
      getCellClass,
      handleOptionChange,
      handleConfirm,
      handleCancel
    }
  }
}
</script>

<style scoped>
.excel-header-selector {
  min-height: 600px;
}

.info-section {
  margin-bottom: 20px;
}

.content-section {
  display: flex;
  gap: 16px;
  height: 500px;
}

.left-panel,
.right-panel {
  flex: 1;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 12px;
  overflow: hidden;
}

.left-panel h3,
.right-panel h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: #495057;
}

.raw-preview {
  height: calc(100% - 32px);
  overflow: auto;
}

.excel-cell {
  padding: 2px 4px;
  min-height: 20px;
}

.excel-cell.header-row {
  background-color: #e7f1ff;
  border: 1px solid #007bff;
  font-weight: 500;
}

.excel-cell.merged-cell {
  background-color: #fff3cd;
  border: 1px solid #ffc107;
}

.options-section {
  max-height: 280px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.option-item {
  margin-bottom: 8px;
  padding: 8px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.option-item:hover {
  border-color: #007bff;
  background-color: #f8f9fa;
}

.option-radio {
  width: 100%;
}

:deep(.el-radio__label) {
  width: 100%;
}

.option-content {
  width: 100%;
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.option-label {
  font-weight: 400;
  color: #495057;
}

.option-reason {
  font-size: 11px;
  color: #6c757d;
}

.preview-section {
  border-top: 1px solid #dee2e6;
  padding-top: 12px;
}

.preview-section h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 500;
  color: #495057;
}

.table-preview {
  max-height: 180px;
  overflow: auto;
}

.preview-info {
  margin: 6px 0 0 0;
  font-size: 11px;
  color: #6c757d;
  text-align: center;
}

.dialog-footer {
  text-align: right;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .content-section {
    flex-direction: column;
    height: auto;
  }
  
  .left-panel,
  .right-panel {
    height: 300px;
  }
}

/* 滚动条样式 */
:deep(.el-scrollbar__bar) {
  opacity: 0.3;
}

:deep(.el-scrollbar:hover .el-scrollbar__bar) {
  opacity: 0.8;
}
</style>