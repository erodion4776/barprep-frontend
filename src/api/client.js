import axios from 'axios'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const BACKEND_URL       = import.meta.env.VITE_BACKEND_URL
const FUNCTIONS_URL     = `${SUPABASE_URL}/functions/v1`

// Supabase Edge Functions
const api = axios.create({
  baseURL: FUNCTIONS_URL,
  timeout: 60000,
  headers: {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'apikey':        SUPABASE_ANON_KEY
  }
})

// Render Backend for video processing
const backendApi = axios.create({
  baseURL: BACKEND_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  console.log(`Supabase: ${config.method?.toUpperCase()} ${config.url}`)
  return config
})

backendApi.interceptors.request.use((config) => {
  console.log(`Backend: ${config.method?.toUpperCase()} ${config.url}`)
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
    console.error('Supabase API Error:', message)
    return Promise.reject(new Error(message))
  }
)

backendApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail  ||
      error.response?.data?.error   ||
      error.message                 ||
      'Video processing failed'
    console.error('Backend Error:', message)
    return Promise.reject(new Error(message))
  }
)

export const apiClient = {
  // ---- Supabase Edge Functions ----

  getHealth: () =>
    api.get('/health'),

  getAffirmation: () =>
    api.get('/affirmation'),

  chat: (message, history = []) =>
    api.post('/chat', { message, history }),

  ingestUrl: (url) =>
    api.post('/ingest-url', { url }),

  ingestYoutube: (url) =>
    api.post('/ingest-youtube', { url }),

  generateQuestion: (topic) =>
    api.post('/mock-exam', { action: 'generate', topic }),

  evaluateAnswer: (question, answer) =>
    api.post('/mock-exam', { action: 'evaluate', question, answer }),

  getModules: (topic = '', all = false) =>
    api.get(`/get-modules?topic=${encodeURIComponent(topic)}&all=${all}`),

  adminLogin: (password) =>
    api.post('/admin-auth', { action: 'login', password }),

  adminVerify: (token) =>
    api.post('/admin-auth', { action: 'verify', password: token }),

  processPdf: (storage_path, filename, document_id) =>
    api.post('/process-pdf', { storage_path, filename, document_id }),

  // ---- Render Backend ----

  processVideo: (url, topic, order_index = 0) =>
    backendApi.post('/api/process-video', { url, topic, order_index }),

  // ---- Chat Sessions ----

  getSessions: () =>
    api.get('/chat-sessions'),

  createSession: (title, messages = []) =>
    api.post('/chat-sessions', { action: 'create', title, messages }),

  updateSession: (id, title, messages) =>
    api.post('/chat-sessions', { action: 'update', id, title, messages }),

  getSession: (id) =>
    api.post('/chat-sessions', { action: 'get', id }),

  deleteSession: (id) =>
    api.post('/chat-sessions', { action: 'delete', id }),
}

export default api
