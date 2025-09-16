<template>
  <div class="config-panel">
    <el-scrollbar height="100%">
      <div class="panel-content">
        <!-- 数据导入区域 -->
        <div class="section-card">
          <div class="section-header">
            <el-icon><Upload /></el-icon>
            <span>数据导入</span>
          </div>
          
          <div class="import-section">
            <el-upload
              class="upload-demo"
              drag
              :auto-upload="false"
              :on-change="handleFileChange"
              :show-file-list="false"
              :before-upload="beforeUpload"
              accept=".json,.csv,.xlsx,.xls"
              :loading="uploading"
            >
              <el-icon class="el-icon--upload" v-if="!uploading"><upload-filled /></el-icon>
              <el-icon class="el-icon--loading" v-else><Loading /></el-icon>
              <div class="el-upload__text" v-if="!uploading">
                拖拽文件到此处或<em>点击上传</em>
              </div>
              <div class="el-upload__text" v-else>
                正在处理文件...
              </div>
              <div class="el-upload__tip">
                支持 JSON、CSV、Excel (.xlsx/.xls) 格式
              </div>
            </el-upload>
            
            <el-divider>或</el-divider>
            
            <el-button type="primary" @click="loadSampleData" size="default" block>
              <el-icon><Document /></el-icon>
              加载示例数据
            </el-button>
          </div>
        </div>

        <!-- 表格信息 -->
        <div class="section-card" v-if="tableInfo.rows > 0">
          <div class="section-header">
            <el-icon><InfoFilled /></el-icon>
            <span>表格信息</span>
          </div>
          
          <div class="table-info">
            <div class="info-item">
              <span class="label">数据行数:</span>
              <el-tag type="success">{{ tableInfo.rows }}</el-tag>
            </div>
            <div class="info-item">
              <span class="label">字段数量:</span>
              <el-tag type="info">{{ tableInfo.columns }}</el-tag>
            </div>
            <div class="info-item">
              <span class="label">字段列表:</span>
              <div class="field-tags">
                <el-tag 
                  v-for="field in tableInfo.fields" 
                  :key="field" 
                  size="small"
                  style="margin: 2px;"
                >
                  {{ field }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 合并配置 -->
        <div class="section-card">
          <div class="section-header">
            <el-icon><Setting /></el-icon>
            <span>合并配置</span>
          </div>
          
          <div class="merge-config">
            <el-form :model="config" label-width="80px" size="default">
              <el-form-item label="合并类型">
                <el-radio-group v-model="config.mergeType" @change="handleConfigChange">
                  <el-radio value="row">行合并</el-radio>
                  <el-radio value="column">列合并</el-radio>
                  <el-radio value="mixed">混合合并</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item label="合并列">
                <el-select
                  v-model="config.mergeColumns"
                  multiple
                  placeholder="选择要合并的列"
                  style="width: 100%"
                  @change="handleConfigChange"
                  collapse-tags
                  collapse-tags-tooltip
                >
                  <el-option
                    v-for="field in tableInfo.fields"
                    :key="field"
                    :label="field"
                    :value="field"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="合并条件">
                <el-radio-group v-model="config.mergeCondition" @change="handleConfigChange">
                  <el-radio value="same">相同值合并</el-radio>
                  <el-radio value="custom">自定义规则</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item v-if="config.mergeCondition === 'custom'" label="自定义规则">
                <el-input
                  v-model="config.customRule"
                  type="textarea"
                  :rows="3"
                  placeholder="例如: value1.toLowerCase() === value2.toLowerCase()"
                  @input="handleConfigChange"
                />
                <div class="rule-hint">
                  <el-text type="info" size="small">
                    编写 JavaScript 表达式，参数为 value1 和 value2
                  </el-text>
                </div>
              </el-form-item>
              
              <el-form-item label="合并范围" v-if="tableInfo.rows > 0">
                <div class="range-inputs">
                  <el-input-number 
                    v-model="config.startRow" 
                    :min="0" 
                    :max="Math.max(0, tableInfo.rows - 1)"
                    placeholder="起始行"
                    size="default"
                    controls-position="right"
                    @change="handleConfigChange"
                  />
                  <span class="range-separator">至</span>
                  <el-input-number 
                    v-model="config.endRow" 
                    :min="config.startRow || 0" 
                    :max="Math.max(config.startRow || 0, tableInfo.rows - 1)"
                    placeholder="结束行"
                    size="default"
                    controls-position="right"
                    @change="handleConfigChange"
                  />
                </div>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 预览设置 -->
        <div class="section-card">
          <div class="section-header">
            <el-icon><View /></el-icon>
            <span>预览设置</span>
          </div>
          
          <div class="preview-settings">
            <el-form size="default">
              <el-form-item>
                <div class="setting-item">
                  <span class="setting-label">显示边框</span>
                  <el-switch v-model="config.showBorder" @change="handleConfigChange" />
                </div>
              </el-form-item>
              
              <el-form-item>
                <div class="setting-item">
                  <span class="setting-label">斑马纹</span>
                  <el-switch v-model="config.stripe" @change="handleConfigChange" />
                </div>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </el-scrollbar>
    
    <!-- Excel 表头选择对话框 -->
    <ExcelHeaderSelector
      v-model="showExcelHeaderSelector"
      :excel-data="currentExcelData || {}"
      @confirm="handleExcelHeaderConfirm"
      @cancel="handleExcelHeaderCancel"
    />
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import { Upload, UploadFilled, InfoFilled, Setting, View, Loading, Document } from '@element-plus/icons-vue'
import { ElMessage, ElNotification } from 'element-plus'
import { fileProcessor } from '@/utils/fileProcessor.js'
import ExcelHeaderSelector from './ExcelHeaderSelector.vue'

export default {
  name: 'ConfigPanel',
  components: {
    Upload,
    UploadFilled,
    InfoFilled,
    Setting,
    View,
    Loading,
    Document,
    ExcelHeaderSelector
  },
  emits: ['data-change', 'config-change'],
  setup(props, { emit }) {
    const tableData = ref([])
    const uploading = ref(false)
    const config = reactive({
      mergeType: 'row',
      mergeColumns: [],
      mergeCondition: 'same',
      customRule: '',
      startRow: 0,
      endRow: null,
      showBorder: true,
      stripe: true
    })

    const tableInfo = computed(() => {
      if (tableData.value.length === 0) {
        return { rows: 0, columns: 0, fields: [] }
      }
      
      const fields = Object.keys(tableData.value[0])
      return {
        rows: tableData.value.length,
        columns: fields.length,
        fields
      }
    })

    const beforeUpload = (file) => {
      // 文件类型检查
      if (!fileProcessor.isSupported(file)) {
        ElMessage.error('不支持的文件格式，请上传 JSON、CSV 或 Excel 文件')
        return false
      }
      
      // 文件大小检查 (最大 10MB)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        ElMessage.error('文件大小不能超过 10MB')
        return false
      }
      
      return true
    }

    const handleFileChange = async (file) => {
      if (!beforeUpload(file.raw)) {
        return
      }
      
      uploading.value = true
      
      try {
        // 显示文件信息
        const fileInfo = fileProcessor.getFileInfo(file.raw)
        ElNotification({
          title: '正在处理文件',
          message: `文件: ${fileInfo.name} (${fileInfo.sizeText})`,
          type: 'info',
          duration: 2000
        })
        
        // 使用 setTimeout 让 UI 有时间更新
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // 判断文件类型，对 Excel 使用增强解析
        if (fileInfo.fileType === 'excel') {
          const excelResult = await fileProcessor.processExcelFile(file.raw, {
            maxRows: 100, // Excel 预览更多行用于表头分析
            maxSize: 10 * 1024 * 1024
          })
          
          // 如果只有一个明确的建议选项，直接使用
          if (excelResult.parseOptions.length === 1 || 
              (excelResult.parseOptions.filter(opt => opt.type === 'suggested').length === 1)) {
            const bestOption = excelResult.parseOptions.find(opt => opt.type === 'suggested') || excelResult.parseOptions[0]
            const data = fileProcessor.parseWithSelectedOption(excelResult, bestOption)
            
            if (data && data.length > 0) {
              processImportedData(data, fileInfo)
            }
          } else {
            // 需要用户选择表头
            currentExcelData.value = excelResult
            showExcelHeaderSelector.value = true
          }
        } else {
          // 非 Excel 文件使用原有处理方式
          const data = await fileProcessor.processFile(file.raw, {
            maxRows: 5000,
            maxSize: 10 * 1024 * 1024
          })
          
          if (data && data.length > 0) {
            processImportedData(data, fileInfo)
          }
        }
        
      } catch (error) {
        console.error('文件处理错误:', error)
        ElNotification({
          title: '文件处理失败',
          message: error.message || '文件格式不正确或文件损坏',
          type: 'error',
          duration: 5000
        })
      } finally {
        uploading.value = false
      }
    }

    // 处理导入的数据（提取公共逻辑）
    const processImportedData = (data, fileInfo) => {
      tableData.value = data
      config.endRow = data.length - 1
      config.startRow = 0
      
      // 清空之前的合并列配置
      config.mergeColumns = []
      
      emit('data-change', data)
      handleConfigChange()
      
      ElNotification({
        title: '文件导入成功',
        message: `成功导入 ${data.length} 行数据，${Object.keys(data[0]).length} 个字段`,
        type: 'success',
        duration: 3000
      })
    }

    // Excel 表头选择相关
    const currentExcelData = ref(null)
    const showExcelHeaderSelector = ref(false)

    const handleExcelHeaderConfirm = ({ option }) => {
      try {
        const data = fileProcessor.parseWithSelectedOption(currentExcelData.value, option)
        
        if (data && data.length > 0) {
          const fileInfo = { name: 'Excel文件' } // 简化文件信息
          processImportedData(data, fileInfo)
        }
        
        showExcelHeaderSelector.value = false
        currentExcelData.value = null
      } catch (error) {
        ElMessage.error('数据解析失败: ' + error.message)
      }
    }

    const handleExcelHeaderCancel = () => {
      showExcelHeaderSelector.value = false
      currentExcelData.value = null
    }

    const loadSampleData = () => {
      const sampleData = [
        { name: '张三', department: '技术部', position: '工程师', salary: 8000, level: 'P5' },
        { name: '李四', department: '技术部', position: '工程师', salary: 8500, level: 'P5' },
        { name: '王五', department: '技术部', position: '高级工程师', salary: 12000, level: 'P6' },
        { name: '赵六', department: '市场部', position: '专员', salary: 6000, level: 'P4' },
        { name: '钱七', department: '市场部', position: '专员', salary: 6200, level: 'P4' },
        { name: '孙八', department: '市场部', position: '经理', salary: 15000, level: 'P7' },
        { name: '周九', department: '人事部', position: '专员', salary: 5500, level: 'P4' },
        { name: '吴十', department: '人事部', position: '经理', salary: 13000, level: 'P7' },
        { name: '郑一', department: '财务部', position: '会计', salary: 7000, level: 'P5' },
        { name: '王二', department: '财务部', position: '会计', salary: 7200, level: 'P5' }
      ]
      
      tableData.value = sampleData
      config.endRow = sampleData.length - 1
      config.startRow = 0
      config.mergeColumns = ['department']
      
      emit('data-change', sampleData)
      handleConfigChange()
      
      ElMessage.success('示例数据加载成功')
    }

    const handleConfigChange = () => {
      emit('config-change', { ...config })
    }

    return {
      tableData,
      uploading,
      config,
      tableInfo,
      currentExcelData,
      showExcelHeaderSelector,
      beforeUpload,
      handleFileChange,
      loadSampleData,
      handleConfigChange,
      handleExcelHeaderConfirm,
      handleExcelHeaderCancel
    }
  }
}
</script>

