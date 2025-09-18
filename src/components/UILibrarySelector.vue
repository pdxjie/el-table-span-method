<template>
  <div class="ui-library-selector">
    <div class="selector-header">
      <div class="header-info">
        <div class="title-section">
          <el-icon class="section-icon"><Setting /></el-icon>
          <span class="section-title">UI 组件库选择</span>
        </div>
        <div class="current-library">
          当前: <span class="current-name">{{ currentLibraryInfo.name }}</span>
        </div>
      </div>
      
      <el-button 
        size="small" 
        @click="showLibraryModal = true"
        type="primary"
        :icon="Grid"
      >
        选择UI库
      </el-button>
    </div>

    <!-- 当前库信息卡片 -->
    <div class="current-library-card">
      <div class="library-header">
        <div class="library-basic">
          <h4 class="library-name">{{ currentLibraryInfo.name }}</h4>
          <span class="library-version">v{{ currentLibraryInfo.version }}</span>
          <el-tag size="small" :type="getPopularityType(currentLibraryMeta.popularity)">
            {{ currentLibraryMeta.popularity }}
          </el-tag>
        </div>
        <div class="library-description">
          {{ currentLibraryMeta.description }}
        </div>
      </div>

      <div class="library-features">
        <h5>支持特性</h5>
        <div class="feature-grid">
          <div 
            v-for="(value, feature) in currentLibraryInfo.features" 
            :key="feature"
            class="feature-item"
            :class="{ 'feature-supported': value }"
          >
            <el-icon>
              <Check v-if="value" />
              <Close v-else />
            </el-icon>
            <span>{{ getFeatureName(feature) }}</span>
          </div>
        </div>
      </div>

      <div class="library-actions">
        <el-button size="small" @click="viewDocumentation" :icon="Document">
          查看文档
        </el-button>
        <el-button size="small" @click="showInstallInfo = !showInstallInfo" :icon="Download">
          安装说明
        </el-button>
      </div>

      <!-- 安装信息折叠面板 -->
      <el-collapse-transition>
        <div v-show="showInstallInfo" class="install-info">
          <div class="install-commands">
            <h6>安装命令</h6>
            <div class="command-tabs">
              <el-radio-group v-model="selectedPackageManager" size="small">
                <el-radio-button value="npm">npm</el-radio-button>
                <el-radio-button value="yarn">yarn</el-radio-button>
                <el-radio-button value="pnpm">pnpm</el-radio-button>
              </el-radio-group>
            </div>
            <div class="command-box">
              <code>{{ installCommands[selectedPackageManager] }}</code>
              <el-button 
                size="small" 
                type="text" 
                @click="copyInstallCommand"
                :icon="CopyDocument"
              >
                复制
              </el-button>
            </div>
          </div>

          <div class="import-statements" v-if="importStatements.length > 0">
            <h6>导入语句</h6>
            <div class="import-list">
              <div v-for="(statement, index) in importStatements" :key="index" class="import-item">
                <code>{{ statement }}</code>
              </div>
            </div>
          </div>
        </div>
      </el-collapse-transition>
    </div>

    <!-- UI库选择对话框 -->
    <el-dialog
      v-model="showLibraryModal"
      title="选择 UI 组件库"
      width="800px"
      :before-close="handleModalClose"
    >
      <div class="library-selection">
        <div class="selection-header">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索UI库..."
            :prefix-icon="Search"
            size="default"
            clearable
          />
          <div class="filter-options">
            <el-select v-model="popularityFilter" placeholder="按热度筛选" clearable size="small">
              <el-option label="高热度" value="high" />
              <el-option label="中热度" value="medium" />
              <el-option label="低热度" value="low" />
            </el-select>
          </div>
        </div>

        <div class="library-grid">
          <div 
            v-for="library in filteredLibraries" 
            :key="library.id"
            class="library-card"
            :class="{ 'library-selected': library.id === currentLibrary }"
            @click="selectLibrary(library.id)"
          >
            <div class="card-header">
              <div class="card-title">
                <h4>{{ library.name }}</h4>
                <span class="version">v{{ library.version }}</span>
              </div>
              <div class="card-badges">
                <el-tag size="small" :type="getPopularityType(getLibraryMeta(library.id).popularity)">
                  {{ getLibraryMeta(library.id).popularity }}
                </el-tag>
                <el-tag v-if="library.id === currentLibrary" size="small" type="success">
                  当前使用
                </el-tag>
              </div>
            </div>

            <div class="card-description">
              {{ getLibraryMeta(library.id).description }}
            </div>

            <div class="card-features">
              <div class="feature-summary">
                <span class="feature-count">
                  {{ Object.values(library.features).filter(Boolean).length }}/{{ Object.keys(library.features).length }} 特性
                </span>
                <div class="feature-icons">
                  <el-tooltip content="行合并" v-if="library.features.rowSpan">
                    <el-icon class="feature-icon supported"><Grid /></el-icon>
                  </el-tooltip>
                  <el-tooltip content="列合并" v-if="library.features.colSpan">
                    <el-icon class="feature-icon supported"><Grid /></el-icon>
                  </el-tooltip>
                  <el-tooltip content="自定义渲染" v-if="library.features.customRender">
                    <el-icon class="feature-icon supported"><Edit /></el-icon>
                  </el-tooltip>
                  <el-tooltip content="虚拟滚动" v-if="library.features.virtualScroll">
                    <el-icon class="feature-icon supported"><Rank /></el-icon>
                  </el-tooltip>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <el-button 
                size="small" 
                :type="library.id === currentLibrary ? 'success' : 'primary'"
                @click.stop="selectLibrary(library.id)"
              >
                {{ library.id === currentLibrary ? '已选中' : '选择' }}
              </el-button>
              <el-button 
                size="small" 
                type="text" 
                @click.stop="viewLibraryDocs(library)"
                :icon="Link"
              >
                文档
              </el-button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredLibraries.length === 0" class="empty-libraries">
          <el-empty description="没有找到匹配的UI库" :image-size="60" />
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showLibraryModal = false">取消</el-button>
          <el-button type="primary" @click="confirmSelection">确认选择</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 文档查看对话框 -->
    <el-dialog
      v-model="showDocModal"
      :title="`${selectedDocLibrary?.name} 文档`"
      width="600px"
    >
      <div class="documentation-content" v-if="selectedDocLibrary">
        <div class="doc-section">
          <h5>使用说明</h5>
          <ul class="doc-notes">
            <li v-for="note in selectedDocLibrary.documentation.notes" :key="note">
              {{ note }}
            </li>
          </ul>
        </div>

        <div class="doc-section" v-if="selectedDocLibrary.documentation.links.length > 0">
          <h5>相关链接</h5>
          <div class="doc-links">
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
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Setting, Grid, Document, Download, Search, Check, Close, 
  CopyDocument, Link, Edit, Rank 
} from '@element-plus/icons-vue'
import { uiLibraryManager, UI_LIBRARY_METADATA } from '../adapters/UILibraryManager.js'

