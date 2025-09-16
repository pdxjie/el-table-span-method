<template>
  <div class="app">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-container">
        <div class="brand">
          <el-icon class="brand-icon" size="24">
            <Grid />
          </el-icon>
          <div class="brand-text">
            <h1>Table Span Configurator</h1>
            <span class="tagline">智能表格合并配置工具</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="app-main" :class="{ 'vertical-layout': isVerticalLayout }">
      <!-- 配置侧边栏 -->
      <aside class="config-sidebar">
        <ConfigPanel
          @data-change="handleDataChange"
          @config-change="handleConfigChange"
        />
      </aside>

      <!-- 内容面板 -->
      <section class="content-panel">
        <el-tabs
          v-model="activeTab"
          class="main-tabs"
          tab-position="top"
          stretch
        >
          <el-tab-pane name="preview">
            <template #label>
              <div class="tab-label">
                <el-icon><View /></el-icon>
                <span>表格预览</span>
              </div>
            </template>
            <div class="tab-content-wrapper">
              <TablePreview
                :table-data="tableData"
                :span-config="spanConfig"
                @span-method="handleSpanMethod"
              />
            </div>
          </el-tab-pane>

          <el-tab-pane name="code">
            <template #label>
              <div class="tab-label">
                <el-icon><Document /></el-icon>
                <span>生成代码</span>
              </div>
            </template>
            <div class="tab-content-wrapper">
              <CodeGenerator
                :span-config="spanConfig"
                :generated-code="generatedCode"
                :is-active="activeTab === 'code'"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </section>
    </main>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { Grid, View, Document, Menu } from '@element-plus/icons-vue'
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
    Grid,
    View,
    Document,
    Menu
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
/* 主应用布局 */
.app {
  min-height: 100vh;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 */
.app-header {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 72px;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  color: #3b82f6;
}

.brand-text h1 {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  line-height: 1.2;
}

.brand-text .tagline {
  font-size: 13px;
  color: #6b7280;
  font-weight: 400;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 主要内容区域 */
.app-main {
  flex: 1;
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  gap: 24px;
  width: 100%;
  height: calc(100vh - 72px);
  margin-top: 72px;
  overflow: hidden;
}

.app-main.vertical-layout {
  flex-direction: column;
}

/* 配置侧边栏 */
.config-sidebar {
  width: 420px;
  flex-shrink: 0;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  height: calc(100vh - 130px);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.vertical-layout .config-sidebar {
  width: 100%;
  height: auto;
}

/* 内容面板 */
.content-panel {
  flex: 1;
  min-width: 0;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 130px);
}

/* 标签页样式 */
.main-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
}

.tab-content-wrapper {
  flex: 1;
  padding: 20px;
  overflow: hidden;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Element Plus 组件样式重写 */
:deep(.el-tabs__header) {
  margin: 0;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 20px;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-tabs__nav) {
  border: none;
}

:deep(.el-tabs__item) {
  border: none;
  padding: 16px 0;
  margin-right: 32px;
  color: #6b7280;
  font-weight: 500;
  position: relative;
}

:deep(.el-tabs__item:hover) {
  color: #374151;
}

:deep(.el-tabs__item.is-active) {
  color: #3b82f6;
  font-weight: 600;
}

:deep(.el-tabs__active-bar) {
  background-color: #3b82f6;
  height: 2px;
  border-radius: 1px;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

:deep(.el-tab-pane) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 按钮样式优化 */
:deep(.el-button) {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-button--primary) {
  background-color: #3b82f6;
  border-color: #3b82f6;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

:deep(.el-button--primary:hover) {
  background-color: #2563eb;
  border-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px 0 rgba(59, 130, 246, 0.3);
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

/* 响应式设计 */
@media (max-width: 1024px) {
  .header-container {
    padding: 12px 20px;
  }

  .app-main {
    padding: 20px;
    gap: 20px;
    height: calc(100vh - 68px);
    margin-top: 68px;
  }

  .app-header {
    height: 68px;
  }

  .config-sidebar {
    width: 380px;
    height: calc(100vh - 108px);
  }

  .content-panel {
    height: calc(100vh - 108px);
  }
}

@media (max-width: 768px) {
  .header-container {
    padding: 12px 16px;
  }

  .brand-text h1 {
    font-size: 18px;
  }

  .brand-text .tagline {
    display: none;
  }

  .app-main {
    flex-direction: column;
    padding: 16px;
    gap: 16px;
    height: calc(100vh - 64px);
    margin-top: 64px;
  }

  .app-header {
    height: 64px;
  }

  .config-sidebar {
    width: 100%;
    height: auto;
  }

  .content-panel {
    height: auto;
  }

  .tab-content-wrapper {
    padding: 16px;
  }

  :deep(.el-tabs__header) {
    padding: 0 16px;
  }

  :deep(.el-tabs__item) {
    margin-right: 24px;
  }
}

@media (max-width: 480px) {
  .header-container {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
    padding: 8px 12px;
  }

  .app-header {
    height: auto;
    min-height: 80px;
  }

  .app-main {
    height: calc(100vh - 80px);
    margin-top: 80px;
  }

  .header-actions {
    align-self: stretch;
  }

  .tab-content-wrapper {
    padding: 12px;
  }
}

/* 滚动条优化 */
:deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}

:deep(.el-scrollbar__bar) {
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

:deep(.el-scrollbar:hover .el-scrollbar__bar) {
  opacity: 0.8;
}
</style>