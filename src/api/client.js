import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const BACKEND_URL       = import.meta.env.VITE_BACKEND_URL || ''
const FUNCTIONS_URL     = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : '/api'

class MockQueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.orderConfig = null;
    this.insertData = null;
    this.upsertData = null;
    this._select = false;
  }

  select(cols) {
    this._select = true;
    return this;
  }

  eq(field, val) {
    this.filters.push({ type: 'eq', field, val });
    return this;
  }

  order(field, { ascending }) {
    this.orderConfig = { field, ascending };
    return this;
  }

  insert(data) {
    this.insertData = data;
    return this;
  }

  upsert(data, options) {
    this.upsertData = data;
    return this;
  }

  async execute() {
    let result = [];
    if (this.table === 'profiles') {
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      result = users.map(u => ({ id: u.id, email: u.email, created_at: u.created_at }));
      
      if (this.upsertData) {
        const uData = Array.isArray(this.upsertData) ? this.upsertData[0] : this.upsertData;
        const index = users.findIndex(u => u.id === uData.id);
        if (index !== -1) {
          users[index] = { ...users[index], ...uData };
        } else {
          users.push({ id: uData.id, email: uData.email, password: 'mock', created_at: uData.created_at || new Date().toISOString() });
        }
        localStorage.setItem('mock_users', JSON.stringify(users));
        result = [uData];
      }
    } else if (this.table === 'attempts') {
      let attempts = JSON.parse(localStorage.getItem('mock_attempts') || '[]');
      if (this.insertData) {
        const iData = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
        const newAttempts = iData.map(item => ({
          id: 'att_' + Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
          ...item
        }));
        attempts = [...newAttempts, ...attempts];
        localStorage.setItem('mock_attempts', JSON.stringify(attempts));
        result = newAttempts;
      } else {
        result = attempts;
      }
    } else if (this.table === 'course_modules') {
      try {
        const res = await axios.get('/api/get-modules?all=true');
        result = res.data.modules || [];
      } catch (e) {
        console.error('Failed to fetch modules in mock:', e);
        result = [];
      }
    } else if (this.table === 'user_documents') {
      if (this.insertData) {
        const d = Array.isArray(this.insertData) ? this.insertData[0] : this.insertData;
        result = [{
          ...d,
          id: d.id || 'doc_' + Math.random().toString(36).substr(2, 9)
        }];
      }
    }

    // Apply filters
    for (const filter of this.filters) {
      if (filter.type === 'eq') {
        result = result.filter(item => item[filter.field] === filter.val);
      }
    }

    // Apply sorting
    if (this.orderConfig) {
      const { field, ascending } = this.orderConfig;
      result.sort((a, b) => {
        const va = a[field];
        const vb = b[field];
        if (va < vb) return ascending ? -1 : 1;
        if (va > vb) return ascending ? 1 : -1;
        return 0;
      });
    }

    return result;
  }

  then(onfulfilled, onrejected) {
    return this.execute().then(
      data => onfulfilled ? onfulfilled({ data, error: null }) : { data, error: null },
      error => onrejected ? onrejected({ data: null, error }) : { data: null, error }
    );
  }

  async maybeSingle() {
    const { data, error } = await this;
    return { data: data && data.length > 0 ? data[0] : null, error };
  }

  async single() {
    const { data, error } = await this;
    return { data: data && data.length > 0 ? data[0] : null, error };
  }
}

const makeMockSupabase = () => {
  const listeners = []
  
  const getLocalUser = () => {
    try {
      const u = localStorage.getItem('mock_user')
      return u ? JSON.parse(u) : null
    } catch { return null }
  }
  
  const getLocalSession = () => {
    const user = getLocalUser()
    if (!user) return null
    return { user, access_token: 'mock-token', expires_at: 9999999999 }
  }

  const setLocalUser = (user) => {
    if (user) {
      localStorage.setItem('mock_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('mock_user')
    }
    const session = getLocalSession()
    listeners.forEach(cb => cb('SIGNED_IN', session))
  }

  return {
    auth: {
      getSession: async () => {
        return { data: { session: getLocalSession() }, error: null }
      },
      getUser: async () => {
        return { data: { user: getLocalUser() }, error: null }
      },
      onAuthStateChange: (cb) => {
        listeners.push(cb)
        setTimeout(() => cb('INITIAL_SESSION', getLocalSession()), 0)
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                const idx = listeners.indexOf(cb)
                if (idx !== -1) listeners.splice(idx, 1)
              }
            }
          }
        }
      },
      signInWithPassword: async ({ email, password }) => {
        const users = JSON.parse(localStorage.getItem('mock_users') || '[]')
        const found = users.find(u => u.email === email && u.password === password)
        if (!found) {
          return { data: { user: null, session: null }, error: new Error('Invalid email or password') }
        }
        const user = { id: found.id, email: found.email, created_at: found.created_at }
        setLocalUser(user)
        return { data: { user, session: getLocalSession() }, error: null }
      },
      signUp: async ({ email, password }) => {
        const users = JSON.parse(localStorage.getItem('mock_users') || '[]')
        if (users.find(u => u.email === email)) {
          return { data: { user: null, session: null }, error: new Error('User already exists') }
        }
        const newUser = { id: 'usr_' + Math.random().toString(36).substr(2, 9), email, password, created_at: new Date().toISOString() }
        users.push(newUser)
        localStorage.setItem('mock_users', JSON.stringify(users))
        const user = { id: newUser.id, email: newUser.email, created_at: newUser.created_at }
        setLocalUser(user)
        return { data: { user, session: getLocalSession() }, error: null }
      },
      signOut: async () => {
        setLocalUser(null)
        localStorage.removeItem('mock_user')
        return { error: null }
      }
    },
    from: (table) => {
      return new MockQueryBuilder(table);
    },
    storage: {
      from: () => ({
        upload: async (path, file) => {
          console.log(`Mock uploaded file: ${file.name} to ${path}`);
          return { data: { path }, error: null };
        }
      })
    }
  }
}

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : makeMockSupabase()

// Supabase Edge Functions
const api = axios.create({
  baseURL: FUNCTIONS_URL,
  timeout: 60000,
  headers: {
    'Content-Type':  'application/json',
    'Authorization': SUPABASE_ANON_KEY ? `Bearer ${SUPABASE_ANON_KEY}` : '',
    'apikey':        SUPABASE_ANON_KEY,
  },
})

// Render Backend for video processing
const backendApi = axios.create({
  baseURL: BACKEND_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(async (config) => {
  console.log(`Supabase: ${config.method?.toUpperCase()} ${config.url}`)
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      config.headers['X-User-Id'] = session.user.id
      config.headers['X-User-Email'] = session.user.email
    }
  } catch (err) {
    console.error('Failed to attach user auth headers:', err)
  }
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

  evaluateAnswer: (question, answer, correct_letter, rationale = '') =>
    api.post('/mock-exam', {
      action: 'evaluate',
      question,
      answer,
      correct_letter,
      rationale,
    }),

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

  getSessions: (all = false) =>
    api.get(`/chat-sessions${all ? '?all=true' : ''}`),

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
