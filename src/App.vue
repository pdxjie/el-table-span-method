<template>
  <div class="app">
    <div class="app-header">
      <div class="header-content">
        <div class="header-left">
          <h1>El-Table Span Method 配置工具</h1>
          <p>可视化配置表格合并，自动生成 span-method 代码</p>
        </div>
        <div class="header-right">
          <el-button size="small" @click="toggleLayout">
            <el-icon><Grid /></el-icon>
            {{ isVerticalLayout ? '水平布局' : '垂直布局' }}
          </el-button>
        </div>
      </div>
    </div>
    
    <div class="app-body" :class="{ 'vertical-layout': isVerticalLayout }">
      <div class="left-panel">
        <ConfigPanel 
          @data-change="handleDataChange"
          @config-change="handleConfigChange"
        />
      </div>
      
      <div class="right-panel">
        <div class="content-tabs">
          <el-tabs v-model="activeTab" type="border-card">
            <el-tab-pane label="表格预览" name="preview">
              <div class="tab-content">
                <TablePreview 
                  :table-data="tableData"
                  :span-config="spanConfig"
                  @span-method="handleSpanMethod"
                />
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="生成代码" name="code">
              <div class="tab-content">
                <CodeGenerator 
                  :span-config="spanConfig"
                  :generated-code="generatedCode"
                />
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { Grid } from '@element-plus/icons-vue'
import ConfigPanel from './components/ConfigPanel.vue'
import TablePreview from './components/TablePreview.vue'
import CodeGenerator from './components/CodeGenerator.vue'
import { generateSpanMethod } from './utils/spanMethod.js'

export default {
  name: 'App',
  components: {
    ConfigPanel,
    TablePreview,
    CodeGenerator,
    Grid
  },
  setup() {
    const tableData = ref([])
    const spanConfig = ref({
      mergeType: 'row',
      mergeColumns: [],
      mergeCondition: 'same',
      customRule: ''
    })
    const activeTab = ref('preview')
    const isVerticalLayout = ref(false)

    const handleDataChange = (data) => {
      tableData.value = data
      // 数据导入后自动切换到预览标签
      activeTab.value = 'preview'
    }

    const handleConfigChange = (config) => {
      spanConfig.value = { ...spanConfig.value, ...config }
    }

    const handleSpanMethod = ({ row, column, rowIndex, columnIndex }) => {
      return generateSpanMethod(tableData.value, spanConfig.value, { row, column, rowIndex, columnIndex })
    }

    const toggleLayout = () => {
      isVerticalLayout.value = !isVerticalLayout.value
    }

    const generatedCode = computed(() => {
      return generateCodeString(spanConfig.value)
    })

    const generateCodeString = (config) => {
      const spanMethodCode = `
const spanMethod = ({ row, column, rowIndex, columnIndex }) => {
  // 根据配置生成的 span-method 代码
  const mergeColumns = ${JSON.stringify(config.mergeColumns)}
  const mergeType = '${config.mergeType}'
  
  if (mergeType === 'row' && mergeColumns.includes(column.property)) {
    // 行合并逻辑
    let rowspan = 1
    let colspan = 1
    
    // 计算行合并数量
    for (let i = rowIndex + 1; i < tableData.length; i++) {
      if (tableData[i][column.property] === row[column.property]) {
        rowspan++
      } else {
        break
      }
    }
    
    // 检查是否为合并区域的第一行
    for (let i = rowIndex - 1; i >= 0; i--) {
      if (tableData[i][column.property] === row[column.property]) {
        return { rowspan: 0, colspan: 0 }
      } else {
        break
      }
    }
    
    return { rowspan, colspan }
  }
  
  return { rowspan: 1, colspan: 1 }
}`
      
      return spanMethodCode
    }

    return {
      tableData,
      spanConfig,
      generatedCode,
      activeTab,
      isVerticalLayout,
      handleDataChange,
      handleConfigChange,
      handleSpanMethod,
      toggleLayout
    }
  }
}
</script>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: #2c3e50;
  padding: 24px 32px;
  flex-shrink: 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.header-left h1 {
  margin: 0 0 6px 0;
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-left p {
  margin: 0;
  font-size: 15px;
  color: #64748b;
  font-weight: 400;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-body {
  flex: 1;
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 32px;
  gap: 24px;
  min-height: 0;
}

.app-body.vertical-layout {
  flex-direction: column;
}

.left-panel {
  width: 380px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
}

.vertical-layout .left-panel {
  width: 100%;
  height: auto;
}

.right-panel {
  flex: 1;
  min-width: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
}

.content-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tab-content {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

:deep(.el-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

:deep(.el-tab-pane) {
  height: 100%;
}

:deep(.el-tabs--border-card) {
  border: none;
  box-shadow: none;
}

:deep(.el-tabs__header) {
  margin: 0;
  background: rgba(248, 249, 250, 0.8);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
}

:deep(.el-tabs__nav) {
  border: none;
}

:deep(.el-tabs__item) {
  border: none;
  padding: 16px 24px;
  font-weight: 500;
  color: #64748b;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-tabs__item:hover) {
  color: #475569;
}

:deep(.el-tabs__item.is-active) {
  background: rgba(255, 255, 255, 0.9);
  color: #667eea;
  border-bottom: 3px solid #667eea;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .app-body {
    flex-direction: column;
    padding: 16px;
    gap: 16px;
  }
  
  .left-panel {
    width: 100%;
  }
  
  .header-content {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
  
  .header-left h1 {
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  .app-header {
    padding: 12px 16px;
  }
  
  .app-body {
    padding: 12px;
    gap: 12px;
  }
  
  .header-left h1 {
    font-size: 18px;
  }
  
  .header-left p {
    font-size: 12px;
  }
  
  .tab-content {
    padding: 12px;
  }
}

/* 滚动条样式 */
:deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}

:deep(.el-scrollbar__bar) {
  opacity: 0.3;
  transition: opacity 0.3s;
}

:deep(.el-scrollbar:hover .el-scrollbar__bar) {
  opacity: 0.8;
}
</style>