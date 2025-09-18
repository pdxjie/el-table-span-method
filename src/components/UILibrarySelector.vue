<template>
  <div class="ui-library-selector">
    <!-- 简洁的分段控制器 -->
    <div class="selector-main">
      <div class="selector-header">
        <div class="switcher-container">
          <div class="library-switcher">
            <div 
              v-for="library in availableLibraries" 
              :key="library.id"
              class="library-tab"
              :class="{ 'active': library.id === currentLibrary }"
              @click="selectLibrary(library.id)"
              :title="library.name"
            >
              <div class="tab-icon" :class="`icon-${library.id}`">
                <el-icon v-if="library.id === 'element-plus'"><Grid /></el-icon>
                <el-icon v-else-if="library.id === 'ant-design-vue'"><Operation /></el-icon>
                <el-icon v-else-if="library.id === 'naive-ui'"><Rank /></el-icon>
                <el-icon v-else-if="library.id === 'vuetify'"><Promotion /></el-icon>
              </div>
              <span class="tab-label">{{ getLibraryShortName(library.id) }}</span>
              <div v-if="library.id === currentLibrary" class="active-indicator"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 当前库简要信息 -->
      <el-collapse-transition>
        <div v-if="showQuickInfo" class="quick-info">
          <div class="current-library-info">
            <div class="info-main">
              <div class="lib-identity">
                <div class="lib-icon" :class="`icon-${currentLibrary}`">
                  <el-icon v-if="currentLibrary === 'element-plus'"><Grid /></el-icon>
                  <el-icon v-else-if="currentLibrary === 'ant-design-vue'"><Operation /></el-icon>
                  <el-icon v-else-if="currentLibrary === 'naive-ui'"><Rank /></el-icon>
                  <el-icon v-else-if="currentLibrary === 'vuetify'"><Promotion /></el-icon>
                </div>
                <div class="lib-details">
                  <h4 class="lib-name">{{ currentLibraryInfo.name }}</h4>
                  <span class="lib-version">v{{ currentLibraryInfo.version }}</span>
                </div>
              </div>
              
              <div class="features-compact">
                <el-tag v-if="currentLibraryInfo.features.rowSpan" size="small" type="primary">行合并</el-tag>
                <el-tag v-if="currentLibraryInfo.features.colSpan" size="small" type="success">列合并</el-tag>
                <el-tag v-if="currentLibraryInfo.features.mixedSpan" size="small" type="warning">混合合并</el-tag>
              </div>
            </div>
            
            <div class="info-actions">
              <el-button 
                size="small" 
                type="text" 
                @click="viewCurrentLibraryDocs"
                title="查看文档"
              >
                <el-icon><Document /></el-icon>
              </el-button>
              <el-button 
                size="small" 
                type="text" 
                @click="showInstallDialog = true"
                title="安装说明"
              >
                <el-icon><Download /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </el-collapse-transition>
    </div>

    <!-- 安装对话框 -->
    <el-dialog
      v-model="showInstallDialog"
      :title="`安装 ${currentLibraryInfo?.name}`"
      width="480px"
    >
      <div class="install-content">
        <div class="package-manager-select">
          <span class="label">包管理器:</span>
          <el-radio-group v-model="selectedPackageManager" size="small">
            <el-radio-button value="npm">npm</el-radio-button>
            <el-radio-button value="yarn">yarn</el-radio-button>
            <el-radio-button value="pnpm">pnpm</el-radio-button>
          </el-radio-group>
        </div>
        
        <div class="command-section">
          <div class="command-display">
            <code>{{ getInstallCommand() }}</code>
            <el-button 
              size="small" 
              type="text" 
              @click="copyInstallCommand"
              title="复制命令"
            >
              <el-icon><CopyDocument /></el-icon>
            </el-button>
          </div>
        </div>
        
        <div class="feature-notice" v-if="hasFeatureLimitations()">
          <el-icon class="notice-icon"><Warning /></el-icon>
          <span class="notice-text">{{ getFeatureLimitationText() }}</span>
        </div>
      </div>
    </el-dialog>

    <!-- 文档对话框 -->
    <el-dialog
      v-model="showDocModal"
      :title="`${selectedDocLibrary?.name} 文档`"
      width="500px"
    >
      <div class="doc-content" v-if="selectedDocLibrary">
        <div class="doc-notes">
          <ul>
            <li v-for="note in selectedDocLibrary.documentation.notes" :key="note">
              {{ note }}
            </li>
          </ul>
        </div>
        
        <div class="doc-links" v-if="selectedDocLibrary.documentation.links.length > 0">
          <h6>相关链接</h6>
          <el-link 
            v-for="link in selectedDocLibrary.documentation.links" 
            :key="link.url"
            :href="link.url" 
            target="_blank"
            :icon="Link"
          >
            {{ link.title }}
          </el-link>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Setting, Grid, Document, Download, Close, InfoFilled,
  CopyDocument, Link, Rank, Promotion, Operation, Warning 
} from '@element-plus/icons-vue'
import { uiLibraryManager, UI_LIBRARY_METADATA } from '../adapters/UILibraryManager.js'

