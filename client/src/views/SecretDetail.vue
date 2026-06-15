<template>
  <div class="detail-container">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>正在加载秘密...</p>
    </div>

    <div v-else-if="error" class="error-state card">
      <span class="error-icon">😢</span>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="goHome">回到首页</button>
    </div>

    <template v-else>
      <div class="card detail-card">
        <button class="back-btn" @click="goBack">← 返回</button>

        <div class="detail-body">
          <div class="mood-tag" v-if="secret.mood">
            <span class="mood-icon">{{ moodIcon }}</span>
            {{ secret.mood }}
          </div>

          <p class="secret-content">"{{ secret.content }}"</p>

          <div class="meta-row">
            <span class="status-badge" :class="statusClass">{{ secret.status }}</span>
            <span class="meta-item">
              <span class="meta-icon">📅</span>
              {{ formattedDate }}
            </span>
          </div>

          <div class="action-row">
            <button class="light-btn" :class="{ lighted: hasLighted }" @click="toggleLight">
              <span class="light-icon">{{ hasLighted ? '💡' : '🕯️' }}</span>
              <span class="light-count">{{ secret.lightCount }}</span>
              <span class="light-label">点亮</span>
            </button>
          </div>
        </div>

        <div class="comfort-section">
          <h3 class="section-title">
            <span>🤗 安慰回复</span>
            <span class="reply-count">({{ secret.comfortReplies.length }})</span>
          </h3>

          <div v-if="secret.comfortReplies.length === 0" class="no-replies">
            <p>还没有人安慰，成为第一个送温暖的人吧 💛</p>
          </div>

          <div v-else class="reply-list">
            <div
              v-for="reply in secret.comfortReplies"
              :key="reply.id"
              class="reply-item"
            >
              <p class="reply-content">{{ reply.content }}</p>
              <span class="reply-time">{{ formatReplyDate(reply.createdAt) }}</span>
            </div>
          </div>

          <div class="comfort-form">
            <textarea
              v-model="comfortText"
              class="comfort-input"
              placeholder="送一句温暖的话..."
              rows="3"
              :disabled="submitting"
            ></textarea>
            <button
              class="btn btn-primary comfort-submit"
              @click="submitComfort"
              :disabled="submitting || !comfortText.trim()"
            >
              {{ submitting ? '发送中...' : '🤗 送出安慰' }}
            </button>
          </div>
        </div>
      </div>

      <div class="related-section" v-if="relatedSecrets.length > 0">
        <h3 class="related-title">🍃 同主题的秘密</h3>
        <div class="related-list">
          <div
            v-for="item in relatedSecrets"
            :key="item.id"
            class="card related-card"
            @click="goToSecret(item.id)"
          >
            <p class="related-content">"{{ truncate(item.content, 40) }}"</p>
            <div class="related-meta">
              <span class="related-mood" v-if="item.mood">{{ item.mood }}</span>
              <span class="related-lights">🕯️ {{ item.lightCount || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const error = ref('')
const secret = ref({ content: '', status: '', mood: '', lightCount: 0, comfortReplies: [], createdAt: '' })
const relatedSecrets = ref([])
const comfortText = ref('')
const submitting = ref(false)
const hasLighted = ref(false)

const moodIconMap = {
  '愧疚': '😢',
  '孤独': '🌙',
  '焦虑': '😰',
  '遗憾': '🍂',
  '愤怒': '🔥',
  '嫉妒': '💚',
  '迷茫': '🌫️',
  '自责': '😔'
}

const moodIcon = computed(() => moodIconMap[secret.value.mood] || '💫')

const statusClass = computed(() => {
  return secret.value.status === '已宽恕' ? 'status-forgiven' : 'status-pending'
})

const formattedDate = computed(() => {
  if (!secret.value.createdAt) return ''
  const d = new Date(secret.value.createdAt)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

function formatReplyDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function truncate(text, len) {
  return text.length > len ? text.slice(0, len) + '...' : text
}

async function fetchSecret() {
  loading.value = true
  error.value = ''
  try {
    const id = route.params.id
    const res = await fetch(`/api/secrets/${id}`)
    const data = await res.json()
    if (!res.ok) {
      error.value = data.error || '秘密不存在'
      return
    }
    secret.value = data.secret
    fetchRelated(id)
  } catch (e) {
    error.value = '无法连接到服务器'
  } finally {
    loading.value = false
  }
}

async function fetchRelated(id) {
  try {
    const res = await fetch(`/api/secrets/${id}/related`)
    const data = await res.json()
    relatedSecrets.value = data.related || []
  } catch (e) {
    relatedSecrets.value = []
  }
}

async function toggleLight() {
  if (hasLighted.value) return
  try {
    const res = await fetch(`/api/secrets/${secret.value.id}/light`, { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      hasLighted.value = true
      secret.value.lightCount = data.lightCount
    }
  } catch (e) {}
}

async function submitComfort() {
  if (!comfortText.value.trim() || submitting.value) return
  submitting.value = true
  try {
    const res = await fetch(`/api/secrets/${secret.value.id}/comfort`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comfortText.value })
    })
    const data = await res.json()
    if (data.success) {
      secret.value.comfortReplies = data.comfortReplies
      comfortText.value = ''
    }
  } catch (e) {} finally {
    submitting.value = false
  }
}

function goBack() {
  router.push('/')
}

function goHome() {
  router.push('/')
}

function goToSecret(id) {
  router.push(`/secret/${id}`)
}

watch(() => route.params.id, (newId) => {
  if (newId) {
    hasLighted.value = false
    fetchSecret()
  }
})

onMounted(() => {
  fetchSecret()
})
</script>

<style scoped>
.detail-container {
  width: 100%;
  max-width: 640px;
}

.loading {
  text-align: center;
  padding: 80px 20px;
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
  to { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 60px 40px;
  animation: slideUp 0.6s ease;
}

.error-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 20px;
}

.error-state p {
  color: #666;
  margin-bottom: 30px;
  font-size: 16px;
}

.detail-card {
  animation: slideUp 0.6s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.back-btn {
  background: none;
  border: none;
  color: #667eea;
  font-size: 15px;
  cursor: pointer;
  padding: 4px 0;
  margin-bottom: 24px;
  transition: opacity 0.2s;
}

.back-btn:hover {
  opacity: 0.7;
}

.detail-body {
  margin-bottom: 30px;
}

.mood-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%);
  color: #4a3f6b;
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;
}

.mood-icon {
  font-size: 16px;
}

.secret-content {
  font-size: 20px;
  line-height: 1.9;
  color: #333;
  font-style: italic;
  margin-bottom: 24px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.status-badge {
  padding: 5px 14px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 500;
}

.status-forgiven {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  color: #2d5a4a;
}

.status-pending {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  color: #8b4513;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #999;
  font-size: 13px;
}

.meta-icon {
  font-size: 14px;
}

.action-row {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.light-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f8f4ff;
  border: 2px solid #e0d4f5;
  border-radius: 24px;
  padding: 10px 22px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.light-btn:hover {
  background: #efe6fc;
  border-color: #c4adf0;
  transform: translateY(-1px);
}

.light-btn.lighted {
  background: linear-gradient(135deg, #fde68a 0%, #fbbf24 100%);
  border-color: #f59e0b;
  color: #78350f;
}

.light-icon {
  font-size: 20px;
}

.light-count {
  font-size: 16px;
  font-weight: 600;
}

.light-label {
  font-size: 13px;
  opacity: 0.8;
}

.comfort-section {
  border-top: 1px solid #eee;
  padding-top: 24px;
}

.section-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.reply-count {
  font-weight: 400;
  color: #999;
  font-size: 14px;
}

.no-replies {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

.reply-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.reply-item {
  background: linear-gradient(135deg, #fef9e7 0%, #fdf2e9 100%);
  padding: 14px 18px;
  border-radius: 12px;
  border-left: 3px solid #f59e0b;
}

.reply-content {
  font-size: 14px;
  line-height: 1.7;
  color: #555;
  margin-bottom: 6px;
}

.reply-time {
  font-size: 12px;
  color: #bbb;
}

.comfort-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comfort-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  line-height: 1.7;
  background: #fafafa;
  transition: all 0.3s ease;
}

.comfort-input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.comfort-input::placeholder {
  color: #bbb;
}

.comfort-submit {
  align-self: flex-end;
  padding: 10px 24px;
  font-size: 14px;
}

.related-section {
  margin-top: 30px;
}

.related-title {
  font-size: 18px;
  color: white;
  margin-bottom: 16px;
  text-align: center;
}

.related-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.related-card {
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.related-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
}

.related-content {
  font-size: 14px;
  line-height: 1.6;
  color: #555;
  font-style: italic;
  margin-bottom: 10px;
}

.related-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #999;
}

.related-mood {
  background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%);
  color: #4a3f6b;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
}

.related-lights {
  font-size: 12px;
}

@media (max-width: 480px) {
  .related-list {
    grid-template-columns: 1fr;
  }
}
</style>
