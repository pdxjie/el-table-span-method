<template>
  <div class="config-panel">
    <el-scrollbar class="config-scrollbar">
      <div class="panel-content">

        <!-- 数据导入区域 -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <el-icon class="section-icon"><Upload /></el-icon>
              <span>数据导入</span>
            </div>
          </div>

          <div class="import-section">
            <el-upload
              class="upload-area"
              drag
              :auto-upload="false"
              :on-change="handleFileChange"
              :show-file-list="false"
              :before-upload="beforeUpload"
              accept=".json,.csv,.xlsx,.xls"
              :loading="uploading"
            >
              <div class="upload-content">
                <el-icon class="upload-icon" v-if="!uploading">
                  <UploadFilled />
                </el-icon>
                <el-icon class="upload-icon loading" v-else>
                  <Loading />
                </el-icon>
                <div class="upload-text">
                  <p v-if="!uploading">拖拽文件到此处或<strong>点击选择</strong></p>
                  <p v-else>正在处理文件...</p>
                </div>
                <div class="upload-hint">
                  支持 JSON、CSV、Excel 格式
                </div>
              </div>
            </el-upload>

            <div class="divider">
              <span>或</span>
            </div>

            <el-button
              type="primary"
              @click="loadSampleData"
              size="default"
              class="sample-btn"
              :icon="Document"
            >
              使用示例数据
            </el-button>
          </div>
        </div>

        <!-- 表格信息 -->
        <div class="section-card" v-if="tableInfo.rows > 0">
          <div class="section-header">
            <div class="section-title">
              <el-icon class="section-icon"><InfoFilled /></el-icon>
              <span>表格信息</span>
            </div>
          </div>

          <div class="table-info">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">数据行数</span>
                <el-tag type="success" size="default">{{ tableInfo.rows }}</el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">字段数量</span>
                <el-tag type="info" size="default">{{ tableInfo.columns }}</el-tag>
              </div>
            </div>
            <div class="field-section">
              <span class="info-label">字段列表</span>
              <div class="field-tags">
                <el-tag
                  v-for="field in tableInfo.fields"
                  :key="field"
                  size="small"
                  class="field-tag"
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
            <div class="section-title">
              <el-icon class="section-icon"><Setting /></el-icon>
              <span>合并设置</span>
            </div>
          </div>

          <div class="merge-config">
            <el-form :model="config" label-position="top" size="default">

              <el-form-item label="合并类型">
                <el-radio-group v-model="config.mergeType" @change="handleConfigChange" class="merge-type-group">
                  <el-radio-button value="row">行合并</el-radio-button>
                  <el-radio-button value="column">列合并</el-radio-button>
                  <el-radio-button value="mixed">混合合并</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="选择合并列">
                <el-select
                  v-model="config.mergeColumns"
                  multiple
                  placeholder="请选择要合并的列"
                  style="width: 100%"
                  @change="handleConfigChange"
                  collapse-tags
                  collapse-tags-tooltip
                  :disabled="tableInfo.fields.length === 0"
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
                <el-radio-group v-model="config.mergeCondition" @change="handleConfigChange" class="condition-group">
                  <el-radio-button value="same">相同值合并</el-radio-button>
                  <el-radio-button value="custom">简单规则</el-radio-button>
                  <el-radio-button value="advanced">高级规则</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <!-- 简单自定义规则 -->
              <el-form-item v-if="config.mergeCondition === 'custom'" label="简单自定义规则">
                <el-input
                  v-model="config.customRule"
                  type="textarea"
                  :rows="3"
                  placeholder="例如: value1.toLowerCase() === value2.toLowerCase()"
                  @input="handleConfigChange"
                />
                <div class="rule-hint">
                  <el-text type="info" size="small">
                    <el-icon><InfoFilled /></el-icon>
                    编写 JavaScript 表达式，参数为 value1 和 value2
                  </el-text>
                </div>
              </el-form-item>

              <!-- 高级规则编辑器 -->
              <el-form-item v-if="config.mergeCondition === 'advanced'" label="高级自定义规则">
                <AdvancedRuleEditor
                  v-model="config.customRule"
                  :sample-data="sampleDataForRules"
                  @rule-change="handleAdvancedRuleChange"
                />
              </el-form-item>

              <el-form-item label="合并范围" v-if="tableInfo.rows > 0">
                <div class="range-controls">
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

        <!-- 显示设置 -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <el-icon class="section-icon"><View /></el-icon>
              <span>显示设置</span>
            </div>
          </div>

          <div class="display-settings">
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">显示表格边框</span>
                <span class="setting-desc">显示表格的边框线</span>
              </div>
              <el-switch v-model="config.showBorder" @change="handleConfigChange" />
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">斑马纹样式</span>
                <span class="setting-desc">交替显示行背景色</span>
              </div>
              <el-switch v-model="config.stripe" @change="handleConfigChange" />
            </div>
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
import AdvancedRuleEditor from './AdvancedRuleEditor.vue'

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
    ExcelHeaderSelector,
    AdvancedRuleEditor
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
        {
          name: '张三',
          department: '技术部',
          position: '工程师',
          salary: 8000,
          level: 'P5',
          email: 'zhangsan@company.com',
          phone: '13812345678',
          address: '北京市朝阳区',
          joinDate: '2020-01-15',
          manager: '李经理',
          project: '电商系统',
          skill: 'Vue.js'
        },
        {
          name: '李四',
          department: '技术部',
          position: '工程师',
          salary: 8500,
          level: 'P5',
          email: 'lisi@company.com',
          phone: '13912345678',
          address: '北京市海淀区',
          joinDate: '2020-03-20',
          manager: '李经理',
          project: '电商系统',
          skill: 'React.js'
        },
        {
          name: '王五',
          department: '技术部',
          position: '高级工程师',
          salary: 12000,
          level: 'P6',
          email: 'wangwu@company.com',
          phone: '13712345678',
          address: '北京市西城区',
          joinDate: '2019-06-10',
          manager: '李经理',
          project: '支付系统',
          skill: 'Node.js'
        },
        {
          name: '赵六',
          department: '市场部',
          position: '专员',
          salary: 6000,
          level: 'P4',
          email: 'zhaoliu@company.com',
          phone: '13612345678',
          address: '上海市浦东区',
          joinDate: '2021-02-08',
          manager: '王经理',
          project: '品牌推广',
          skill: '营销策划'
        },
        {
          name: '钱七',
          department: '市场部',
          position: '专员',
          salary: 6200,
          level: 'P4',
          email: 'qianqi@company.com',
          phone: '13512345678',
          address: '上海市黄浦区',
          joinDate: '2021-04-12',
          manager: '王经理',
          project: '品牌推广',
          skill: '数据分析'
        },
        {
          name: '孙八',
          department: '市场部',
          position: '经理',
          salary: 15000,
          level: 'P7',
          email: 'sunba@company.com',
          phone: '13412345678',
          address: '上海市静安区',
          joinDate: '2018-09-25',
          manager: '总监',
          project: '整体营销',
          skill: '团队管理'
        },
        {
          name: '周九',
          department: '人事部',
          position: '专员',
          salary: 5500,
          level: 'P4',
          email: 'zhoujiu@company.com',
          phone: '13312345678',
          address: '广州市天河区',
          joinDate: '2021-07-01',
          manager: '人事经理',
          project: '招聘管理',
          skill: '人事管理'
        },
        {
          name: '吴十',
          department: '人事部',
          position: '经理',
          salary: 13000,
          level: 'P7',
          email: 'wushi@company.com',
          phone: '13212345678',
          address: '广州市越秀区',
          joinDate: '2017-11-30',
          manager: '人事总监',
          project: '人才战略',
          skill: '人力资源'
        },
        {
          name: '郑一',
          department: '财务部',
          position: '会计',
          salary: 7000,
          level: 'P5',
          email: 'zhengyi@company.com',
          phone: '13112345678',
          address: '深圳市南山区',
          joinDate: '2020-05-18',
          manager: '财务经理',
          project: '财务核算',
          skill: '财务分析'
        },
        {
          name: '王二',
          department: '财务部',
          position: '会计',
          salary: 7200,
          level: 'P5',
          email: 'wanger@company.com',
          phone: '13012345678',
          address: '深圳市福田区',
          joinDate: '2020-08-22',
          manager: '财务经理',
          project: '财务核算',
          skill: '成本控制'
        }
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

    // 高级规则相关方法
    const sampleDataForRules = computed(() => {
      if (tableData.value.length === 0) return []
      
      // 提取前几行数据用于规则测试
      const sampleRows = tableData.value.slice(0, 5)
      const sampleValues = []
      
      // 从选中的合并列中提取样本值
      for (const column of config.mergeColumns) {
        for (const row of sampleRows) {
          if (row[column] !== undefined) {
            sampleValues.push(row[column])
          }
        }
      }
      
      return [...new Set(sampleValues)] // 去重
    })

    const handleAdvancedRuleChange = (ruleData) => {
      // 更新配置时的额外逻辑，比如验证结果提示
      if (ruleData.validation && !ruleData.validation.valid) {
        ElMessage.warning('规则语法有误，请检查')
      }
      
      // 触发配置变化
      handleConfigChange()
    }

    return {
      tableData,
      uploading,
      config,
      tableInfo,
      currentExcelData,
      showExcelHeaderSelector,
      sampleDataForRules,
      beforeUpload,
      handleFileChange,
      loadSampleData,
      handleConfigChange,
      handleAdvancedRuleChange,
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

.config-scrollbar {
  height: 100%;
}

.panel-content {
  padding: 20px;
}

/* 区块卡片样式 */
.section-card {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.2s ease;
}

.section-card:last-child {
  margin-bottom: 0;
}

.section-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

/* 区块标题样式 */
.section-header {
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
  color: #111827;
}

.section-icon {
  font-size: 18px;
  color: #3b82f6;
}

/* 数据导入区域 */
.import-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-area {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 120px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  background-color: #f9fafb;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

:deep(.el-upload-dragger:hover) {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.upload-icon {
  font-size: 32px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.upload-icon.loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.upload-text p {
  margin: 0;
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.upload-text strong {
  color: #3b82f6;
}

.upload-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.divider {
  text-align: center;
  position: relative;
  margin: 8px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #e5e7eb;
  z-index: 0;
}

.divider span {
  background-color: #ffffff;
  padding: 0 12px;
  color: #6b7280;
  font-size: 13px;
  position: relative;
  z-index: 1;
}

.sample-btn {
  width: 100%;
}

/* 表格信息样式 */
.table-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #f3f4f6;
}

.info-label {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.field-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.field-tag {
  background-color: #eff6ff;
  border-color: #dbeafe;
  color: #1e40af;
}

/* 表单样式优化 */
.merge-config :deep(.el-form-item) {
  margin-bottom: 20px;
}

.merge-config :deep(.el-form-item__label) {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 8px;
}

/* 单选按钮组样式 */
.merge-type-group,
.condition-group {
  display: flex;
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

:deep(.el-radio-button) {
  flex: 1;
}

:deep(.el-radio-button__inner) {
  width: 100%;
  border-radius: 0;
  border: none;
  border-right: 1px solid #e5e7eb;
  color: #374151;
  font-weight: 500;
  transition: all 0.2s ease;
  background: #ffffff;
}

:deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-left: none;
}

:deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-right: none;
}

:deep(.el-radio-button__inner:hover) {
  background-color: #f0f9ff;
  color: #3b82f6;
  z-index: 1;
  position: relative;
}

:deep(.el-radio-button.is-active .el-radio-button__inner) {
  background-color: #3b82f6;
  color: #ffffff;
  border-color: transparent;
  z-index: 2;
  position: relative;
}

/* 选择器样式 */
:deep(.el-select) {
  width: 100%;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 6px;
  border-color: #d1d5db;
  box-shadow: none;
  transition: all 0.2s ease;
}

:deep(.el-select .el-input__wrapper:hover) {
  border-color: #9ca3af;
}

:deep(.el-select .el-input__wrapper.is-focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 数字输入框样式 */
.range-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.range-controls .el-input-number {
  flex: 1;
}

.range-separator {
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  padding: 0 4px;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__wrapper) {
  border-radius: 6px;
  border: 1px solid #d1d5db;
  box-shadow: none;
  transition: all 0.2s ease;
}

:deep(.el-input-number .el-input__wrapper:hover) {
  border-color: #9ca3af;
}

:deep(.el-input-number .el-input__wrapper.is-focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 文本域样式 */
:deep(.el-textarea .el-textarea__inner) {
  border-radius: 6px;
  border-color: #d1d5db;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 13px;
  line-height: 1.5;
  transition: all 0.2s ease;
}

:deep(.el-textarea .el-textarea__inner:hover) {
  border-color: #9ca3af;
}

:deep(.el-textarea .el-textarea__inner:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 提示文本 */
.rule-hint {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 规则编辑器容器 */
.rule-editor-container {
  display: block;
  width: 100%;
}

.simple-editor {
  display: block;
  width: 100%;
}

.simple-editor .el-textarea {
  width: 100%;
}

/* 设置项样式 */
.display-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
  transition: all 0.2s ease;
}

.setting-item:hover {
  background: #f3f4f6;
  border-color: #e5e7eb;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-label {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.setting-desc {
  font-size: 12px;
  color: #6b7280;
}

/* 开关样式 */
:deep(.el-switch) {
  --el-switch-on-color: #3b82f6;
  --el-switch-off-color: #d1d5db;
}

/* 按钮样式 */
:deep(.el-button) {
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
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

/* 标签样式 */
:deep(.el-tag) {
  border-radius: 6px;
  border: none;
  font-weight: 500;
}

:deep(.el-tag--success) {
  background-color: #dcfce7;
  color: #166534;
}

:deep(.el-tag--info) {
  background-color: #f1f5f9;
  color: #475569;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .panel-content {
    padding: 16px;
  }

  .section-card {
    padding: 16px;
    margin-bottom: 12px;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .range-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .range-separator {
    text-align: center;
    margin: 8px 0;
  }

  :deep(.el-upload-dragger) {
    height: 100px;
  }

  .upload-icon {
    font-size: 28px;
    margin-bottom: 6px;
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
  background-color: #d1d5db;
  border-radius: 4px;
}

:deep(.el-scrollbar__thumb:hover) {
  background-color: #9ca3af;
}

/* 修复高级规则编辑器的布局问题 */
:deep(.el-form-item__content) {
  display: block !important;
  width: 100% !important;
}

/* 确保高级规则编辑器容器撑满宽度 */
:deep(.advanced-rule-editor) {
  width: 100% !important;
  max-width: 100% !important;
}
</style>