export default {
  name: 'UILibrarySelector',
  components: {
    Setting, Grid, Document, Download, Close, InfoFilled,
    CopyDocument, Link, Rank, Promotion, Operation, Warning
  },
  props: {
    currentLibrary: {
      type: String,
      default: 'element-plus'
    }
  },
  emits: ['library-change'],
  setup(props, { emit }) {
    const showDocModal = ref(false)
    const showQuickInfo = ref(false)
    const showInstallDialog = ref(false)
    const selectedPackageManager = ref('npm')
    const selectedDocLibrary = ref(null)

    // 获取所有可用的UI库
    const availableLibraries = computed(() => {
      return uiLibraryManager.getAvailableLibraries()
    })

    // 当前UI库信息
    const currentLibraryInfo = computed(() => {
      return availableLibraries.value.find(lib => lib.id === props.currentLibrary) || availableLibraries.value[0]
    })

    // 当前UI库元数据
    const currentLibraryMeta = computed(() => {
      return UI_LIBRARY_METADATA[props.currentLibrary] || {}
    })

    // 安装命令
    const getInstallCommand = () => {
      const instructions = uiLibraryManager.getInstallInstructions(props.currentLibrary)
      return instructions.commands[selectedPackageManager.value] || ''
    }

    // 获取UI库短名称
    const getLibraryShortName = (libraryId) => {
      const names = {
        'element-plus': 'Element+',
        'ant-design-vue': 'Antd',
        'naive-ui': 'Naive',
        'vuetify': 'Vuetify'
      }
      return names[libraryId] || libraryId
    }

    // 获取UI库元数据
    const getLibraryMeta = (libraryId) => {
      return UI_LIBRARY_METADATA[libraryId] || {
        description: '暂无描述',
        popularity: 'medium',
        learnability: 'medium',
        ecosystem: 'good'
      }
    }

    // 获取热度等级（数字）
    const getPopularityLevel = (popularity) => {
      const levelMap = {
        low: 1,
        medium: 2,
        high: 3
      }
      return levelMap[popularity] || 2
    }

    // 获取特性名称
    const getFeatureName = (feature) => {
      const featureNames = {
        rowSpan: '行合并',
        colSpan: '列合并',
        mixedSpan: '混合合并',
        customRender: '自定义渲染',
        virtualScroll: '虚拟滚动',
        sortable: '排序',
        resizable: '列宽调整'
      }
      return featureNames[feature] || feature
    }

    // 获取热度类型
    const getPopularityType = (popularity) => {
      const typeMap = {
        high: 'success',
        medium: 'warning',
        low: 'info'
      }
      return typeMap[popularity] || 'info'
    }

    // 选择UI库
    const selectLibrary = (libraryId) => {
      if (libraryId !== props.currentLibrary) {
        try {
          uiLibraryManager.setCurrentAdapter(libraryId)
          emit('library-change', libraryId)
          ElMessage.success(`已切换到 ${getLibraryDisplayName(libraryId)}`)
        } catch (error) {
          ElMessage.error('切换UI库失败: ' + error.message)
        }
      }
    }

    // 获取UI库名称
    const getLibraryDisplayName = (libraryId) => {
      const library = availableLibraries.value.find(lib => lib.id === libraryId)
      return library ? library.name : libraryId
    }

    // 查看库文档
    const viewLibraryDocs = (library) => {
      selectedDocLibrary.value = library
      showDocModal.value = true
    }

    // 查看当前库文档
    const viewCurrentLibraryDocs = () => {
      const currentLib = availableLibraries.value.find(lib => lib.id === props.currentLibrary)
      if (currentLib) {
        viewLibraryDocs(currentLib)
      }
    }

    // 检查当前库是否有功能限制
    const hasFeatureLimitations = () => {
      const library = availableLibraries.value.find(lib => lib.id === props.currentLibrary)
      if (!library) return false
      
      // 检查是否有不支持的功能
      return !library.features.colSpan || !library.features.mixedSpan
    }

    // 获取功能限制提示文本
    const getFeatureLimitationText = () => {
      const library = availableLibraries.value.find(lib => lib.id === props.currentLibrary)
      if (!library) return ''
      
      const limitations = []
      if (!library.features.colSpan) limitations.push('列合并')
      if (!library.features.mixedSpan) limitations.push('混合合并')
      
      if (limitations.length > 0) {
        return `注意：${library.name} 对${limitations.join('、')}功能支持有限`
      }
      return ''
    }

    // 复制安装命令
    const copyInstallCommand = async () => {
      try {
        const command = getInstallCommand()
        await navigator.clipboard.writeText(command)
        ElMessage.success('安装命令已复制到剪贴板')
      } catch (error) {
        ElMessage.error('复制失败')
      }
    }

    // 监听当前库变化
    watch(() => props.currentLibrary, (newLibrary) => {
      if (uiLibraryManager.hasAdapter(newLibrary)) {
        uiLibraryManager.setCurrentAdapter(newLibrary)
      }
    })

    return {
      showDocModal,
      showQuickInfo,
      showInstallDialog,
      selectedPackageManager,
      selectedDocLibrary,
      availableLibraries,
      currentLibraryInfo,
      currentLibraryMeta,
      getInstallCommand,
      getLibraryShortName,
      getLibraryMeta,
      getPopularityLevel,
      getFeatureName,
      getPopularityType,
      selectLibrary,
      viewLibraryDocs,
      viewCurrentLibraryDocs,
      hasFeatureLimitations,
      getFeatureLimitationText,
      copyInstallCommand
    }
  }
}
</script>

