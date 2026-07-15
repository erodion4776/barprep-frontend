import axios from 'axios'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const PROCESSOR_URL     = import.meta.env.VITE_PROCESSOR_URL
const FUNCTIONS_URL     = `${SUPABASE_URL}/functions/v1`

// Supabase Edge Functions
const api = axios.create({
  baseURL: FUNCTIONS_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'apikey': SUPABASE_ANON_KEY
  }
})

// Render Python Processor
const processorApi = axios.create({
  baseURL: PROCESSOR_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  console.log(`Supabase: ${config.method?.toUpperCase()} ${config.url}`)
  return config
})

processorApi.interceptors.request.use((config) => {
  console.log(`Processor: ${config.method?.toUpperCase()} ${config.url}`)
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

processorApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail  ||
      error.response?.data?.error   ||
      error.message                 ||
      'Video processing failed'
    console.error('Processor API Error:', message)
    return Promise.reject(new Error(message))
  }
)

export const apiClient = {
  // Health
  getHealth: () =>
    api.get('/health'),

  // Affirmation
  getAffirmation: () =>
    api.get('/affirmation'),

  // Chat with RAG
  chat: (message, history = []) =>
    api.post('/chat', { message, history }),

  // Ingest web page
  ingestUrl: (url) =>
    api.post('/ingest-url', { url }),

  // Ingest YouTube (old method - kept as backup)
  ingestYoutube: (url) =>
    api.post('/ingest-youtube', { url }),

  // Mock Exam
  generateQuestion: (topic) =>
    api.post('/mock-exam', { action: 'generate', topic }),

  evaluateAnswer: (question, answer) =>
    api.post('/mock-exam', { action: 'evaluate', question, answer }),

  // Get course modules
  getModules: (topic = '', all = false) =>
    api.get(`/get-modules?topic=${encodeURIComponent(topic)}&all=${all}`),

  // Admin Auth
  adminLogin: (password) =>
    api.post('/admin-auth', { action: 'login', password }),

  adminVerify: (token) =>
    api.post('/admin-auth', { action: 'verify', password: token }),

  // Process video via Python processor on Render
  processVideo: (url, topic, order_index = 0) =>
    processorApi.post('/process-video', {
      url,
      topic,
      order_index
    }),

  // Process PDF via Supabase
  processPdf: (storage_path, filename, document_id) =>
    api.post('/process-pdf', {
      storage_path,
      filename,
      document_id
    }),
}

export default api
