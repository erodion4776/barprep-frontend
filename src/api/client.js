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

  // New dedicated mock exam endpoint - fast Groq direct
  generateQuestion: (topic) =>
    api.post('/mock-exam', { action: 'generate', topic }),

  evaluateAnswer: (question, answer) =>
    api.post('/mock-exam', { action: 'evaluate', question, answer }),
}

export default api