<style scoped>
.config-panel {
  height: 100%;
  background: transparent;
}

.panel-content {
  padding: 28px;
}

/* 区块卡片样式 */
.section-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.section-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.section-card:last-child {
  margin-bottom: 0;
}

/* 区块标题样式 */
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  font-size: 16px;
  color: #1e293b;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.1);
  position: relative;
}

.section-header::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 32px;
  height: 2px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 1px;
}

.section-header .el-icon {
  font-size: 18px;
  color: #667eea;
}

/* 数据导入区域 */
.import-section {
  text-align: center;
}

.upload-demo {
  width: 100%;
  margin-bottom: 20px;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 140px;
  border: 2px dashed rgba(102, 126, 234, 0.3);
  border-radius: 12px;
  background: rgba(102, 126, 234, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.upload-demo::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
  transition: left 0.6s ease;
}

:deep(.el-upload-dragger:hover) {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

.upload-demo:hover::before {
  left: 100%;
}

:deep(.el-upload-dragger .el-icon) {
  font-size: 40px;
  color: #94a3b8;
  margin-bottom: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-upload-dragger:hover .el-icon) {
  color: #667eea;
  transform: scale(1.05);
}

:deep(.el-upload-dragger .el-upload__text) {
  color: #475569;
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 6px;
}

:deep(.el-upload-dragger .el-upload__tip) {
  color: #64748b;
  font-size: 13px;
}

:deep(.el-divider) {
  margin: 16px 0;
  border-color: #dee2e6;
}

:deep(.el-divider__text) {
  background: white;
  color: #6c757d;
  font-size: 12px;
  font-weight: 400;
}

/* 表格信息样式 */
.table-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(102, 126, 234, 0.08);
  border-radius: 10px;
  border-left: 4px solid #667eea;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.info-item:hover {
  background: rgba(102, 126, 234, 0.12);
  transform: translateX(2px);
}

.info-item .label {
  font-weight: 600;
  color: #334155;
  min-width: 80px;
  flex-shrink: 0;
  font-size: 14px;
}

.field-tags {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

:deep(.el-tag) {
  border-radius: 6px;
  border: none;
  font-weight: 500;
}

/* 表单样式优化 */
.merge-config .el-form-item {
  margin-bottom: 24px;
}

.preview-settings .el-form-item {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  line-height: 1.6;
}

:deep(.el-radio-group) {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

:deep(.el-radio) {
  margin-right: 0;
  padding: 14px 18px;
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-radio:hover) {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.08);
  transform: translateY(-1px);
}

:deep(.el-radio.is-checked) {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.15);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

:deep(.el-radio__label) {
  font-weight: 500;
  color: #334155;
}

/* 选择器样式 */
:deep(.el-select) {
  width: 100%;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 4px;
  border: 1px solid #ced4da;
  box-shadow: none;
}

:deep(.el-select .el-input__wrapper:hover) {
  border-color: #007bff;
}

:deep(.el-select .el-input__wrapper.is-focus) {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

/* 数字输入框样式 */
.range-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.range-inputs .el-input-number {
  flex: 1;
}

.range-separator {
  color: #8c8c8c;
  font-size: 14px;
  font-weight: 500;
  padding: 0 4px;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__wrapper) {
  border-radius: 4px;
  border: 1px solid #ced4da;
  background: white;
}

:deep(.el-input-number .el-input__wrapper:hover) {
  border-color: #007bff;
}

:deep(.el-input-number .el-input__wrapper.is-focus) {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

:deep(.el-input-number .el-input__inner) {
  text-align: center;
  font-weight: 400;
  color: #495057;
}

:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  border: none;
  background: transparent;
  color: #6c757d;
}

:deep(.el-input-number__decrease:hover),
:deep(.el-input-number__increase:hover) {
  color: #007bff;
  background: rgba(0, 123, 255, 0.1);
}

/* 文本域样式 */
:deep(.el-textarea .el-textarea__inner) {
  border-radius: 4px;
  border: 1px solid #ced4da;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 12px;
  line-height: 1.5;
}

:deep(.el-textarea .el-textarea__inner:hover) {
  border-color: #007bff;
}

:deep(.el-textarea .el-textarea__inner:focus) {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

/* 提示文本 */
.rule-hint {
  margin-top: 6px;
  padding: 6px 8px;
  background: #e7f1ff;
  border-radius: 4px;
  border-left: 2px solid #007bff;
}

/* 设置项样式 */
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  border: 1px solid rgba(102, 126, 234, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.setting-item:hover {
  background: rgba(102, 126, 234, 0.08);
  border-color: rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

.setting-label {
  font-weight: 500;
  color: #334155;
  font-size: 14px;
}

/* 按钮样式 */
:deep(.el-button) {
  font-weight: 500;
  border-radius: 10px;
  padding: 12px 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
}

/* 开关样式 */
:deep(.el-switch) {
  --el-switch-on-color: #667eea;
  --el-switch-off-color: #cbd5e1;
}

:deep(.el-switch .el-switch__core) {
  border-radius: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .panel-content {
    padding: 16px;
  }
  
  .section-card {
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .section-header {
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  .panel-content {
    padding: 12px;
  }
  
  .section-card {
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .section-header {
    font-size: 16px;
    gap: 8px;
  }
  
  .range-inputs {
    flex-direction: column;
    align-items: stretch;
  }
  
  .range-separator {
    text-align: center;
    margin: 8px 0;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .info-item .label {
    min-width: auto;
  }
  
  :deep(.el-upload-dragger) {
    height: 140px;
  }
  
  :deep(.el-radio) {
    padding: 10px 12px;
  }
}

/* 滚动条优化 */
:deep(.el-scrollbar__bar) {
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

:deep(.el-scrollbar:hover .el-scrollbar__bar) {
  opacity: 0.8;
}

:deep(.el-scrollbar__thumb) {
  background-color: #c1c1c1;
  border-radius: 4px;
}

:deep(.el-scrollbar__thumb:hover) {
  background-color: #a8a8a8;
}

/* 加载状态 */
:deep(.el-loading-mask) {
  border-radius: 12px;
}

</style>