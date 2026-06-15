<template>
  <div class="home-container">
    <div class="card secret-card">
      <div class="card-header">
        <span class="icon">💫</span>
        <h2>今日被宽恕的秘密</h2>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>正在寻找一段温暖的秘密...</p>
      </div>

      <div v-else-if="!hasSecret" class="empty-state">
        <span class="empty-icon">🌸</span>
        <p>{{ message }}</p>
        <button class="btn btn-primary" @click="goToConfess">
          分享第一个秘密
        </button>
      </div>

      <transition name="fade" v-else>
        <div class="secret-content" :key="secret?.id">
          <div class="secret-clickable" @click="goToDetail(secret.id)">
            <div class="secret-top-row">
              <span class="mood-tag" v-if="secret.mood">{{ moodIcon }} {{ secret.mood }}</span>
              <span class="light-hint">🕯️ {{ secret.lightCount || 0 }}</span>
            </div>
            <p class="secret-text">"{{ secret.content }}"</p>
            <div class="secret-footer">
              <span class="status-badge">{{ secret.status }}</span>
              <span class="detail-link">查看详情 →</span>
            </div>
          </div>
          <div class="refresh-row">
            <button class="btn btn-secondary refresh-btn" @click="fetchRandomSecret">
              🔄 换一个
            </button>
          </div>
        </div>
      </transition>

      <div class="card-actions">
        <button class="btn btn-primary" @click="goToConfess">
          我也想倾诉
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(true)
const hasSecret = ref(false)
const secret = ref(null)
const message = ref('')

const moodIconMap = {
  '愧疚': '😢', '孤独': '🌙', '焦虑': '😰', '遗憾': '🍂',
  '愤怒': '🔥', '嫉妒': '💚', '迷茫': '🌫️', '自责': '😔'
}

const moodIcon = computed(() => moodIconMap[secret.value?.mood] || '💫')

async function fetchRandomSecret() {
  loading.value = true
  try {
    const response = await fetch('/api/secrets/random')
    const data = await response.json()
    hasSecret.value = data.hasSecret
    secret.value = data.secret
    message.value = data.message
  } catch (error) {
    console.error('获取秘密失败:', error)
    hasSecret.value = false
    message.value = '暂时无法连接到服务器'
  } finally {
    loading.value = false
  }
}

function goToConfess() {
  router.push('/confess')
}

function goToDetail(id) {
  router.push(`/secret/${id}`)
}

onMounted(() => {
  fetchRandomSecret()
})
</script>

<style scoped>
.home-container {
  width: 100%;
  max-width: 600px;
}

.secret-card {
  animation: slideUp 0.6s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  text-align: center;
  margin-bottom: 30px;
}

.icon {
  font-size: 48px;
  display: block;
  margin-bottom: 10px;
}

.card-header h2 {
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(102, 126, 234, 0.3);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 20px;
}

.empty-state p {
  color: #666;
  font-size: 16px;
  margin-bottom: 30px;
}

.secret-content {
  padding: 20px 0;
}

.secret-clickable {
  cursor: pointer;
  border-radius: 16px;
  padding: 16px;
  margin: -16px;
  transition: all 0.3s ease;
}

.secret-clickable:hover {
  background: rgba(102, 126, 234, 0.05);
}

.secret-clickable:hover .detail-link {
  opacity: 1;
}

.secret-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.mood-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%);
  color: #4a3f6b;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.light-hint {
  font-size: 13px;
  color: #999;
}

.secret-text {
  font-size: 20px;
  line-height: 1.8;
  color: #333;
  font-style: italic;
  text-align: center;
  margin-bottom: 30px;
  padding: 0 10px;
}

.secret-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.status-badge {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  color: #2d5a4a;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.detail-link {
  font-size: 14px;
  color: #667eea;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.refresh-row {
  margin-top: 20px;
  text-align: center;
}

.refresh-btn {
  padding: 8px 20px;
  font-size: 14px;
}

.card-actions {
  margin-top: 40px;
  text-align: center;
  padding-top: 30px;
  border-top: 1px solid #eee;
}
</style>
