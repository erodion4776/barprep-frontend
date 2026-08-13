import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const BACKEND_URL       = import.meta.env.VITE_BACKEND_URL
const FUNCTIONS_URL     = `${SUPABASE_URL}/functions/v1`

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Supabase Edge Functions API ───────────────────────────────────────────────
const api = axios.create({
  baseURL: FUNCTIONS_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'apikey':       SUPABASE_ANON_KEY,
  },
})

// ── Attach session token ──────────────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  config.headers.Authorization = `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`
  return config
})

// ── Request logging ───────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.log(`Supabase: ${config.method?.toUpperCase()} ${config.url}`)
  }
  return config
})

// ── Render Backend ────────────────────────────────────────────────────────────
const backendApi = axios.create({
  baseURL: BACKEND_URL,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
})

backendApi.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.log(`Backend: ${config.method?.toUpperCase()} ${config.url}`)
  }
  return config
})

// ── Error handlers ────────────────────────────────────────────────────────────
api.interceptors.response.use(
  res => res,
  err => {
    const message =
      err.response?.data?.error   ||
      err.response?.data?.message ||
      err.message                 ||
      'Something went wrong'
    if (import.meta.env.DEV) console.error('Supabase API Error:', message)
    return Promise.reject(new Error(message))
  }
)

backendApi.interceptors.response.use(
  res => res,
  err => {
    const message =
      err.response?.data?.detail ||
      err.response?.data?.error  ||
      err.message                ||
      'Video processing failed'
    if (import.meta.env.DEV) console.error('Backend Error:', message)
    return Promise.reject(new Error(message))
  }
)

// ── API Client ────────────────────────────────────────────────────────────────
export const apiClient = {

  // ── Health ──────────────────────────────────────────────────────────────────
  getHealth: () =>
    api.get('/health'),

  // ── Affirmation ─────────────────────────────────────────────────────────────
  getAffirmation: () =>
    api.get('/affirmation'),

  // ── Chat ────────────────────────────────────────────────────────────────────
  chat: (message, history = []) =>
    api.post('/chat', { message, history }),

  // ── Ingestion ───────────────────────────────────────────────────────────────
  ingestUrl: (url) =>
    api.post('/ingest-url', { url }),

  ingestYoutube: (url) =>
    api.post('/ingest-youtube', { url }),

  // ── Mock Exam ───────────────────────────────────────────────────────────────
  generateQuestion: (topic) =>
    api.post('/mock-exam', { action: 'generate', topic }),

  evaluateAnswer: (question, answer, correct_letter, rationale = '') =>
    api.post('/mock-exam', {
      action: 'evaluate',
      question,
      answer,
      correct_letter,
      rationale,
    }),

  // ── Modules ─────────────────────────────────────────────────────────────────
  getModules: (topic = '', all = false) =>
    api.get(`/get-modules?topic=${encodeURIComponent(topic)}&all=${all}`),

  // ── PDF ─────────────────────────────────────────────────────────────────────
  processPdf: (storage_path, filename, document_id) =>
    api.post('/process-pdf', { storage_path, filename, document_id }),

  // ── Admin Auth ──────────────────────────────────────────────────────────────
  adminLogin: (password) =>
    api.post('/admin-auth', { action: 'login', password }),

  adminVerify: (token) =>
    api.post('/admin-auth', { action: 'verify', password: token }),

  // ── Chat Sessions ───────────────────────────────────────────────────────────
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

  adminGetAllSessions: (adminToken) =>
    api.post('/chat-sessions', { action: 'admin_list', admin_token: adminToken }),

  // ── Video Processing (Render Backend) ───────────────────────────────────────
  processVideo: (url, topic, order_index = 0) =>
    backendApi.post('/api/process-video', { url, topic, order_index }),

  // ══════════════════════════════════════════════════════════════════════════
  // SCRAPER ENDPOINTS
  // ══════════════════════════════════════════════════════════════════════════

  // Trigger scrape of a URL and save to Supabase scraped_data table
  triggerScrape: (url, topic = '') =>
    api.post('/scraper', { action: 'scrape', url, topic }),

  // Get all scraped data (admin)
  getScrapedData: (topic = '', limit = 20) =>
    api.get(`/scraper?action=list&topic=${encodeURIComponent(topic)}&limit=${limit}`),

  // Delete scraped item
  deleteScrapedItem: (id) =>
    api.post('/scraper', { action: 'delete', id }),

  // Sync scraped data to AI knowledge base
  syncScrapedToKnowledge: (id) =>
    api.post('/scraper', { action: 'sync', id }),

  // ══════════════════════════════════════════════════════════════════════════
  // BLOG ENDPOINTS
  // ══════════════════════════════════════════════════════════════════════════

  // Get published blog posts (public)
  getBlogPosts: ({
    page    = 0,
    limit   = 12,
    topic   = '',
    search  = '',
  } = {}) =>
    api.get(
      `/blog?action=list` +
      `&page=${page}` +
      `&limit=${limit}` +
      `&topic=${encodeURIComponent(topic)}` +
      `&search=${encodeURIComponent(search)}`
    ),

  // Get single blog post by slug (public)
  getBlogPost: (slug) =>
    api.get(`/blog?action=get&slug=${encodeURIComponent(slug)}`),

  // Generate a new blog post using Pollinations AI (admin)
  generateBlogPost: ({ topic, source_url = '', custom_prompt = '' }) =>
    api.post('/blog', {
      action: 'generate',
      topic,
      source_url,
      custom_prompt,
    }),

  // Generate blog image using Pollinations AI (admin)
  generateBlogImage: (prompt) =>
    api.post('/blog', { action: 'generate_image', prompt }),

  // Publish a blog post (admin)
  publishBlogPost: (id) =>
    api.post('/blog', { action: 'publish', id }),

  // Unpublish a blog post (admin)
  unpublishBlogPost: (id) =>
    api.post('/blog', { action: 'unpublish', id }),

  // Delete a blog post (admin)
  deleteBlogPost: (id) =>
    api.post('/blog', { action: 'delete', id }),

  // Get all blog posts including drafts (admin)
  adminGetBlogPosts: (adminToken, status = 'all') =>
    api.post('/blog', {
      action:      'admin_list',
      admin_token: adminToken,
      status,
    }),

  // Update blog post content (admin)
  updateBlogPost: (id, updates) =>
    api.post('/blog', { action: 'update', id, ...updates }),

  // ── Newsletter ──────────────────────────────────────────────────────────────
  subscribeNewsletter: (email) =>
    api.post('/newsletter', { email }),
}

export default api
