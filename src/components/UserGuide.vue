<template>
  <div v-if="showGuide" class="user-guide-overlay">
    <!-- 遮罩层 -->
    <div class="guide-backdrop" @click="handleBackdropClick"></div>
    
    <!-- 高亮目标元素 -->
    <div 
      v-if="currentStep && currentStep.target"
      class="guide-spotlight"
      :style="spotlightStyle"
    ></div>
    
    <!-- 聚光灯效果 -->
    <div 
      v-if="currentStep && currentStep.target"
      class="guide-spotlight-glow"
      :style="spotlightGlowStyle"
    ></div>
    
    <!-- 引导卡片 -->
    <div 
      class="guide-card"
      :style="cardStyle"
      :class="[`guide-card--${cardPosition}`, { 'guide-card--animate': showCard }]"
    >
      <!-- 箭头指示器 -->
      <div class="guide-arrow" :class="`guide-arrow--${arrowDirection}`"></div>
      
      <!-- 卡片内容 -->
      <div class="guide-content">
        <!-- 步骤指示器 -->
        <div class="guide-header">
          <div class="step-indicator">
            <span class="step-number">{{ currentStepIndex + 1 }}</span>
            <span class="step-total">/ {{ guideSteps.length }}</span>
          </div>
          <button class="guide-close" @click="closeGuide">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <!-- 主要内容 -->
        <div class="guide-body">
          <div class="guide-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path :d="currentStep?.icon || defaultIcon"/>
            </svg>
          </div>
          <h3 class="guide-title">{{ currentStep?.title }}</h3>
          <p class="guide-description">{{ currentStep?.description }}</p>
          
          <!-- 特殊提示 -->
          <div v-if="currentStep?.tip" class="guide-tip">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 22h20L12 2zm-1 8v6h2v-6h-2zm0 8v2h2v-2h-2z"/>
            </svg>
            <span>{{ currentStep.tip }}</span>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="guide-actions">
          <button 
            v-if="currentStepIndex > 0" 
            class="guide-btn guide-btn--secondary"
            @click="prevStep"
          >
            上一步
          </button>
          <button 
            class="guide-btn guide-btn--primary"
            @click="nextStep"
          >
            {{ isLastStep ? '完成引导' : '下一步' }}
          </button>
          <button 
            class="guide-btn guide-btn--text"
            @click="skipGuide"
          >
            跳过引导
          </button>
        </div>
        
        <!-- 进度条 -->
        <div class="guide-progress">
          <div 
            class="guide-progress-bar"
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'

