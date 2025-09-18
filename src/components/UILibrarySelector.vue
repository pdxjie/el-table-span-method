<template>
  <div class="ui-library-selector">
    <!-- 简洁的UI库选择栏 -->
    <div class="selector-container">
      <div class="selector-info">
        <el-icon class="selector-icon"><Setting /></el-icon>
        <span class="selector-label">UI组件库:</span>
      </div>
      
      <!-- 下拉选择器 -->
      <el-select 
        :model-value="currentLibrary"
        @change="selectLibrary"
        placeholder="选择UI库"
        class="library-select"
        size="default"
      >
        <el-option
          v-for="library in availableLibraries"
          :key="library.id"
          :label="library.name"
          :value="library.id"
        >
          <div class="option-content">
            <div class="option-main">
              <span class="option-name">{{ library.name }}</span>
              <span class="option-version">v{{ library.version }}</span>
              <el-tag 
                size="small" 
                :type="getPopularityType(getLibraryMeta(library.id).popularity)"
                class="option-tag"
              >
                {{ getLibraryMeta(library.id).popularity }}
              </el-tag>
            </div>
            <div class="option-features">
              <el-icon v-if="library.features.rowSpan" class="feature-icon"><Grid /></el-icon>
              <el-icon v-if="library.features.colSpan" class="feature-icon"><Promotion /></el-icon>
              <el-icon v-if="library.features.customRender" class="feature-icon"><Edit /></el-icon>
              <el-icon v-if="library.features.virtualScroll" class="feature-icon"><Rank /></el-icon>
            </div>
          </div>
        </el-option>
      </el-select>
      
      <!-- 快速操作按钮 -->
      <div class="quick-actions">
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
          @click="showInstallInfo = !showInstallInfo"
          :title="showInstallInfo ? '隐藏安装说明' : '查看安装说明'"
        >
        <el-icon><Download /></el-icon>
      </el-button>
      </div>
    </div>

    <!-- 折叠式安装信息 -->
    <el-collapse-transition>
      <div v-show="showInstallInfo" class="install-panel">
        <div class="install-header">
          <h6>安装 {{ currentLibraryInfo.name }}</h6>
          <el-radio-group v-model="selectedPackageManager" size="small">
            <el-radio-button value="npm">npm</el-radio-button>
            <el-radio-button value="yarn">yarn</el-radio-button>
            <el-radio-button value="pnpm">pnpm</el-radio-button>
          </el-radio-group>
        </div>
        
        <div class="command-display">
          <code>{{ installCommands[selectedPackageManager] }}</code>
          <el-button 
            size="small" 
            type="text" 
            @click="copyInstallCommand"
            title="复制命令"
          >
            <el-icon><CopyDocument /></el-icon>
          </el-button>
        </div>
        
        <!-- 特性信息 -->
        <div class="feature-info" v-if="hasLimitedFeatures">
          <el-icon class="warning-icon"><Warning /></el-icon>
          <span class="warning-text">
            注意：{{ currentLibraryInfo.name }} 对某些合并功能支持有限
          </span>
        </div>
      </div>
    </el-collapse-transition>

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
  Setting, Grid, Document, Download, Search, Check, Close, 
  CopyDocument, Link, Edit, Rank, Promotion, Operation, Warning 
} from '@element-plus/icons-vue'
import { uiLibraryManager, UI_LIBRARY_METADATA } from '../adapters/UILibraryManager.js'

