import axios from 'axios'

// Automatically uses local backend in dev
// and your real Render URL in production
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds for AI responses
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging
api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail 
      || error.message 
      || 'Something went wrong'
    console.error('API Error:', message)
    return Promise.reject(new Error(message))
  }
)

// API functions your components will call
export const apiClient = {

  // Health check
  getHealth: () => 
    api.get('/api/health'),

  // Get daily affirmation
  getAffirmation: () => 
    api.get('/api/affirmation'),

  // Chat with AI
  chat: (message, history = []) =>
    api.post('/api/chat', { message, history }),

  // Ingest a webpage URL
  ingestUrl: (url) =>
    api.post('/api/ingest/url', { url }),

  // Ingest a YouTube video
  ingestYoutube: (url) =>
    api.post('/api/ingest/youtube', { url }),
}

export default api