<style scoped>
.ui-library-selector {
  margin-bottom: 20px;
}

/* 主选择器 */
.selector-main {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

/* 选择器头部 */
.selector-header {
  display: flex;
  justify-content: center;
  padding: 12px 16px;
  background: #fafbfc;
  border-bottom: 1px solid #f0f0f0;
}

.switcher-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  font-size: 16px;
  color: #6b7280;
}

.header-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-right: 16px;
}

/* 库切换器 */
.library-switcher {
  display: flex;
  gap: 4px;
  flex: 1;
  justify-content: center;
  max-width: 480px;
}

.library-tab {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: transparent;
  flex: 1;
  min-width: 80px;
  max-width: 120px;
}

.library-tab:hover {
  background: rgba(59, 130, 246, 0.05);
  transform: translateY(-1px);
}

.library-tab.active {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.tab-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.library-tab.active .tab-icon {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.icon-element-plus {
  background: linear-gradient(135deg, #409eff, #337ecc);
}

.icon-ant-design-vue {
  background: linear-gradient(135deg, #1890ff, #0050b3);
}

.icon-naive-ui {
  background: linear-gradient(135deg, #18a058, #0c7a43);
}

.icon-vuetify {
  background: linear-gradient(135deg, #1976d2, #0d47a1);
}

.tab-label {
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.3s ease;
  text-align: center;
  line-height: 1;
}

.library-tab.active .tab-label {
  color: #3b82f6;
  font-weight: 600;
}

.active-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: #3b82f6;
  border-radius: 1px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 20px;
    opacity: 1;
  }
}

/* 快速操作 */
.quick-actions {
  display: flex;
  align-items: center;
  margin-left: 8px;
}

/* 快速信息面板 */
.quick-info {
  padding: 16px;
  background: #ffffff;
  border-top: 1px solid #f0f0f0;
}

.current-library-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.info-main {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.lib-identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lib-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
}

.lib-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lib-name {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.lib-version {
  font-size: 12px;
  color: #6b7280;
  font-family: 'Monaco', 'Menlo', monospace;
  background: #f3f4f6;
  padding: 1px 4px;
  border-radius: 3px;
  display: inline-block;
}

.features-compact {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.features-compact .el-tag {
  font-size: 11px;
  height: 18px;
  line-height: 16px;
}

.info-actions {
  display: flex;
  gap: 4px;
}

/* 对话框样式 */
.install-content {
  padding: 4px 0;
}

.package-manager-select {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.package-manager-select .label {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.command-section {
  margin-bottom: 16px;
}

.command-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.command-display code {
  flex: 1;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  color: #1e293b;
  background: none;
  border: none;
}

/* 特性提醒 */
.feature-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 6px;
}

.notice-icon {
  font-size: 16px;
  color: #f59e0b;
  flex-shrink: 0;
}

.notice-text {
  font-size: 13px;
  color: #92400e;
  line-height: 1.4;
}

/* 文档内容 */
.doc-content {
  max-height: 400px;
  overflow-y: auto;
}

.doc-notes {
  margin: 0 0 20px 0;
  padding-left: 20px;
}

.doc-notes li {
  margin-bottom: 8px;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

.doc-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.doc-links h6 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .selector-header {
    justify-content: center;
    padding: 16px;
  }
  
  .switcher-container {
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }
  
  .quick-actions {
    margin-left: 0;
    margin-top: 4px;
  }
  
  .library-switcher {
    max-width: none;
    gap: 8px;
  }
  
  .library-tab {
    min-width: 70px;
    padding: 10px 8px 8px 8px;
  }
  
  .tab-label {
    font-size: 10px;
  }
  
  .current-library-info {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .info-actions {
    justify-content: center;
  }
}

/* 紧凑模式 */
@media (max-width: 480px) {
  .library-tab {
    min-width: 60px;
    padding: 8px 6px 6px 6px;
  }
  
  .tab-label {
    display: none;
  }
  
  .tab-icon {
    width: 28px;
    height: 28px;
    font-size: 18px;
  }
  
  .header-title {
    font-size: 13px;
  }
  
  .quick-actions {
    margin-top: 8px;
  }
}
</style>