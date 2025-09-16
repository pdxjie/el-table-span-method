<template>
  <div class="code-generator">
    <div class="card-header">
      <span>
        <el-icon><Document /></el-icon>
        生成代码
      </span>
      <div class="header-actions">
        <el-button-group size="small">
          <el-button 
            :type="codeType === 'vue3' ? 'primary' : ''"
            @click="codeType = 'vue3'"
          >
            Vue3
          </el-button>
          <el-button 
            :type="codeType === 'vue2' ? 'primary' : ''"
            @click="codeType = 'vue2'"
          >
            Vue2
          </el-button>
        </el-button-group>
        <el-button size="small" @click="copyCode">
          <el-icon><CopyDocument /></el-icon>
          复制代码
        </el-button>
        <el-button size="small" @click="downloadCode">
          <el-icon><Download /></el-icon>
          下载
        </el-button>
      </div>
    </div>
    
    <div class="code-content">
      <el-input
        v-model="displayCode"
        type="textarea"
        :rows="20"
        readonly
        placeholder="配置完成后，这里将显示生成的代码..."
      />
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { Document, CopyDocument, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'CodeGenerator',
  components: {
    Document,
    CopyDocument,
    Download
  },
  props: {
    spanConfig: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const codeType = ref('vue3')

    const displayCode = computed(() => {
      return generateFullCode(props.spanConfig, codeType.value)
    })

    const generateFullCode = (config, type) => {
      if (type === 'vue3') {
        return generateVue3Code(config)
      } else {
        return generateVue2Code(config)
      }
    }

    const generateVue3Code = (config) => {
      const { mergeType = 'row', mergeColumns = [], mergeCondition = 'same', customRule = '' } = config
      
      return `<template>
  <div class="table-container">
    <el-table
      :data="tableData"
      :span-method="spanMethod"
      border
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

const spanMethod = ({ row, column, rowIndex, columnIndex }) => {
  const mergeColumns = ${JSON.stringify(mergeColumns)}
  const mergeType = '${mergeType}'
  
  if (!mergeColumns.includes(column.property)) {
    return { rowspan: 1, colspan: 1 }
  }

  if (mergeType === 'row') {
    return calculateRowSpan({ row, column, rowIndex, columnIndex })
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
}
<\/script>

<style scoped>
.table-container {
  padding: 20px;
}
</style>`
    }

    const generateVue2Code = (config) => {
      const { mergeType = 'row', mergeColumns = [], mergeCondition = 'same', customRule = '' } = config
      
      return `<template>
  <div class="table-container">
    <el-table
      :data="tableData"
      :span-method="spanMethod"
      border
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
      ]
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
      const mergeColumns = ${JSON.stringify(mergeColumns)}
      const mergeType = '${mergeType}'
      
      if (!mergeColumns.includes(column.property)) {
        return { rowspan: 1, colspan: 1 }
      }

      if (mergeType === 'row') {
        return this.calculateRowSpan({ row, column, rowIndex, columnIndex })
      }
      
      return { rowspan: 1, colspan: 1 }
    },
    
    calculateRowSpan({ row, column, rowIndex, columnIndex }) {
      const currentValue = row[column.property]
      let rowspan = 1
      let colspan = 1
      
      for (let i = rowIndex + 1; i < this.tableData.length; i++) {
        if (this.shouldMerge(this.tableData[i][column.property], currentValue)) {
          rowspan++
        } else {
          break
        }
      }
      
      for (let i = rowIndex - 1; i >= 0; i--) {
        if (this.shouldMerge(this.tableData[i][column.property], currentValue)) {
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
<\/script>

<style scoped>
.table-container {
  padding: 20px;
}
</style>`
    }

    const copyCode = async () => {
      try {
        await navigator.clipboard.writeText(displayCode.value)
        ElMessage.success('代码已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
        ElMessage.error('复制失败')
      }
    }

    const downloadCode = () => {
      const blob = new Blob([displayCode.value], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `table-span-${codeType.value}.vue`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      ElMessage.success('代码已下载')
    }

    return {
      codeType,
      displayCode,
      copyCode,
      downloadCode
    }
  }
}
</script>

<style scoped>
.code-generator {
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 500;
  color: #495057;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9ecef;
}

.card-header > span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.card-header .el-icon {
  color: #6c757d;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.code-content {
  height: 500px;
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(248, 250, 252, 0.9);
  backdrop-filter: blur(10px);
}

:deep(.el-textarea) {
  height: 100%;
}

:deep(.el-textarea__inner) {
  height: 100% !important;
  resize: none;
  background: rgba(248, 250, 252, 0.9);
  border: none;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #334155;
  padding: 20px;
  border-radius: 12px;
}

:deep(.el-textarea__inner:focus) {
  box-shadow: none;
  border-color: transparent;
}

:deep(.el-button-group) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-button) {
  font-weight: 500;
  border-radius: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-button:first-child) {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

:deep(.el-button:last-child) {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}


/* 响应式调整 */
@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }
  
  .header-actions > * {
    width: 100%;
  }
  
  .code-content {
    height: 400px;
  }
  
  :deep(.el-textarea__inner) {
    font-size: 12px;
    padding: 12px;
  }
  
  :deep(.el-button) {
    padding: 8px 12px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-actions {
    width: 100%;
  }
}

/* 滚动条优化 */
:deep(.el-textarea__inner)::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

:deep(.el-textarea__inner)::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

:deep(.el-textarea__inner)::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

:deep(.el-textarea__inner)::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>