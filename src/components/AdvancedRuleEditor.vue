<template>
  <div class="advanced-rule-editor">
    <!-- 编辑器头部 -->
    <div class="editor-header">
      <div class="header-actions">
        <el-button size="small" style="display: flex;align-items: center;gap: 2px;" @click="showTemplates = !showTemplates">
          <el-icon><Document /></el-icon>
          <span>模板库</span>
        </el-button>
        <el-button size="small" style="display: flex;align-items: center;gap: 2px;" @click="showTester = !showTester">
          <el-icon><Setting /></el-icon>
          <span>测试器</span>
        </el-button>
        <el-button size="small" style="display: flex;align-items: center;gap: 2px;" @click="showHelp = !showHelp">
          <el-icon><QuestionFilled /></el-icon>
          <span>帮助</span>
        </el-button>
      </div>
    </div>

    <div class="editor-body">
      <!-- 快速操作栏 -->
      <div class="quick-actions">
        <div class="action-group">
          <span class="group-label">快速插入:</span>
          <el-button-group size="small">
            <el-button @click="insertText('value1')">value1</el-button>
            <el-button @click="insertText('value2')">value2</el-button>
            <el-button @click="insertText(' && ')">&&</el-button>
            <el-button @click="insertText(' || ')">||</el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 代码编辑器 -->
      <div class="code-editor-container">
        <div ref="editorRef" class="code-editor"></div>
      </div>

      <!-- 验证结果 -->
      <div v-if="validationResult" class="validation-result">
        <div v-if="!validationResult.valid" class="error-messages">
          <el-alert
            v-for="(error, index) in validationResult.errors"
            :key="index"
            :title="error"
            type="error"
            :closable="false"
            show-icon
          />
        </div>
        
        <div v-if="validationResult.warnings?.length" class="warning-messages">
          <el-alert
            v-for="(warning, index) in validationResult.warnings"
            :key="index"
            :title="warning"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>
        
        <div v-if="validationResult.valid" class="success-info">
          <div class="info-row">
            <span class="info-label">复杂度:</span>
            <el-tag :type="getComplexityType(validationResult.complexity)" size="small">
              {{ validationResult.complexity }}
            </el-tag>
            <span class="info-label" style="margin-left: 16px;">性能:</span>
            <el-tag :type="getPerformanceType(performanceStats.avgExecutionTime)" size="small">
              {{ performanceStats.avgExecutionTime.toFixed(2) }}ms
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 模板库抽屉 -->
    <el-drawer
      v-model="showTemplates"
      title="规则模板库"
      size="400px"
      direction="ltr"
    >
      <div class="template-content">
        <!-- 搜索框 -->
        <el-input
          v-model="templateSearch"
          placeholder="搜索模板..."
          class="template-search"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <!-- 分类标签 -->
        <div class="category-tabs">
          <el-tag
            v-for="(category, key) in categories"
            :key="key"
            :type="selectedCategory === key ? 'primary' : ''"
            @click="selectedCategory = key"
            class="category-tag"
            effect="plain"
          >
            {{ category.name }}
          </el-tag>
        </div>

        <!-- 模板列表 -->
        <div class="template-list">
          <div
            v-for="template in filteredTemplates"
            :key="template.id"
            class="template-item"
          >
            <div class="template-header">
              <span class="template-name">{{ template.name }}</span>
              <el-tag size="small" type="info">{{ getCategoryName(template.category) }}</el-tag>
            </div>
            <p class="template-description">{{ template.description }}</p>
            
            <!-- 代码预览 -->
            <div class="template-code">
              <pre><code>{{ template.template }}</code></pre>
            </div>
            
            <!-- 示例 -->
            <div v-if="template.examples" class="template-examples">
              <div class="example-label">示例:</div>
              <div 
                v-for="(example, index) in template.examples.slice(0, 2)"
                :key="index"
                class="example-item"
              >
                <span class="example-input">{{ formatExample(example.input) }}</span>
                <span class="example-arrow">→</span>
                <span class="example-output" :class="example.output ? 'success' : 'fail'">
                  {{ example.output ? '合并' : '不合并' }}
                </span>
              </div>
            </div>
            
            <div class="template-actions">
              <el-button size="small" type="primary" @click="applyTemplate(template)">
                使用模板
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 测试器抽屉 -->
    <el-drawer
      v-model="showTester"
      title="规则测试器"
      size="400px"
      direction="rtl"
    >
      <div class="tester-content">
        <!-- 单个测试 -->
        <div class="test-section">
          <h5>单个测试</h5>
          <div class="test-form">
            <div class="form-item">
              <label>值1:</label>
              <el-input v-model="singleTest.value1" placeholder="输入测试值1" size="small" />
            </div>
            <div class="form-item">
              <label>值2:</label>
              <el-input v-model="singleTest.value2" placeholder="输入测试值2" size="small" />
            </div>
            <div class="form-item">
              <el-button type="primary" @click="runSingleTest" :loading="testing" size="small">
                执行测试
              </el-button>
            </div>
          </div>

          <div v-if="singleTestResult" class="test-result">
            <div class="result-header">
              <span class="result-label">测试结果:</span>
              <el-tag :type="singleTestResult.success ? (singleTestResult.result ? 'success' : 'info') : 'danger'">
                {{ formatTestResult(singleTestResult) }}
              </el-tag>
            </div>
            
            <div v-if="singleTestResult.error" class="result-error">
              <el-alert :title="singleTestResult.error" type="error" :closable="false" />
            </div>
            
            <div v-if="singleTestResult.success" class="result-details">
              <div class="detail-item">
                <span>执行时间: {{ singleTestResult.executionTime.toFixed(2) }}ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 帮助对话框 -->
    <el-dialog v-model="showHelp" title="规则编写帮助" width="700px">
      <div class="help-content">
        <h4>可用变量</h4>
        <ul>
          <li><code>value1</code> - 第一个比较值</li>
          <li><code>value2</code> - 第二个比较值</li>
        </ul>

        <h4>内置函数</h4>
        <ul>
          <li><code>String(value)</code> - 转换为字符串</li>
          <li><code>Number(value)</code> - 转换为数字</li>
          <li><code>Math.*</code> - 数学函数</li>
          <li><code>new Date(value)</code> - 日期处理</li>
        </ul>

        <h4>常用示例</h4>
        <pre><code>// 忽略大小写比较
