<template>
  <div class="app">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-container">
        <div class="brand">
          <div class="brand-icon" size="24">
            <!-- 自定义SVG Logo -->
            <svg viewBox="0 0 32 32" width="24" height="24" class="table-merger-logo">
              <!-- 表格框架 -->
              <rect x="4" y="6" width="24" height="20" rx="2" ry="2" 
                    fill="none" stroke="#3b82f6" stroke-width="1.5">
                <animate attributeName="stroke-opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite"/>
              </rect>
              
              <!-- 表格分隔线 -->
              <line x1="4" y1="12" x2="28" y2="12" stroke="#3b82f6" stroke-width="1"/>
              <line x1="4" y1="18" x2="28" y2="18" stroke="#3b82f6" stroke-width="1"/>
              <line x1="12" y1="6" x2="12" y2="26" stroke="#3b82f6" stroke-width="1"/>
              <line x1="20" y1="6" x2="20" y2="26" stroke="#3b82f6" stroke-width="1"/>
              
              <!-- 合并指示器 -->
              <rect x="6" y="8" width="4" height="2" rx="1" fill="#10b981" opacity="0.8">
                <animate attributeName="fill" values="#10b981;#06d6a0;#10b981" dur="2.5s" repeatCount="indefinite"/>
              </rect>
              <rect x="22" y="8" width="4" height="2" rx="1" fill="#10b981" opacity="0.8">
                <animate attributeName="fill" values="#10b981;#06d6a0;#10b981" dur="2.5s" begin="0.5s" repeatCount="indefinite"/>
              </rect>
              
              <!-- 连接线表示合并 -->
              <path d="M8 9 Q16 4 24 9" stroke="#f59e0b" stroke-width="2" 
                    fill="none" stroke-linecap="round">
                <animate attributeName="stroke-dasharray" values="0,50;20,30;0,50" dur="4s" repeatCount="indefinite"/>
              </path>
              
              <!-- 动态效果点 -->
              <circle cx="8" cy="9" r="1.5" fill="#f59e0b">
                <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="r" values="1.5;2;1.5" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="24" cy="9" r="1.5" fill="#f59e0b">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="r" values="1.5;2;1.5" dur="2s" begin="1s" repeatCount="indefinite"/>
              </circle>
            </svg>
          </div>
          <div class="brand-text">
            <h1>TableWiz</h1>
            <span class="tagline">表格魔法师 · 让合并变得简单</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="app-main" :class="{ 'vertical-layout': isVerticalLayout }">
      <!-- 配置侧边栏 -->
      <aside class="config-sidebar">
        <!-- UI库选择器 - 固定在顶部 -->
        <div class="sidebar-header">
          <UILibrarySelector
            :current-library="currentLibrary"
            @library-change="handleLibraryChange"
          />
        </div>
        
        <!-- 配置面板 - 可滚动内容 -->
        <div class="sidebar-content">
          <ConfigPanel
            @data-change="handleDataChange"
            @config-change="handleConfigChange"
          />
        </div>
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
              <UniversalTablePreview
                :table-data="tableData"
                :span-config="spanConfig"
                :current-library="currentLibrary"
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
                :current-library="currentLibrary"
                :is-active="activeTab === 'code'"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </section>
    </main>

    <!-- GitHub推广浮动卡片 -->
    <div class="github-promotion-float" :class="{ 'show': showGithubPromo }">
      <div class="github-card">
        <!-- 关闭按钮 -->
        <button class="close-btn" @click="hideGithubPromo">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        
        <!-- 卡片内容 -->
        <div class="card-content">
          <!-- GitHub标志动画 -->
          <div class="github-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
          </div>
          
          <!-- 标题 -->
          <h3 class="card-title">喜欢这个项目？</h3>
          <p class="card-subtitle">支持开源，给个 Star ⭐</p>
          
          <!-- 统计信息 -->
          <div class="stats">
            <div class="stat-item">
              <div class="stat-number">{{ starsCount || '999+' }}</div>
              <div class="stat-label">Stars</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-number">{{ forksCount || '100+' }}</div>
              <div class="stat-label">Forks</div>
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="card-actions">
            <a href="https://github.com/pdxjie/el-table-span-method" target="_blank" class="action-btn primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Star 项目
            </a>
            <a href="https://github.com/pdxjie" target="_blank" class="action-btn secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              关注作者
            </a>
          </div>
        </div>
        
        <!-- 装饰性背景 -->
        <div class="bg-decoration">
          <div class="decoration-circle circle-1"></div>
          <div class="decoration-circle circle-2"></div>
          <div class="decoration-circle circle-3"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { View, Document, Menu } from '@element-plus/icons-vue'
import ConfigPanel from './components/ConfigPanel.vue'
import UniversalTablePreview from './components/UniversalTablePreview.vue'
import CodeGenerator from './components/CodeGenerator.vue'
import UILibrarySelector from './components/UILibrarySelector.vue'
import { generateSpanMethod } from './utils/spanMethod.js'
import { uiLibraryManager } from './adapters/UILibraryManager.js'

