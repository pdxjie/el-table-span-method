<template>
  <div class="code-generator">
    <div class="generator-header">
      <div class="header-info">
        <h3 class="generator-title">代码生成器</h3>
        <span class="code-type-indicator">{{ codeType.toUpperCase() }}</span>
      </div>

      <div class="header-actions">
        <el-button-group class="code-type-group">
          <el-button
            :type="codeType === 'vue3' ? 'primary' : 'default'"
            @click="codeType = 'vue3'"
            size="small"
          >
            Vue 3
          </el-button>
          <el-button
            :type="codeType === 'vue2' ? 'primary' : 'default'"
            @click="codeType = 'vue2'"
            size="small"
          >
            Vue 2
          </el-button>
        </el-button-group>

        <div class="action-buttons">
          <el-button
            size="small"
            :icon="CopyDocument"
            @click="copyCode"
            type="default"
          >
            复制
          </el-button>
          <el-button
            size="small"
            :icon="Download"
            @click="downloadCode"
            type="default"
          >
            下载
          </el-button>
        </div>
      </div>
    </div>

    <div class="code-content">
      <div class="code-editor-wrapper">
        <div class="editor-toolbar">
          <div class="file-info">
            <el-icon class="file-icon"><Document /></el-icon>
            <span class="filename">{{ currentLibraryInfo.name.toLowerCase().replace(/\s+/g, '-') }}-table-{{ codeType }}.vue</span>
          </div>
          <div class="code-stats">
            <span class="lines-count">{{ codeLineCount }} 行</span>
          </div>
        </div>

        <div class="code-editor">
          <div
            ref="editorContainer"
            class="monaco-editor-container"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Document, CopyDocument, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as monaco from 'monaco-editor'
import { uiLibraryManager } from '../adapters/UILibraryManager.js'

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
    },
    isActive: {
      type: Boolean,
      default: false
    },
    currentLibrary: {
      type: String,
      default: 'element-plus'
    }
  },
  setup(props) {
    const codeType = ref('vue3')
    const editorContainer = ref(null)
    let monacoEditor = null

    // 当前UI库信息
    const currentLibraryInfo = computed(() => {
      const adapter = uiLibraryManager.getAdapter(props.currentLibrary)
      return adapter ? adapter.getInfo() : { name: 'Unknown' }
    })

    // 代码生成函数
    const generateFullCode = (config, type) => {
      try {
        const adapter = uiLibraryManager.getAdapter(props.currentLibrary)
        if (!adapter) {
          throw new Error(`未找到 ${props.currentLibrary} 的适配器`)
        }

        if (type === 'vue3') {
          return adapter.generateVue3Code(config)
        } else {
          return adapter.generateVue2Code(config)
        }
      } catch (error) {
        console.error('代码生成错误:', error)
        return `// 代码生成失败: ${error.message}\n// 请检查适配器配置`
      }
    }

    const displayCode = computed(() => {
      return generateFullCode(props.spanConfig, codeType.value)
    })

    const codeLineCount = computed(() => {
      return displayCode.value.split('\n').length
    })

    // 监听当前UI库变化，更新UI库管理器
    watch(() => props.currentLibrary, (newLibrary) => {
      if (uiLibraryManager.hasAdapter(newLibrary)) {
        uiLibraryManager.setCurrentAdapter(newLibrary)
      }
    }, { immediate: true })

    // 初始化 Monaco Editor
    const initMonacoEditor = async () => {
      if (!editorContainer.value) {
        console.warn('Editor container not found')
        return
      }

      // 检查容器是否可见
      const rect = editorContainer.value.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        console.warn('Editor container has zero dimensions, retrying...')
        // 等待更长时间再重试
        setTimeout(() => initMonacoEditor(), 500)
        return
      }

      // 配置 Monaco 环境
      if (typeof window !== 'undefined') {
        window.MonacoEnvironment = {
          getWorkerUrl: function (workerId, label) {
            const getWorkerUrl = (moduleUrl) => {
              return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
                self.MonacoEnvironment = {
                  baseUrl: '${new URL(moduleUrl, import.meta.url).origin}/'
                };
                importScripts('${moduleUrl}');
              `)}`
            }

            switch (label) {
              case 'json':
                return getWorkerUrl('/node_modules/monaco-editor/esm/vs/language/json/json.worker.js')
              case 'css':
                return getWorkerUrl('/node_modules/monaco-editor/esm/vs/language/css/css.worker.js')
              case 'html':
                return getWorkerUrl('/node_modules/monaco-editor/esm/vs/language/html/html.worker.js')
              case 'typescript':
              case 'javascript':
                return getWorkerUrl('/node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js')
              default:
                return getWorkerUrl('/node_modules/monaco-editor/esm/vs/editor/editor.worker.js')
            }
          }
        }
      }

      try {
        // 如果已经存在editor，先销毁
        if (monacoEditor) {
          monacoEditor.dispose()
          monacoEditor = null
        }

        monacoEditor = monaco.editor.create(editorContainer.value, {
          value: displayCode.value,
          language: 'javascript',
          theme: 'vs',
          fontSize: 13,
          fontFamily: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: true,
          automaticLayout: true,
          minimap: {
            enabled: false
          },
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            useShadows: false,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8
          },
          wordWrap: 'on',
          contextmenu: false,
          selectOnLineNumbers: true,
          glyphMargin: false,
          folding: true,
          renderLineHighlight: 'line',
          renderWhitespace: 'none',
          cursorBlinking: 'blink',
          cursorStyle: 'line',
          renderControlCharacters: false,
          renderIndentGuides: true,
          colorDecorators: true,
          bracketPairColorization: {
            enabled: true
          }
        })

        console.log('Monaco Editor created successfully')

        // 确保编辑器布局正确
        setTimeout(() => {
          if (monacoEditor) {
            monacoEditor.layout()
          }
        }, 100)

      } catch (error) {
        console.error('Monaco Editor 初始化失败:', error)
        ElMessage.error('代码编辑器初始化失败')
      }
    }

    // 重新初始化编辑器的方法
    const reinitEditor = async () => {
      if (!props.isActive) return // 只在激活状态下初始化

      await nextTick()
      setTimeout(() => {
        if (editorContainer.value && props.isActive) {
          initMonacoEditor()
        }
      }, 300)
    }

    onMounted(async () => {
      await nextTick()
      // 只在激活状态下初始化
      if (props.isActive) {
        setTimeout(() => {
          initMonacoEditor()
        }, 300)
      }
    })

    // 监听代码变化
    watch(displayCode, (newCode) => {
      if (monacoEditor && monacoEditor.getValue() !== newCode) {
        monacoEditor.setValue(newCode)
      }
    }, { immediate: true })

    // 监听tab激活状态
    watch(() => props.isActive, (isActive) => {
      if (isActive) {
        // 当标签激活时，重新初始化编辑器
        setTimeout(() => {
          reinitEditor()
        }, 100)
      }
    })

    // 监听代码类型变化，重新初始化编辑器
    watch(codeType, async () => {
      if (monacoEditor) {
        // 先更新代码内容
        monacoEditor.setValue(displayCode.value)
        // 确保布局正确
        setTimeout(() => {
          if (monacoEditor) {
            monacoEditor.layout()
          }
        }, 50)
      }
    })

    onBeforeUnmount(() => {
      if (monacoEditor) {
        monacoEditor.dispose()
        monacoEditor = null
      }
    })

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
      const filename = `${currentLibraryInfo.value.name.toLowerCase().replace(/\s+/g, '-')}-table-${codeType.value}.vue`
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      ElMessage.success('代码已下载')
    }

    return {
      codeType,
      displayCode,
      codeLineCount,
      editorContainer,
      copyCode,
      downloadCode,
      currentLibraryInfo
    }
  }
}
</script>