export default {
  name: 'UILibrarySelector',
  components: {
    Setting, Grid, Document, Download, Search, Check, Close,
    CopyDocument, Link, Edit, Rank
  },
  props: {
    currentLibrary: {
      type: String,
      default: 'element-plus'
    }
  },
  emits: ['library-change'],
  setup(props, { emit }) {
    const showLibraryModal = ref(false)
    const showDocModal = ref(false)
    const showInstallInfo = ref(false)
    const searchKeyword = ref('')
    const popularityFilter = ref('')
    const selectedPackageManager = ref('npm')
    const selectedDocLibrary = ref(null)
    const tempSelectedLibrary = ref(props.currentLibrary)

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

    // 过滤后的UI库列表
    const filteredLibraries = computed(() => {
      let filtered = availableLibraries.value

      // 搜索过滤
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase()
        filtered = filtered.filter(lib => 
          lib.name.toLowerCase().includes(keyword) ||
          lib.id.toLowerCase().includes(keyword) ||
          getLibraryMeta(lib.id).description.toLowerCase().includes(keyword)
        )
      }

      // 热度过滤
      if (popularityFilter.value) {
        filtered = filtered.filter(lib => 
          getLibraryMeta(lib.id).popularity === popularityFilter.value
        )
      }

      return filtered
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

    // 选择UI库
    const selectLibrary = (libraryId) => {
      tempSelectedLibrary.value = libraryId
    }

    // 确认选择
    const confirmSelection = () => {
      if (tempSelectedLibrary.value !== props.currentLibrary) {
        try {
          uiLibraryManager.setCurrentAdapter(tempSelectedLibrary.value)
          emit('library-change', tempSelectedLibrary.value)
          ElMessage.success(`已切换到 ${getLibraryName(tempSelectedLibrary.value)}`)
        } catch (error) {
          ElMessage.error('切换UI库失败: ' + error.message)
        }
      }
      showLibraryModal.value = false
    }

    // 获取UI库名称
    const getLibraryName = (libraryId) => {
      const library = availableLibraries.value.find(lib => lib.id === libraryId)
      return library ? library.name : libraryId
    }

    // 处理对话框关闭
    const handleModalClose = () => {
      tempSelectedLibrary.value = props.currentLibrary
      showLibraryModal.value = false
    }

    // 查看文档
    const viewDocumentation = () => {
      const library = availableLibraries.value.find(lib => lib.id === props.currentLibrary)
      if (library) {
        selectedDocLibrary.value = library
        showDocModal.value = true
      }
    }

    // 查看特定库文档
    const viewLibraryDocs = (library) => {
      selectedDocLibrary.value = library
      showDocModal.value = true
    }

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
      tempSelectedLibrary.value = newLibrary
      if (uiLibraryManager.hasAdapter(newLibrary)) {
        uiLibraryManager.setCurrentAdapter(newLibrary)
      }
    })

    return {
      showLibraryModal,
      showDocModal,
      showInstallInfo,
      searchKeyword,
      popularityFilter,
      selectedPackageManager,
      selectedDocLibrary,
      tempSelectedLibrary,
      availableLibraries,
      currentLibraryInfo,
      currentLibraryMeta,
      filteredLibraries,
      installCommands,
      importStatements,
      getLibraryMeta,
      getFeatureName,
      getPopularityType,
      selectLibrary,
      confirmSelection,
      handleModalClose,
      viewDocumentation,
      viewLibraryDocs,
      copyInstallCommand
    }
  }
}
</script>