export default {
  name: 'App',
  components: {
    ConfigPanel,
    UniversalTablePreview,
    CodeGenerator,
    UILibrarySelector,
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
    const currentLibrary = ref('element-plus')
    
    // GitHub推广相关状态
    const showGithubPromo = ref(false)
    const starsCount = ref('')
    const forksCount = ref('')

    // 延迟显示GitHub推广卡片
    setTimeout(() => {
      showGithubPromo.value = true
    }, 3000)

    // 隐藏推广卡片（仅当前会话有效）
    const hideGithubPromo = () => {
      showGithubPromo.value = false
    } // 添加当前UI库状态

    const handleDataChange = (data) => {
      tableData.value = data
      // 数据导入后自动切换到预览标签
      activeTab.value = 'preview'
    }

    const handleConfigChange = (config) => {
      spanConfig.value = { ...spanConfig.value, ...config }
    }

    // 处理UI库切换
    const handleLibraryChange = (libraryId) => {
      currentLibrary.value = libraryId
      
      // 更新UI库管理器
      try {
        uiLibraryManager.setCurrentAdapter(libraryId)
      } catch (error) {
        console.error('切换UI库失败:', error)
      }
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
      if (config.mergeType === 'column') {
        // 列合并代码生成 - 多层表头结构
        return `
// 列合并实现：使用多层表头结构
// 表头列配置
const columnGroups = {
  '${config.mergeColumns.join(',')}': '${getMergedGroupLabel(config.mergeColumns)}'
}

// Element Plus 表格列配置
const tableColumns = [
  // 合并列组
  {
    label: columnGroups['${config.mergeColumns.join(',')}'],
    align: 'center',
    children: [
      ${config.mergeColumns.map(col => `{
        prop: '${col}',
        label: '${col}',
        minWidth: 120
      }`).join(',\n      ')}
    ]
  },
  // 其他列
  ${getOtherColumns(config.mergeColumns).map(col => `{
    prop: '${col}',
    label: '${col}',
    minWidth: 120
  }`).join(',\n  ')}
]

// 在模板中使用：
// <el-table :data="tableData" border>
//   <el-table-column v-for="col in tableColumns" v-bind="col" :key="col.prop || col.label">
//     <el-table-column v-if="col.children" v-for="child in col.children" v-bind="child" :key="child.prop"/>
//   </el-table-column>
// </el-table>`
      } else if (config.mergeType === 'mixed') {
        // 混合合并代码
        return `
// 混合合并实现：表头列合并 + 数据行合并
// 表头列配置（同列合并）
const columnGroups = {
  '${config.mergeColumns.join(',')}': '${getMergedGroupLabel(config.mergeColumns)}'
}

const tableColumns = [
  // 合并列组
  {
    label: columnGroups['${config.mergeColumns.join(',')}'],
    align: 'center',
    children: [
      ${config.mergeColumns.map(col => `{
        prop: '${col}',
        label: '${col}',
        minWidth: 120
      }`).join(',\n      ')}
    ]
  },
  // 其他列
  ${getOtherColumns(config.mergeColumns).map(col => `{
    prop: '${col}',
    label: '${col}',
    minWidth: 120
  }`).join(',\n  ')}
]

// 行合并方法
const spanMethod = ({ row, column, rowIndex, columnIndex }) => {
  // 对非列合并组的第一列进行行合并（如department）
  const rowMergeField = 'department' // 根据实际数据调整
  
  if (column.property === 'name' && row[rowMergeField]) {
    let rowspan = 1
    
    // 向下查找相同部门的行
    for (let i = rowIndex + 1; i < tableData.length; i++) {
      if (tableData[i][rowMergeField] === row[rowMergeField]) {
        rowspan++
      } else {
        break
      }
    }
    
    // 检查是否为合并区域的第一行
    for (let i = rowIndex - 1; i >= 0; i--) {
      if (tableData[i][rowMergeField] === row[rowMergeField]) {
        return { rowspan: 0, colspan: 0 }
      } else {
        break
      }
    }
    
    return { rowspan, colspan: 1 }
  }
  
  return { rowspan: 1, colspan: 1 }
}`
      } else {
        // 行合并代码（原有逻辑）
        return `
// 行合并实现
const spanMethod = ({ row, column, rowIndex, columnIndex }) => {
  const mergeColumns = ${JSON.stringify(config.mergeColumns)}
  
  if (!mergeColumns.includes(column.property)) {
    return { rowspan: 1, colspan: 1 }
  }
  
  let rowspan = 1
  const currentValue = row[column.property]
  
  // 向下计算行合并数量
  for (let i = rowIndex + 1; i < tableData.length; i++) {
    if (tableData[i][column.property] === currentValue) {
      rowspan++
    } else {
      break
    }
  }
  
  // 检查是否为合并区域的第一行
  for (let i = rowIndex - 1; i >= 0; i--) {
    if (tableData[i][column.property] === currentValue) {
      return { rowspan: 0, colspan: 0 }
    } else {
      break
    }
  }
  
  return { rowspan, colspan: 1 }
}`
      }
    }

    // 获取合并组标签的辅助函数
    const getMergedGroupLabel = (mergeColumns) => {
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

    // 获取其他列的辅助函数
    const getOtherColumns = (mergeColumns) => {
      // 这里需要根据实际的表格字段来确定
      const allFields = ['name', 'department', 'position', 'level'] // 示例字段
      return allFields.filter(field => !mergeColumns.includes(field))
    }

    return {
      tableData,
      spanConfig,
      generatedCode,
      activeTab,
      isVerticalLayout,
      currentLibrary,
      showGithubPromo,
      starsCount,
      forksCount,
      handleDataChange,
      handleConfigChange,
      handleLibraryChange,
      handleSpanMethod,
      toggleLayout,
      hideGithubPromo
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

/* GitHub推广浮动卡片样式 */
.github-promotion-float {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  transform: translateY(100px) scale(0.8);
  opacity: 0;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.github-promotion-float.show {
  transform: translateY(0) scale(1);
  opacity: 1;
  pointer-events: auto;
}

.github-card {
  width: 320px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  padding: 24px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.github-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #10b981, #f59e0b, #ef4444);
  opacity: 0.8;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
  z-index: 10;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #374151;
  transform: scale(1.1);
}

.card-content {
  position: relative;
  z-index: 5;
}

.github-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #24292e 0%, #40484f 100%);
  border-radius: 12px;
  margin: 0 auto 16px;
  color: white;
  animation: float 3s ease-in-out infinite;
}

.github-logo svg {
  animation: rotate 8s linear infinite;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  text-align: center;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.card-subtitle {
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  margin: 0 0 20px 0;
  line-height: 1.4;
}

.stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 20px 0;
  padding: 16px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: rgba(0, 0, 0, 0.1);
}

.card-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.action-btn.primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.3);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.4);
}

.action-btn.secondary {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.action-btn.secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
}

.action-btn svg {
  transition: transform 0.2s ease;
}

.action-btn:hover svg {
  transform: scale(1.1);
}

/* 装饰性背景 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 1;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1));
  animation: float-decoration 6s ease-in-out infinite;
}

.circle-1 {
  width: 60px;
  height: 60px;
  top: -30px;
  right: -30px;
  animation-delay: 0s;
}

.circle-2 {
  width: 40px;
  height: 40px;
  bottom: -20px;
  left: -20px;
  animation-delay: 2s;
}

.circle-3 {
  width: 80px;
  height: 80px;
  top: 50%;
  right: -40px;
  animation-delay: 4s;
}

/* 动画效果 */
@keyframes float {
  0%, 100% { 
    transform: translateY(0);
  }
  50% { 
    transform: translateY(-8px);
  }
}

@keyframes rotate {
  from { 
    transform: rotate(0deg);
  }
  to { 
    transform: rotate(360deg);
  }
}

@keyframes float-decoration {
  0%, 100% { 
    transform: translate(0, 0) scale(1);
    opacity: 0.3;
  }
  50% { 
    transform: translate(-10px, -10px) scale(1.1);
    opacity: 0.6;
  }
}

.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
  transition: all 0.3s ease;
}

