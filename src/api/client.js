import axios from 'axios'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const FUNCTIONS_URL     = `${SUPABASE_URL}/functions/v1`

const api = axios.create({
  baseURL: FUNCTIONS_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'apikey': SUPABASE_ANON_KEY
  }
})

api.interceptors.request.use((config) => {
  console.log(`API: ${config.method?.toUpperCase()} ${config.url}`)
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error   ||
      error.response?.data?.message ||
      error.message                 ||
      'Something went wrong'
    console.error('API Error:', message)
    return Promise.reject(new Error(message))
  }
)

export const apiClient = {
  // Core
  getHealth:      () => api.get('/health'),
  getAffirmation: () => api.get('/affirmation'),

  // Chat
  chat: (message, history = []) =>
    api.post('/chat', { message, history }),

  // Ingest
  ingestUrl:      (url) => api.post('/ingest-url',      { url }),
  ingestYoutube:  (url) => api.post('/ingest-youtube',  { url }),

  // Mock Exam
  generateQuestion: (topic) =>
    api.post('/mock-exam', { action: 'generate', topic }),
  evaluateAnswer: (question, answer) =>
    api.post('/mock-exam', { action: 'evaluate', question, answer }),

  // Tutorials
  getModules:    (topic = '', all = false) =>
    api.get(`/get-modules?topic=${topic}&all=${all}`),
  processVideo:  (url, topic, order_index = 0) =>
    api.post('/process-video', { url, topic, order_index }),

  // PDF
  processPdf: (storage_path, filename, document_id) =>
    api.post('/process-pdf', { storage_path, filename, document_id }),

  // Admin Auth
  adminLogin:  (password) =>
    api.post('/admin-auth', { action: 'login',  password }),
  adminVerify: (token) =>
    api.post('/admin-auth', { action: 'verify', password: token }),
}

export default api