export default {
  name: 'UserGuide',
  emits: ['close', 'complete', 'load-sample-data', 'switch-tab', 'reset-state'],
  setup(props, { emit }) {
    const showGuide = ref(false)
    const showCard = ref(false)
    const currentStepIndex = ref(0)
    const spotlightStyle = ref({})
    const spotlightGlowStyle = ref({})
    const cardStyle = ref({})
    const cardPosition = ref('bottom')
    const arrowDirection = ref('top')

    // 引导步骤配置
    const guideSteps = ref([
      {
        target: null,
        title: '欢迎使用 TableWiz！',
        description: '这是一个强大的表格合并工具，支持多种UI库和合并模式。让我来为您介绍主要功能。',
        icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
        tip: '整个引导过程大约需要1分钟',
        action: 'reset' // 重置到初始状态
      },
      {
        target: '.sidebar-header',
        title: 'UI库选择器',
        description: '首先选择您要使用的UI组件库。支持Element Plus、Ant Design Vue、Naive UI和Vuetify。',
        icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
        action: 'reset' // 确保在预览页面
      },
      {
        target: '.config-panel',
        title: '配置面板',
        description: '在这里导入您的数据，可以使用JSON、CSV或Excel文件。然后配置合并类型和列。',
        icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z',
        action: 'load-sample' // 加载示例数据
      },
      {
        target: '.el-tabs__item:first-child',
        title: '表格预览',
        description: '在预览标签页中可以实时查看表格合并效果，支持不同UI库的原生组件渲染。现在您可以看到示例数据的合并效果。',
        icon: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
        action: 'switch-preview' // 切换到预览页面
      },
      {
        target: '.tab-content-wrapper',
        title: '代码生成',
        description: '生成可直接使用的Vue代码，支持Vue2和Vue3语法，包含完整的合并逻辑。您可以直接复制使用这些代码。',
        icon: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
        action: 'switch-code' // 切换到代码页面
      },
      {
        target: null,
        title: '开始使用吧！',
        description: '现在您已经了解了TableWiz的主要功能。试试导入一些数据，配置合并规则，看看神奇的效果吧！',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        tip: '如需再次查看引导，请点击顶部的"新手引导"按钮',
        action: 'reset' // 重置到初始状态
      }
    ])

    const defaultIcon = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'

    const currentStep = computed(() => guideSteps.value[currentStepIndex.value])
    const isLastStep = computed(() => currentStepIndex.value >= guideSteps.value.length - 1)
    const progressPercentage = computed(() => 
      ((currentStepIndex.value + 1) / guideSteps.value.length) * 100
    )

    // 启动引导
    const startGuide = () => {
      showGuide.value = true
      nextTick(() => {
        showCard.value = true
        updateStepUI()
      })
    }

    // 下一步
    const nextStep = () => {
      if (isLastStep.value) {
        completeGuide()
      } else {
        // 添加过渡效果
        showCard.value = false
        setTimeout(() => {
          currentStepIndex.value++
          nextTick(() => {
            updateStepUI()
            showCard.value = true
          })
        }, 150)
      }
    }

    // 上一步
    const prevStep = () => {
      if (currentStepIndex.value > 0) {
        // 添加过渡效果
        showCard.value = false
        setTimeout(() => {
          currentStepIndex.value--
          nextTick(() => {
            updateStepUI()
            showCard.value = true
          })
        }, 150)
      }
    }

    // 跳过引导
    const skipGuide = () => {
      closeGuide()
    }

    // 关闭引导
    const closeGuide = () => {
      showCard.value = false
      setTimeout(() => {
        showGuide.value = false
        // 重置到初始状态
        emit('reset-state')
        emit('switch-tab', 'preview')
        emit('close')
      }, 300)
    }

    // 完成引导
    const completeGuide = () => {
      localStorage.setItem('table-wiz-guide-completed', 'true')
      showCard.value = false
      setTimeout(() => {
        showGuide.value = false
        // 重置到初始状态
        emit('reset-state')
        emit('switch-tab', 'preview')
        emit('complete')
      }, 300)
    }

    // 处理背景点击
    const handleBackdropClick = () => {
      // 可以选择是否允许点击背景关闭
      // closeGuide()
    }

    // 执行步骤动作
    const executeStepAction = (action) => {
      console.log('执行步骤动作:', action)
      
      switch (action) {
        case 'reset':
          emit('reset-state')
          emit('switch-tab', 'preview')
          break
        case 'load-sample':
          emit('load-sample-data')
          emit('switch-tab', 'preview')
          break
        case 'switch-preview':
          emit('switch-tab', 'preview')
          break
        case 'switch-code':
          emit('switch-tab', 'code')
          break
      }
    }

    // 更新步骤UI
    const updateStepUI = async () => {
      await nextTick()
      
      const step = currentStep.value
      console.log('更新步骤UI:', currentStepIndex.value, step)
      
      // 执行步骤动作
      if (step?.action) {
        executeStepAction(step.action)
        // 等待动作执行完成后再继续，给更多时间让组件更新
        await new Promise(resolve => setTimeout(resolve, 500))
        // 再次等待确保DOM更新完成
        await nextTick()
      }
      
      if (!step || !step.target) {
        // 没有目标元素的步骤（如欢迎页）
        cardPosition.value = 'center'
        arrowDirection.value = 'none'
        cardStyle.value = {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1002
        }
        spotlightStyle.value = {}
        return
      }

      // 等待目标元素渲染
      await nextTick()
      
      const targetElement = document.querySelector(step.target)
      if (!targetElement) {
        console.warn(`找不到目标元素: ${step.target}`)
        // 如果找不到目标元素，也显示在中央
        cardPosition.value = 'center'
        arrowDirection.value = 'none'
        cardStyle.value = {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1002
        }
        spotlightStyle.value = {}
        spotlightGlowStyle.value = {}
        return
      }

      const rect = targetElement.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      console.log('目标元素位置:', rect)

      // 设置高亮区域
      spotlightStyle.value = {
        position: 'fixed',
        top: Math.max(0, rect.top - 8) + 'px',
        left: Math.max(0, rect.left - 8) + 'px',
        width: rect.width + 16 + 'px',
        height: rect.height + 16 + 'px',
        borderRadius: '8px',
        border: '3px solid #3b82f6',
        pointerEvents: 'none',
        zIndex: 1001
      }

      // 设置聚光灯光晕效果
      spotlightGlowStyle.value = {
        position: 'fixed',
        top: Math.max(0, rect.top - 20) + 'px',
        left: Math.max(0, rect.left - 20) + 'px',
        width: rect.width + 40 + 'px',
        height: rect.height + 40 + 'px',
        borderRadius: '12px',
        pointerEvents: 'none',
        zIndex: 1000
      }

      // 计算卡片位置
      const cardWidth = 350
      const cardHeight = 320 // 增加高度以适应内容
      
      let cardTop, cardLeft, position, arrow

      // 优先在右侧显示
      if (rect.right + cardWidth + 20 <= viewportWidth) {
        cardLeft = rect.right + 20
        cardTop = Math.max(20, rect.top + rect.height / 2 - cardHeight / 2)
        position = 'right'
        arrow = 'left'
      }
      // 其次在左侧
      else if (rect.left - cardWidth - 20 >= 0) {
        cardLeft = rect.left - cardWidth - 20
        cardTop = Math.max(20, rect.top + rect.height / 2 - cardHeight / 2)
        position = 'left'
        arrow = 'right'
      }
      // 在下方
      else if (rect.bottom + cardHeight + 20 <= viewportHeight) {
        cardLeft = Math.max(20, rect.left + rect.width / 2 - cardWidth / 2)
        cardTop = rect.bottom + 20
        position = 'bottom'
        arrow = 'top'
      }
      // 在上方
      else {
        cardLeft = Math.max(20, rect.left + rect.width / 2 - cardWidth / 2)
        cardTop = Math.max(20, rect.top - cardHeight - 20)
        position = 'top'
        arrow = 'bottom'
      }

      // 确保卡片在视口内
      cardLeft = Math.max(20, Math.min(cardLeft, viewportWidth - cardWidth - 20))
      cardTop = Math.max(20, Math.min(cardTop, viewportHeight - cardHeight - 20))

      cardPosition.value = position
      arrowDirection.value = arrow
      cardStyle.value = {
        position: 'fixed',
        top: cardTop + 'px',
        left: cardLeft + 'px',
        zIndex: 1002
      }

      console.log('卡片样式:', cardStyle.value)
    }

    // 检查是否应该显示引导
    const checkShouldShowGuide = () => {
      const completed = localStorage.getItem('table-wiz-guide-completed')
      if (!completed) {
        setTimeout(() => {
          startGuide()
        }, 1000) // 延迟1秒显示
      }
    }

    // 窗口大小改变时重新计算位置
    const handleResize = () => {
      if (showGuide.value) {
        updateStepUI()
      }
    }

    onMounted(() => {
      checkShouldShowGuide()
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })

    return {
      showGuide,
      showCard,
      currentStepIndex,
      guideSteps,
      currentStep,
      isLastStep,
      progressPercentage,
      spotlightStyle,
      spotlightGlowStyle,
      cardStyle,
      cardPosition,
      arrowDirection,
      defaultIcon,
      startGuide,
      nextStep,
      prevStep,
      skipGuide,
      closeGuide,
      handleBackdropClick
    }
  }
}
</script>