export default {
  name: 'UILibrarySelector',
  components: {
    Setting, Grid, Document, Download, Search, Check, Close,
    CopyDocument, Link, Edit, Rank, Promotion, Operation, Warning
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
    const showInstallInfo = ref(false)
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
    const installCommands = computed(() => {
      const instructions = uiLibraryManager.getInstallInstructions(props.currentLibrary)
      return instructions.commands
    })

    // 导入语句
    const importStatements = computed(() => {
      const instructions = uiLibraryManager.getInstallInstructions(props.currentLibrary)
      return instructions.imports
    })

    // 获取UI库元数据
    const getLibraryMeta = (libraryId) => {
      return UI_LIBRARY_METADATA[libraryId] || {
        description: '暂无描述',
        popularity: 'medium',
        learnability: 'medium',
        ecosystem: 'good'
      }
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

    // 选择UI库 - 直接生效
    const selectLibrary = (libraryId) => {
      if (libraryId !== props.currentLibrary) {
        try {
          uiLibraryManager.setCurrentAdapter(libraryId)
          emit('library-change', libraryId)
          ElMessage.success(`已切换到 ${getLibraryName(libraryId)}`)
        } catch (error) {
          ElMessage.error('切换UI库失败: ' + error.message)
        }
      }
    }

    // 获取UI库名称
    const getLibraryName = (libraryId) => {
      const library = availableLibraries.value.find(lib => lib.id === libraryId)
      return library ? library.name : libraryId
    }

    // 查看当前库文档
    const viewCurrentLibraryDocs = () => {
      selectedDocLibrary.value = currentLibraryInfo.value
      showDocModal.value = true
    }

    // 检查当前库是否有功能限制
    const hasLimitedFeatures = computed(() => {
      const meta = currentLibraryMeta.value
      return meta.limitations && meta.limitations.length > 0
    })

    // 复制安装命令
    const copyInstallCommand = async () => {
      try {
        await navigator.clipboard.writeText(installCommands.value[selectedPackageManager.value])
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
      showInstallInfo,
      selectedPackageManager,
      selectedDocLibrary,
      availableLibraries,
      currentLibraryInfo,
      currentLibraryMeta,
      installCommands,
      importStatements,
      getLibraryMeta,
      getFeatureName,
      getPopularityType,
      selectLibrary,
      viewCurrentLibraryDocs,
      hasLimitedFeatures,
      copyInstallCommand
    }
  }
}
</script>

<style scoped>
.ui-library-selector {
  background: #ffffff;
  border-radius: 8px;
  padding: 12px 16px;
}

/* 紧凑的选择器容器 */
.selector-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.selector-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.selector-icon {
  font-size: 16px;
  color: #6b7280;
}

.selector-label {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
  white-space: nowrap;
}

.library-select {
  min-width: 160px;
  flex: 0 0 auto;
}

.quick-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  flex-shrink: 0;
}

/* 选项内容样式 */
.option-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

.option-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.option-name {
  font-weight: 500;
  color: #111827;
}

.option-version {
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.option-tag {
  margin-left: 4px;
}

.option-features {
  display: flex;
  gap: 4px;
  opacity: 0.7;
}

.feature-icon {
  font-size: 14px;
  color: #16a34a;
}

/* 安装面板 */
.install-panel {
  margin-top: 12px;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.install-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.install-header h6 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.command-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  margin-bottom: 8px;
}

.command-display code {
  flex: 1;
  font-family: monospace;
  font-size: 13px;
  color: #1e293b;
  background: none;
  border: none;
}

.feature-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 4px;
}

.warning-icon {
  font-size: 14px;
  color: #f59e0b;
  flex-shrink: 0;
}

.warning-text {
  font-size: 12px;
  color: #92400e;
  line-height: 1.4;
}

/* 文档内容样式 */
.documentation-content {
  max-height: 400px;
  overflow-y: auto;
}

.doc-section {
  margin-bottom: 20px;
}

.doc-section h5 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 10px 0;
}

.doc-notes {
  margin: 0;
  padding-left: 20px;
}

.doc-notes li {
  margin-bottom: 6px;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

.doc-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .selector-container {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .quick-actions {
    margin-left: 0;
    justify-content: center;
  }
  
  .library-select {
    min-width: auto;
    width: 100%;
  }
  
  .install-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .command-display {
    flex-direction: column;
    gap: 8px;
  }
}
</style>