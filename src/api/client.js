import axios from 'axios'

// Supabase Edge Functions - replaces Render backend
const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const FUNCTIONS_URL     = `${SUPABASE_URL}/functions/v1`

// Create axios instance pointing to Supabase Edge Functions
const api = axios.create({
  baseURL: FUNCTIONS_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'apikey': SUPABASE_ANON_KEY
  }
})

// Request logging
api.interceptors.request.use((config) => {
  console.log(`API: ${config.method?.toUpperCase()} ${config.url}`)
  return config
})

// Response error handling
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
  // Health check
  getHealth: () =>
    api.get('/health'),

  // Daily affirmation
  getAffirmation: () =>
    api.get('/affirmation'),

  // AI Chat with RAG
  chat: (message, history = []) =>
    api.post('/chat', { message, history }),

  // Ingest webpage URL
  ingestUrl: (url) =>
    api.post('/ingest-url', { url }),

  // Ingest YouTube video
  ingestYoutube: (url) =>
    api.post('/ingest-youtube', { url }),
}

export default api