String(value1).toLowerCase() === String(value2).toLowerCase()

// 数值差值在范围内  
Math.abs(Number(value1) - Number(value2)) <= 10

// 包含关系
String(value1).includes(String(value2)) || String(value2).includes(String(value1))</code></pre>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { 
  Document, Setting, QuestionFilled, Search
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as monaco from 'monaco-editor'
import { 
  RULE_TEMPLATES,
  advancedRuleEngine,
  getAllRuleTemplates,
  getRuleTemplatesByCategory,
  searchRuleTemplates
} from '../utils/advancedRuleEngine.js'

// 配置 Monaco Editor 的 worker
self.MonacoEnvironment = {
  getWorkerUrl: function (moduleId, label) {
    if (label === 'json') {
      return './monaco-editor/esm/vs/language/json/json.worker.js'
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return './monaco-editor/esm/vs/language/css/css.worker.js'
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return './monaco-editor/esm/vs/language/html/html.worker.js'
    }
    if (label === 'typescript' || label === 'javascript') {
      return './monaco-editor/esm/vs/language/typescript/ts.worker.js'
    }
    return './monaco-editor/esm/vs/editor/editor.worker.js'
  }
}

export default {
  name: 'AdvancedRuleEditor',
  components: {
    Document,
    Setting, 
    QuestionFilled,
    Search
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    sampleData: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue', 'rule-change'],
  setup(props, { emit }) {
    const editorRef = ref(null)
    let monacoEditor = null
    
    // 编辑器状态
    const currentRule = ref(props.modelValue)
    const validationResult = ref(null)
    const performanceStats = ref({ avgExecutionTime: 0 })
    
    // UI 状态
    const showTemplates = ref(false)
    const showTester = ref(false)
    const showHelp = ref(false)
    
    // 模板相关
    const templateSearch = ref('')
    const selectedCategory = ref('all')
    const categories = ref({
      all: { name: '全部' },
      ...RULE_TEMPLATES
    })
    
    // 测试相关
    const testing = ref(false)
    const singleTest = ref({ value1: '', value2: '' })
    const singleTestResult = ref(null)
    
    // 计算属性
    const filteredTemplates = computed(() => {
      let templates = selectedCategory.value === 'all' 
        ? getAllRuleTemplates()
        : getRuleTemplatesByCategory(selectedCategory.value)
      
      if (templateSearch.value) {
        templates = searchRuleTemplates(templateSearch.value)
      }
      
      return templates
    })
    
    // 监听规则变化
    watch(currentRule, async (newRule) => {
      emit('update:modelValue', newRule)
      
      if (newRule) {
        // 验证规则
        validationResult.value = advancedRuleEngine.validateRule(newRule)
        
        // 获取性能统计
        performanceStats.value = advancedRuleEngine.getPerformanceStats()
        
        // 触发规则变化事件
        emit('rule-change', {
          rule: newRule,
          validation: validationResult.value,
          performance: performanceStats.value
        })
      } else {
        validationResult.value = null
      }
    }, { immediate: true })
    
    // 监听外部值变化
    watch(() => props.modelValue, (newValue) => {
      if (newValue !== currentRule.value) {
        currentRule.value = newValue
        if (monacoEditor) {
          monacoEditor.setValue(newValue || '')
        }
      }
    })
    
    // 初始化编辑器
    onMounted(async () => {
      await nextTick()
      initMonacoEditor()
    })
    
    onBeforeUnmount(() => {
      if (monacoEditor) {
        monacoEditor.dispose()
      }
    })
    
    const initMonacoEditor = () => {
      if (!editorRef.value) return
      
      try {
        // 配置 Monaco Editor
        monacoEditor = monaco.editor.create(editorRef.value, {
          value: currentRule.value || '',
          language: 'javascript',
          theme: 'vs',
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          minimap: { enabled: false },
          wordWrap: 'on',
          contextmenu: false
        })
        
        // 监听内容变化
        monacoEditor.onDidChangeModelContent(() => {
          const value = monacoEditor.getValue()
          currentRule.value = value
        })
      } catch (error) {
        console.warn('Monaco Editor 初始化失败，使用备用编辑器:', error)
        createFallbackEditor()
      }
    }
    
    const createFallbackEditor = () => {
      if (!editorRef.value) return
      
      // 清空容器
      editorRef.value.innerHTML = ''
      
      const textarea = document.createElement('textarea')
      textarea.value = currentRule.value || ''
      textarea.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        outline: none;
        resize: none;
        font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', monospace;
        font-size: 14px;
        padding: 12px;
        background: #fafafa;
        color: #333;
        line-height: 1.5;
        tab-size: 2;
        border-radius: 4px;
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
      `
      
      // 添加一些基本的代码编辑功能
      textarea.addEventListener('keydown', (e) => {
        // Tab 键插入两个空格
        if (e.key === 'Tab') {
          e.preventDefault()
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const value = textarea.value
          textarea.value = value.substring(0, start) + '  ' + value.substring(end)
          textarea.selectionStart = textarea.selectionEnd = start + 2
        }
      })
      
      textarea.addEventListener('input', (e) => {
        currentRule.value = e.target.value
      })
      
      editorRef.value.appendChild(textarea)
      
      // 设置焦点
      textarea.focus()
    }
    
    // 方法
    const insertText = (text) => {
      if (monacoEditor) {
        const selection = monacoEditor.getSelection()
        monacoEditor.executeEdits('', [{
          range: selection,
          text: text
        }])
        monacoEditor.focus()
      } else {
        // 如果是后备编辑器（textarea）
        const textarea = editorRef.value?.querySelector('textarea')
        if (textarea) {
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const value = textarea.value
          textarea.value = value.substring(0, start) + text + value.substring(end)
          textarea.selectionStart = textarea.selectionEnd = start + text.length
          textarea.focus()
          currentRule.value = textarea.value
        }
      }
    }
    
    const applyTemplate = (template) => {
      currentRule.value = template.template
      if (monacoEditor) {
        monacoEditor.setValue(template.template)
        monacoEditor.focus()
      } else {
        // 如果是后备编辑器（textarea）
        const textarea = editorRef.value?.querySelector('textarea')
        if (textarea) {
          textarea.value = template.template
          textarea.focus()
        }
      }
      showTemplates.value = false
      ElMessage.success(`已应用模板: ${template.name}`)
    }
    
    const runSingleTest = async () => {
      if (!currentRule.value) {
        ElMessage.warning('请先输入规则')
        return
      }
      
      testing.value = true
      try {
        singleTestResult.value = advancedRuleEngine.executeRule(
          currentRule.value,
          singleTest.value.value1,
          singleTest.value.value2
        )
      } catch (error) {
        ElMessage.error(`测试失败: ${error.message}`)
      } finally {
        testing.value = false
      }
    }
    
    // 辅助方法
    const getCategoryName = (categoryId) => {
      return categories.value[categoryId]?.name || categoryId
    }
    
    const formatExample = (input) => {
      return Array.isArray(input) ? input.join(' & ') : String(input)
    }
    
    const formatTestResult = (result) => {
      if (!result.success) return '错误'
      return result.result ? '合并' : '不合并'
    }
    
    const getComplexityType = (complexity) => {
      if (complexity <= 3) return 'success'
      if (complexity <= 7) return 'warning'
      return 'danger'
    }
    
    const getPerformanceType = (time) => {
      if (time <= 1) return 'success'
      if (time <= 5) return 'warning'
      return 'danger'
    }
    
    return {
      // 模板引用
      editorRef,
      
      // 数据
      currentRule,
      validationResult,
      performanceStats,
      
      // UI 状态
      showTemplates,
      showTester,
      showHelp,
      
      // 模板相关
      templateSearch,
      selectedCategory,
      categories,
      filteredTemplates,
      
      // 测试相关
      testing,
      singleTest,
      singleTestResult,
      
      // 方法
      insertText,
      applyTemplate,
      runSingleTest,
      getCategoryName,
      formatExample,
      formatTestResult,
      getComplexityType,
      getPerformanceType
    }
  }
}
</script>

<style scoped>
.advanced-rule-editor {
  display: flex;
  flex-direction: column;
  height: 500px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

.editor-header {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.editor-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.editor-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.quick-actions {
  display: flex;
  gap: 16px;
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #dcdfe6;
  flex-wrap: wrap;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-label {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.code-editor-container {
  flex: 1;
  min-height: 200px;
  position: relative;
}

.code-editor {
  width: 100%;
  height: 100%;
}

.validation-result {
  padding: 8px 12px;
  background: #f5f7fa;
  border-top: 1px solid #dcdfe6;
}

.error-messages,
.warning-messages {
  margin-bottom: 8px;
}

.error-messages :deep(.el-alert),
.warning-messages :deep(.el-alert) {
  margin-bottom: 4px;
}

.success-info {
  padding: 4px 0;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 12px;
  color: #909399;
}

/* 模板抽屉样式 */
.template-content {
  padding: 0;
}

.template-search {
  margin-bottom: 16px;
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.category-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.category-tag:hover {
  transform: translateY(-1px);
}

.template-list {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.template-item {
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  margin-bottom: 12px;
  background: #fff;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.template-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.template-description {
  color: #606266;
  font-size: 12px;
  margin: 8px 0;
  line-height: 1.4;
}

.template-code {
  margin: 8px 0;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
}

.template-code pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.template-code code {
  font-family: 'Monaco', 'Menlo', monospace;
  color: #e53e3e;
}

.template-examples {
  margin: 8px 0;
  padding: 6px;
  background: #f0f9ff;
  border-radius: 4px;
  font-size: 11px;
}

.example-label {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.example-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.example-input {
  background: #fff;
  padding: 1px 4px;
  border-radius: 2px;
  font-family: monospace;
  font-size: 11px;
}

.example-arrow {
  color: #909399;
}

.example-output.success {
  color: #67c23a;
  font-weight: 500;
}

.example-output.fail {
  color: #f56c6c;
  font-weight: 500;
}

.template-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

/* 测试器样式 */
.tester-content {
  padding: 0;
}

.test-section h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
}

.test-form {
  margin-bottom: 16px;
}

.form-item {
  margin-bottom: 12px;
}

.form-item label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #606266;
}

.test-result {
  margin-top: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.result-label {
  font-weight: 500;
  color: #303133;
  font-size: 12px;
}

.result-error {
  margin: 8px 0;
}

.result-details {
  margin-top: 8px;
  font-size: 11px;
  color: #909399;
}

.detail-item {
  margin-bottom: 4px;
}

/* 帮助对话框样式 */
.help-content {
  max-height: 60vh;
  overflow-y: auto;
}

.help-content h4 {
  margin-top: 16px;
  margin-bottom: 8px;
  color: #303133;
  font-size: 14px;
}

.help-content ul {
  margin-left: 16px;
  margin-bottom: 16px;
}

.help-content li {
  margin-bottom: 4px;
  color: #606266;
  font-size: 13px;
}

.help-content code {
  background: #f5f7fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 11px;
  color: #e53e3e;
}

.help-content pre {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
  font-size: 12px;
}

.help-content pre code {
  background: none;
  padding: 0;
  color: #303133;
}

/* 抽屉样式覆盖 */
:deep(.el-drawer__body) {
  padding: 20px;
}

/* 修复抽屉中输入框的边框问题 */
:deep(.el-drawer .el-input__wrapper) {
  border: 1px solid #dcdfe6 !important;
  border-radius: 4px !important;
  box-shadow: none !important;
}

:deep(.el-drawer .el-input__wrapper:hover) {
  border-color: #c0c4cc !important;
}

:deep(.el-drawer .el-input__wrapper.is-focus) {
  border-color: #409eff !important;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2) !important;
}

/* 修复搜索框的样式 */
:deep(.template-search .el-input__wrapper) {
  border: 1px solid #dcdfe6 !important;
  border-radius: 4px !important;
}

/* 修复测试器中输入框的样式 */
:deep(.tester-content .el-input__wrapper) {
  border: 1px solid #dcdfe6 !important;
  border-radius: 4px !important;
  background-color: #fff !important;
}

:deep(.tester-content .el-input__wrapper:hover) {
  border-color: #c0c4cc !important;
}

:deep(.tester-content .el-input__wrapper.is-focus) {
  border-color: #409eff !important;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2) !important;
}

/* 修复 Element Plus form-item 的 flex 布局问题 */
.advanced-rule-editor {
  width: 100% !important;
  max-width: 100% !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .advanced-rule-editor {
    height: 400px;
  }
  
  .quick-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .action-group {
    flex-wrap: wrap;
  }
  
  .template-item {
    padding: 8px;
  }
  
  .template-code {
    font-size: 10px;
  }
}
</style>