.brand-icon:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
}

.table-merger-logo {
  width: 24px;
  height: 24px;
  transition: all 0.3s ease;
}

.brand-icon:hover .table-merger-logo {
  transform: scale(1.05);
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
  height: calc(100vh - 130px);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  flex-shrink: 0;
  border-bottom: 1px solid #f0f0f0;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.vertical-layout .config-sidebar {
  width: 100%;
  height: auto;
}

.vertical-layout .sidebar-header {
  border-bottom: 1px solid #f0f0f0;
}

.vertical-layout .sidebar-content {
  overflow-y: visible;
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
  
  .github-promotion-float {
    bottom: 20px;
    right: 20px;
  }
  
  .github-card {
    width: 280px;
    padding: 20px;
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

  .sidebar-content {
    overflow-y: auto;
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
  
  .github-promotion-float {
    bottom: 16px;
    right: 16px;
  }
  
  .github-card {
    width: 260px;
    padding: 18px;
  }
  
  .card-title {
    font-size: 16px;
  }
  
  .stats {
    padding: 12px;
  }
  
  .action-btn {
    padding: 10px 12px;
    font-size: 13px;
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
    overflow: visible;
  }

  .sidebar-content {
    overflow-y: visible;
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

  .github-promotion-float {
    bottom: 12px;
    right: 12px;
    left: 12px;
  }

  .github-card {
    width: 100%;
    padding: 16px;
  }

  .card-title {
    font-size: 15px;
  }

  .card-subtitle {
    font-size: 13px;
  }

  .stats {
    flex-direction: column;
    gap: 12px;
    padding: 16px 12px;
  }

  .stat-divider {
    width: 60%;
    height: 1px;
  }

  .card-actions {
    flex-direction: column;
    gap: 8px;
  }

  .action-btn {
    padding: 12px;
    font-size: 14px;
  }

  .app-header {
    height: auto;
    min-height: 80px;
  }

  .app-main {
    height: calc(100vh - 80px);
    margin-top: 80px;
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