<style scoped>
.code-generator {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 200px);
}

/* 生成器头部 */
.generator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 16px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.generator-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.code-type-indicator {
  font-size: 12px;
  color: #3b82f6;
  background: #eff6ff;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.code-type-group {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 代码内容区域 */
.code-content {
  flex: 1;
  min-height: 0;
}

.code-editor-wrapper {
  height: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}

/* 编辑器工具栏 */
.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  flex-shrink: 0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  color: #6b7280;
  font-size: 16px;
}

.filename {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-weight: 500;
  color: #374151;
}

.code-stats {
  color: #6b7280;
  font-size: 12px;
}

.lines-count {
  padding: 2px 6px;
  background: #f3f4f6;
  border-radius: 4px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

/* 代码编辑器 */
.code-editor {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.monaco-editor-container {
  flex: 1;
  width: 100%;
  min-height: 200px;
  border-radius: 0;
  overflow: hidden;
}

/* Monaco Editor 全局样式覆盖 */
:deep(.monaco-editor) {
  background: #ffffff !important;
}

:deep(.monaco-editor .margin) {
  background: #fafbfc !important;
}

:deep(.monaco-editor .monaco-scrollable-element) {
  border-radius: 0;
}

:deep(.monaco-editor .view-lines) {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace !important;
  font-size: 13px !important;
  line-height: 1.6 !important;
}

/* 按钮样式 */
:deep(.el-button) {
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
}

:deep(.el-button-group) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-button-group .el-button) {
  border-radius: 0;
  margin-left: 0;
}

:deep(.el-button-group .el-button:first-child) {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

:deep(.el-button-group .el-button:last-child) {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
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
@media (max-width: 768px) {
  .generator-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding-bottom: 12px;
  }

  .header-actions {
    align-self: stretch;
    flex-direction: column;
    gap: 8px;
  }

  .code-type-group {
    align-self: stretch;
  }

  .code-type-group :deep(.el-button) {
    flex: 1;
  }

  .action-buttons {
    align-self: stretch;
  }

  .action-buttons .el-button {
    flex: 1;
  }

  .editor-toolbar {
    padding: 8px 12px;
  }

  .filename {
    font-size: 12px;
  }

  :deep(.monaco-editor .view-lines) {
    font-size: 12px !important;
  }
}

@media (max-width: 480px) {
  .generator-header {
    padding-bottom: 8px;
  }

  .header-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .generator-title {
    font-size: 15px;
  }

  .editor-toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 8px 12px;
  }

  :deep(.monaco-editor .view-lines) {
    font-size: 11px !important;
  }
}

/* Monaco Editor 滚动条优化 */
:deep(.monaco-scrollable-element .scrollbar) {
  background: transparent;
}

:deep(.monaco-scrollable-element .slider) {
  background: #d1d5db;
  border-radius: 4px;
}

:deep(.monaco-scrollable-element .slider:hover) {
  background: #9ca3af;
}

/* Monaco Editor 主题定制 */
:deep(.monaco-editor .current-line) {
  background: rgba(59, 130, 246, 0.05) !important;
  border: none !important;
}

:deep(.monaco-editor .line-numbers) {
  color: #9ca3af !important;
}

:deep(.monaco-editor .cursor) {
  color: #3b82f6 !important;
}
</style>