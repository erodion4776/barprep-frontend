import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const BACKEND_URL       = import.meta.env.VITE_BACKEND_URL || ''
const FUNCTIONS_URL     = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : ''

// Define mock data store inside client if we are in local fallback mode
const getMockModules = () => {
  const stored = localStorage.getItem('mock_modules')
  if (stored) return JSON.parse(stored)
  
  const defaultModules = [
    {
      id: "cm_1",
      topic: "Constitutional Law",
      title: "Introduction to Constitutional Law: Judicial Review & Federalism",
      video_url: "https://www.youtube.com/watch?v=07mPZ00Y9K0",
      thumbnail_url: "https://img.youtube.com/vi/07mPZ00Y9K0/0.jpg",
      ai_summary: "This module covers the core foundation of Constitutional Law, focusing on judicial review (Marbury v. Madison), federalism, the Commerce Clause, and the separation of powers.",
      ai_outline: "### 1. Judicial Review\n- Established in *Marbury v. Madison* (1803).\n- Power of the Supreme Court to declare laws unconstitutional.\n- Requirements of Justiciability: Standing, Ripeness, Mootness, Political Question.\n\n### 2. Federalism & Separation of Powers\n- Division of authority between federal and state governments.\n- Enumerated powers under Article I, Section 8.\n- Tenth Amendment reserving powers to states.\n- Supremacy Clause.",
      is_published: true,
      order_index: 0
    },
    {
      id: "cm_2",
      topic: "Contracts",
      title: "The Law of Contracts: Offer, Acceptance, and Consideration",
      video_url: "https://www.youtube.com/watch?v=vDqU15_mG0A",
      thumbnail_url: "https://img.youtube.com/vi/vDqU15_mG0A/0.jpg",
      ai_summary: "Master the essential elements of contract formation, including offer, acceptance, the mailbox rule, bilateral vs. unilateral contracts, and legal consideration.",
      ai_outline: "### 1. Mutual Assent\n- **Offer**: Objective manifestation of intent to be bound, definite terms, and communication to offeree.\n- **Acceptance**: Unequivocal agreement to terms. *Mailbox Rule* (acceptance effective upon dispatch).\n\n### 2. Consideration\n- Bargained-for exchange of legal detriment.\n- Pre-existing duty rule.\n- Promissory Estoppel as a consideration substitute.",
      is_published: true,
      order_index: 1
    },
    {
      id: "cm_3",
      topic: "Torts",
      title: "Torts: Negligence, Duty of Care, and Proximate Cause",
      video_url: "https://www.youtube.com/watch?v=P9u_B4oW-lQ",
      thumbnail_url: "https://img.youtube.com/vi/P9u_B4oW-lQ/0.jpg",
      ai_summary: "An in-depth breakdown of negligence, focusing on duty of care (Cardozo vs. Andrews), breach, actual cause, proximate cause, and damages.",
      ai_outline: "### 1. Elements of Negligence\n- **Duty**: Reasonably prudent person standard. Special duties for landowners and professionals.\n- **Breach**: Failure to meet the standard of care (Learned Hand formula).\n- **Causation**:\n  - *Actual Cause*: But-for test.\n  - *Proximate Cause*: Foreseeability (Palsgraf v. Long Island Railroad Co.).\n- **Damages**: Actual physical or property harm.",
      is_published: true,
      order_index: 2
    }
  ]
  localStorage.setItem('mock_modules', JSON.stringify(defaultModules))
  return defaultModules
}

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
      result = getMockModules()
    } else if (this.table === 'user_documents') {
      if (this.insertData) {
        const d = Array.isArray(this.insertData) ? this.insertData[0] : this.insertData;
        result = [{
          ...d,
          id: d.id || 'doc_' + Math.random().toString(36).substr(2, 9)
        }];
      }
    } else if (this.table === 'chat_sessions') {
      let sessions = JSON.parse(localStorage.getItem('mock_chat_sessions') || '[]');
      if (this.insertData) {
        const iData = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
        const newSessions = iData.map(item => ({
          id: 'sess_' + Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...item
        }));
        sessions = [...newSessions, ...sessions];
        localStorage.setItem('mock_chat_sessions', JSON.stringify(sessions));
        result = newSessions;
      } else if (this.upsertData) {
        const uData = Array.isArray(this.upsertData) ? this.upsertData : [this.upsertData];
        uData.forEach(item => {
          const idx = sessions.findIndex(s => s.id === item.id);
          if (idx !== -1) {
            sessions[idx] = { ...sessions[idx], ...item, updated_at: new Date().toISOString() };
          } else {
            sessions.push({
              id: item.id || 'sess_' + Math.random().toString(36).substr(2, 9),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...item
            });
          }
        });
        localStorage.setItem('mock_chat_sessions', JSON.stringify(sessions));
        result = uData;
      } else {
        result = sessions;
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

// Supabase Edge Functions HTTP Client
const api = axios.create({
  baseURL: FUNCTIONS_URL || '/api',
  timeout: 60000,
  headers: {
    'Content-Type':  'application/json',
    'Authorization': SUPABASE_ANON_KEY ? `Bearer ${SUPABASE_ANON_KEY}` : '',
    'apikey':        SUPABASE_ANON_KEY,
  },
})

// Dynamically inject authorization headers using logged-in user access token
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers['Authorization'] = `Bearer ${session.access_token}`
      config.headers['X-User-Id'] = session.user.id
      config.headers['X-User-Email'] = session.user.email
    } else if (SUPABASE_ANON_KEY) {
      config.headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`
    }
  } catch (err) {
    console.error('Failed to attach user auth headers:', err)
  }
  return config
})

// Render Backend for video processing
const backendApi = axios.create({
  baseURL: BACKEND_URL || '/api',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
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

  getHealth: async () => {
    if (!SUPABASE_URL) return { data: { status: 'ok' } }
    return api.get('/health')
  },

  getAffirmation: async () => {
    if (!SUPABASE_URL) {
      const affirmations = [
        "You have the analytical mind and the diligence to conquer this exam. One rule, one analysis, one day at a time.",
        "The Bar Exam is a test of minimum competence, not perfection. Keep steady and trust your prep.",
        "Every MBE question you practice is a lesson learned. Embrace mistakes as steps to passing.",
        "Focus on your own lane. Stay disciplined, master the rules, and you will see that 'Pass' next to your name.",
        "Your legal journey has prepared you for this moment. Deep breaths, clear thoughts, strong analysis.",
        "You are fully capable of reasoning through any complex legal scenario. Master the elements, apply the facts.",
      ]
      const idx = Math.floor(Math.random() * affirmations.length)
      return { data: { affirmation: affirmations[idx] } }
    }
    return api.get('/affirmation')
  },

  chat: async (message, history = []) => {
    if (!SUPABASE_URL) {
      let reply = "I am your Bar Prep AI coach! Keep up the amazing study efforts. Focus on learning the elements of the rule and apply the facts systematically."
      const lower = message.toLowerCase()
      if (lower.includes("burglary")) {
        reply = "### Common Law Burglary\nBurglary at common law is defined as the **breaking and entering** of the **dwelling house** of **another** at **nighttime** with the **intent to commit a felony therein**.\n\n**Key traps on the exam:**\n1. *Dwelling house*: Must be a place where someone regularly sleeps, not a commercial store.\n2. *Nighttime*: Under common law, it must occur during the night. Modern statutes often eliminate this, but apply common law if specified.\n3. *Intent*: The intent to commit a felony must exist *at the time* of the entry. If the intent is formed *after* entry, it is not burglary."
      } else if (lower.includes("hearsay")) {
        reply = "### Hearsay Rule\nHearsay is an **out-of-court statement** offered to prove the **truth of the matter asserted**.\n\n**Analysis Steps:**\n1. Identify the declarant and the statement.\n2. Is it offered for its truth? If offered to show effect on listener, state of mind, or verbal acts, it is *not hearsay*.\n3. Check for exemptions (e.g., opposing party statements).\n4. Check for exceptions (e.g., excited utterances, dying declarations)."
      } else if (lower.includes("negligence")) {
        reply = "### Negligence Elements\nTo establish negligence, the plaintiff must prove:\n1. **Duty**: A legal obligation to conform to a standard of conduct (the general standard is a reasonably prudent person under the circumstances).\n2. **Breach**: Failure to conform to that duty.\n3. **Causation**: Both *actual cause* ('but-for' test) and *proximate cause* (foreseeability / *Palsgraf* rule).\n4. **Damages**: Actual harm/injury."
      } else if (lower.includes("contract") || lower.includes("consideration")) {
        reply = "### Contract Formation\nA valid contract requires **Mutual Assent** (Offer and Acceptance) and **Consideration**.\n\n- **Offer**: An objective manifestation of intent to be bound with definite and certain terms.\n- **Acceptance**: Unequivocal assent to the terms. Under the *Mailbox Rule*, acceptance is effective upon dispatch.\n- **Consideration**: A bargained-for exchange of legal detriment."
      }
      return { data: { reply, sources: [] } }
    }
    return api.post('/chat', { message, history })
  },

  ingestUrl: async (url) => {
    if (!SUPABASE_URL) return { data: { message: `Mock ingested URL: ${url}` } }
    return api.post('/ingest-url', { url })
  },

  ingestYoutube: async (url) => {
    if (!SUPABASE_URL) return { data: { message: `Mock ingested YouTube: ${url}` } }
    return api.post('/ingest-youtube', { url })
  },

  generateQuestion: async (topic) => {
    if (!SUPABASE_URL) {
      return {
        data: {
          question: `Under common law, which of the following best defines the crime of burglary?\n\nA. The taking and carrying away of personal property of another with the intent to permanently deprive.\nB. The breaking and entering of a dwelling of another at nighttime with the intent to commit a felony therein.\nC. The trespassory taking of personal property of another from their person by force or threat.\nD. The malicious burning of a dwelling house of another.`,
          correct_letter: "B",
          rationale: "B is the correct common law definition of burglary. Option A is larceny, Option C is robbery, and Option D is arson."
        }
      }
    }
    return api.post('/mock-exam', { action: 'generate', topic })
  },

  evaluateAnswer: async (question, answer, correct_letter, rationale = '') => {
    if (!SUPABASE_URL) {
      const isCorrect = answer === correct_letter
      return {
        data: {
          reply: isCorrect 
            ? "Excellent job! You correctly identified the common law elements." 
            : "That is incorrect. Keep practicing! Remember to analyze each element systematically.",
          is_correct: isCorrect,
          correct_letter
        }
      }
    }
    return api.post('/mock-exam', {
      action: 'evaluate',
      question,
      answer,
      correct_letter,
      rationale,
    })
  },

  getModules: async (topic = '', all = false) => {
    if (!SUPABASE_URL) {
      let modules = getMockModules()
      if (topic) {
        modules = modules.filter(m => m.topic.toLowerCase() === topic.toLowerCase())
      }
      if (!all) {
        modules = modules.filter(m => m.is_published)
      }
      return { data: { modules } }
    }
    return api.get(`/get-modules?topic=${encodeURIComponent(topic)}&all=${all}`)
  },

  adminLogin: async (password) => {
    if (!SUPABASE_URL) {
      if (password === 'admin123' || password) {
        return { data: { token: "mock-admin-token" } }
      }
      throw new Error('Invalid password')
    }
    return api.post('/admin-auth', { action: 'login', password })
  },

  adminVerify: async (token) => {
    if (!SUPABASE_URL) {
      return { data: { valid: token === "mock-admin-token" } }
    }
    return api.post('/admin-auth', { action: 'verify', password: token })
  },

  processPdf: async (storage_path, filename, document_id) => {
    if (!SUPABASE_URL) return { data: { message: "Successfully processed and indexed PDF document!" } }
    return api.post('/process-pdf', { storage_path, filename, document_id })
  },

  // ---- Render Backend ----

  processVideo: async (url, topic, order_index = 0) => {
    if (!SUPABASE_URL) {
      let youtubeId = ""
      try {
        const urlObj = new URL(url)
        if (urlObj.hostname.includes("youtube.com")) {
          youtubeId = urlObj.searchParams.get("v") || ""
        } else if (urlObj.hostname.includes("youtu.be")) {
          youtubeId = urlObj.pathname.slice(1)
        }
      } catch {
        youtubeId = "07mPZ00Y9K0"
      }

      const thumbnail_url = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/0.jpg` : ""
      const modules = getMockModules()
      const newModule = {
        id: "cm_" + Math.random().toString(36).substr(2, 9),
        topic: topic || "General Law",
        title: "Processed Lecture: " + (topic || "Legal Concepts"),
        video_url: url,
        thumbnail_url,
        ai_summary: "A professional video course covering advanced bar exam concepts and legal rules.",
        ai_outline: "### 1. Introduction\n- Key definitions and overview of the topic.\n\n### 2. Deep Dive\n- Essential elements of the rule and case illustrations.",
        is_published: true,
        order_index: Number(order_index) || 0
      }
      modules.push(newModule)
      localStorage.setItem('mock_modules', JSON.stringify(modules))
      return { data: { message: "Successfully processed YouTube lecture!", source_type: "description" } }
    }
    return backendApi.post('/api/process-video', { url, topic, order_index })
  },

  // ---- Chat Sessions ----

  getSessions: async (all = false) => {
    // 1. Get current logged in user details
    let currentUserId = null
    try {
      const { data: { session } } = await supabase.auth.getSession()
      currentUserId = session?.user?.id
    } catch (e) {
      console.warn("Could not get auth session: ", e)
    }

    if (!SUPABASE_URL) {
      let sessions = JSON.parse(localStorage.getItem('mock_chat_sessions') || '[]')
      if (all) {
        // Admin gets everything
        return { data: { sessions } }
      } else {
        // Filter by user ID so different users don't see each other's chats
        sessions = sessions.filter(s => s.userId === currentUserId || (!s.userId && !currentUserId))
        return { data: { sessions } }
      }
    }

    // Real Supabase flow
    try {
      return await api.get(`/chat-sessions${all ? '?all=true' : ''}`)
    } catch (err) {
      console.warn('Edge Function getSessions failed, querying chat_sessions table directly:', err)
      let query = supabase.from('chat_sessions').select('*')
      if (!all) {
        if (currentUserId) {
          query = query.eq('user_id', currentUserId)
        }
      }
      const { data, error } = await query.order('updated_at', { ascending: false })
      if (error) throw error
      const mapped = (data || []).map(s => ({
        id: s.id,
        title: s.title,
        messages: s.messages,
        userId: s.user_id || s.userId,
        userEmail: s.user_email || s.userEmail,
        created_at: s.created_at,
        updated_at: s.updated_at
      }))
      return { data: { sessions: mapped } }
    }
  },

  createSession: async (title, messages = []) => {
    let currentUserId = null
    let currentUserEmail = 'Anonymous'
    try {
      const { data: { session } } = await supabase.auth.getSession()
      currentUserId = session?.user?.id || null
      currentUserEmail = session?.user?.email || 'Anonymous'
    } catch (e) {}

    if (!SUPABASE_URL) {
      const sessions = JSON.parse(localStorage.getItem('mock_chat_sessions') || '[]')
      const newSession = {
        id: 'sess_' + Math.random().toString(36).substr(2, 9),
        title: title || 'New Study Session',
        messages,
        userId: currentUserId,
        userEmail: currentUserEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      sessions.unshift(newSession)
      localStorage.setItem('mock_chat_sessions', JSON.stringify(sessions))
      return { data: { session: newSession } }
    }

    // Real Supabase flow
    try {
      return await api.post('/chat-sessions', { action: 'create', title, messages })
    } catch (err) {
      console.warn('Edge Function createSession failed, inserting into chat_sessions table directly:', err)
      const { data, error } = await supabase.from('chat_sessions').insert({
        title,
        messages,
        user_id: currentUserId,
        user_email: currentUserEmail,
        updated_at: new Date().toISOString()
      }).select().single()
      if (error) throw error
      return {
        data: {
          session: {
            id: data.id,
            title: data.title,
            messages: data.messages,
            userId: data.user_id,
            userEmail: data.user_email,
            created_at: data.created_at,
            updated_at: data.updated_at
          }
        }
      }
    }
  },

  updateSession: async (id, title, messages) => {
    if (!SUPABASE_URL) {
      const sessions = JSON.parse(localStorage.getItem('mock_chat_sessions') || '[]')
      const idx = sessions.findIndex(s => s.id === id)
      if (idx !== -1) {
        sessions[idx].title = title || sessions[idx].title
        sessions[idx].messages = messages || sessions[idx].messages
        sessions[idx].updated_at = new Date().toISOString()
        localStorage.setItem('mock_chat_sessions', JSON.stringify(sessions))
        return { data: { session: sessions[idx] } }
      }
      throw new Error('Session not found')
    }

    // Real Supabase flow
    try {
      return await api.post('/chat-sessions', { action: 'update', id, title, messages })
    } catch (err) {
      console.warn('Edge Function updateSession failed, updating chat_sessions table directly:', err)
      const { data, error } = await supabase.from('chat_sessions').update({
        title,
        messages,
        updated_at: new Date().toISOString()
      }).eq('id', id).select().single()
      if (error) throw error
      return {
        data: {
          session: {
            id: data.id,
            title: data.title,
            messages: data.messages,
            userId: data.user_id,
            userEmail: data.user_email,
            created_at: data.created_at,
            updated_at: data.updated_at
          }
        }
      }
    }
  },

  getSession: async (id) => {
    if (!SUPABASE_URL) {
      const sessions = JSON.parse(localStorage.getItem('mock_chat_sessions') || '[]')
      const session = sessions.find(s => s.id === id)
      if (session) return { data: { session } }
      throw new Error('Session not found')
    }

    // Real Supabase flow
    try {
      return await api.post('/chat-sessions', { action: 'get', id })
    } catch (err) {
      console.warn('Edge Function getSession failed, fetching chat_sessions table directly:', err)
      const { data, error } = await supabase.from('chat_sessions').select('*').eq('id', id).single()
      if (error) throw error
      return {
        data: {
          session: {
            id: data.id,
            title: data.title,
            messages: data.messages,
            userId: data.user_id,
            userEmail: data.user_email,
            created_at: data.created_at,
            updated_at: data.updated_at
          }
        }
      }
    }
  },

  deleteSession: async (id) => {
    if (!SUPABASE_URL) {
      let sessions = JSON.parse(localStorage.getItem('mock_chat_sessions') || '[]')
      sessions = sessions.filter(s => s.id !== id)
      localStorage.setItem('mock_chat_sessions', JSON.stringify(sessions))
      return { data: { success: true } }
    }

    // Real Supabase flow
    try {
      return await api.post('/chat-sessions', { action: 'delete', id })
    } catch (err) {
      console.warn('Edge Function deleteSession failed, deleting from chat_sessions table directly:', err)
      const { error } = await supabase.from('chat_sessions').delete().eq('id', id)
      if (error) throw error
      return { data: { success: true } }
    }
  },
}

export default api