<style scoped>
/* 引导遮罩层 */
.user-guide-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  pointer-events: auto;
}

.guide-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(1px);
}

/* 高亮聚光灯 */
.guide-spotlight {
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  animation: pulse-border 2s ease-in-out infinite;
  backdrop-filter: blur(0px);
}

/* 聚光灯光晕效果 */
.guide-spotlight-glow {
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.08) 30%,
    transparent 70%
  );
  transition: all 0.3s ease;
  animation: glow-pulse 3s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.02);
  }
}

@keyframes pulse-border {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.1);
    border-color: #3b82f6;
  }
  50% {
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.2);
    border-color: #2563eb;
  }
}

/* 引导卡片 */
.guide-card {
  position: fixed;
  width: 350px;
  background: white;
  border-radius: 16px;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  z-index: 1002;
  transform: scale(0.8) translateY(20px);
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 90vh;
  overflow: hidden;
}

.guide-card--animate {
  transform: scale(1) translateY(0);
  opacity: 1;
}

.guide-card--center {
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.8);
}

/* 箭头指示器 */
.guide-arrow {
  position: absolute;
  width: 12px;
  height: 12px;
  background: white;
  transform: rotate(45deg);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.guide-arrow--top {
  top: -6px;
  left: 50%;
  margin-left: -6px;
  border-bottom: none;
  border-right: none;
}

.guide-arrow--bottom {
  bottom: -6px;
  left: 50%;
  margin-left: -6px;
  border-top: none;
  border-left: none;
}

.guide-arrow--left {
  left: -6px;
  top: 50%;
  margin-top: -6px;
  border-top: none;
  border-right: none;
}

.guide-arrow--right {
  right: -6px;
  top: 50%;
  margin-top: -6px;
  border-bottom: none;
  border-left: none;
}

.guide-arrow--none {
  display: none;
}

/* 卡片内容 */
.guide-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-height: 280px;
}

.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

.guide-close {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
}

.guide-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #374151;
}

.guide-body {
  text-align: center;
  margin-bottom: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.guide-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border-radius: 12px;
  margin: 0 auto 16px;
}

.guide-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.guide-description {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 16px 0;
}

.guide-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  font-size: 13px;
  color: #92400e;
}

.guide-tip svg {
  flex-shrink: 0;
}

/* 操作按钮 */
.guide-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.guide-btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.guide-btn--primary {
  background: #3b82f6;
  color: white;
}

.guide-btn--primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.guide-btn--secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.guide-btn--secondary:hover {
  background: #e5e7eb;
}

.guide-btn--text {
  background: transparent;
  color: #6b7280;
  font-size: 13px;
}

.guide-btn--text:hover {
  color: #374151;
}

/* 进度条 */
.guide-progress {
  height: 4px;
  background: #f3f4f6;
  border-radius: 2px;
  overflow: hidden;
  flex-shrink: 0;
}

.guide-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .guide-card {
    width: calc(100vw - 32px);
    max-width: 350px;
  }
  
  .guide-content {
    padding: 20px;
  }
  
  .guide-actions {
    flex-direction: column;
  }
  
  .guide-btn {
    margin: 0;
  }
}
</style>