<style scoped>
.ui-library-selector {
  background: #ffffff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
}

/* 选择器头部 */
.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header-info {
  flex: 1;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.section-icon {
  font-size: 18px;
  color: #3b82f6;
}

.section-title {
  font-weight: 600;
  font-size: 15px;
  color: #111827;
}

.current-library {
  font-size: 13px;
  color: #6b7280;
}

.current-name {
  font-weight: 500;
  color: #3b82f6;
}

/* 当前库信息卡片 */
.current-library-card {
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  padding: 16px;
  background: #fafbfc;
}

.library-header {
  margin-bottom: 16px;
}

.library-basic {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.library-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.library-version {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.library-description {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

/* 特性展示 */
.library-features {
  margin-bottom: 16px;
}

.library-features h5 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.2s ease;
}

.feature-item.feature-supported {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.feature-item:not(.feature-supported) {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

/* 操作按钮 */
.library-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

/* 安装信息 */
.install-info {
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
  margin-top: 16px;
}

.install-commands h6,
.import-statements h6 {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.command-tabs {
  margin-bottom: 8px;
}

.command-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 16px;
}

.command-box code {
  flex: 1;
  font-family: monospace;
  font-size: 13px;
  color: #1e293b;
}

.import-statements {
  margin-top: 16px;
}

.import-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.import-item {
  padding: 6px 10px;
  background: #f1f5f9;
  border-radius: 4px;
}

.import-item code {
  font-family: monospace;
  font-size: 12px;
  color: #334155;
}

/* 库选择对话框 */
.library-selection {
  max-height: 600px;
  overflow-y: auto;
}

.selection-header {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}

.filter-options {
  flex-shrink: 0;
}

/* 库网格 */
.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.library-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;
}

.library-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.library-card.library-selected {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title h4 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.card-title .version {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.card-badges {
  display: flex;
  gap: 6px;
}

.card-description {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 12px;
}

.card-features {
  margin-bottom: 16px;
}

.feature-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.feature-count {
  font-size: 13px;
  color: #6b7280;
}

.feature-icons {
  display: flex;
  gap: 4px;
}

.feature-icon {
  font-size: 16px;
}

.feature-icon.supported {
  color: #16a34a;
}

.card-footer {
  display: flex;
  gap: 8px;
}

/* 空状态 */
.empty-libraries {
  text-align: center;
  padding: 40px 20px;
}

/* 文档内容 */
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
  .selector-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .library-basic {
    flex-wrap: wrap;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .library-grid {
    grid-template-columns: 1fr;
  }

  .selection-header {
    flex-direction: column;
    align-items: stretch;
  }

  .card-header {
    flex-direction: column;
    gap: 8px;
  }

  .feature-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>