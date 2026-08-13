import { useState, useRef, useCallback } from 'react'
import { Link }     from 'react-router-dom'
import { supabase } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

// ── Constants ─────────────────────────────────────────────────────────────────
const SUBJECTS = [
  'General Question',
  'Technical Issue',
  'Bug Report',
  'Account Problem',
  'Privacy / Data Request',
  'Feature Suggestion',
  'Billing Question',
  'Other',
]

const CONTACT_INFO = [
  {
    icon:  '📧',
    title: 'General Support',
    value: 'support@barprepai.com',
    href:  'mailto:support@barprepai.com',
  },
  {
    icon:  '🔒',
    title: 'Privacy Requests',
    value: 'privacy@barprepai.com',
    href:  'mailto:privacy@barprepai.com',
  },
  {
    icon:  '⚖️',
    title: 'Legal Inquiries',
    value: 'legal@barprepai.com',
    href:  'mailto:legal@barprepai.com',
  },
]

const RESPONSE_TIMES = [
  { label: 'General',   time: '24–48 hours'  },
  { label: 'Technical', time: '24 hours'      },
  { label: 'Privacy',   time: 'Within 30 days'},
]

// ── Rate limit helpers ─────────────────────────────────────────────────────────
const RATE_KEY      = 'contact_last_submit'
const RATE_LIMIT_MS = 5 * 60 * 1000 // 5 minutes between submissions

function isRateLimited() {
  const last = localStorage.getItem(RATE_KEY)
  if (!last) return false
  return Date.now() - Number(last) < RATE_LIMIT_MS
}

function getRateLimitRemaining() {
  const last = localStorage.getItem(RATE_KEY)
  if (!last) return 0
  const remaining = RATE_LIMIT_MS - (Date.now() - Number(last))
  return Math.max(0, Math.ceil(remaining / 60000))
}

// ── Email validation ───────────────────────────────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Contact() {
  const [form, setForm] = useState({
    name:    '',
    email:   '',
    subject: 'General Question',
    message: '',
  })
  const [loading,       setLoading]       = useState(false)
  const [success,       setSuccess]       = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')  // ← save before clear
  const [error,         setError]         = useState('')
  const [attachment,    setAttachment]    = useState(null)
  const [uploading,     setUploading]     = useState(false)
  const honeypotRef = useRef(null) // spam trap

  const setField = useCallback((field, value) => {
    setForm(p => ({ ...p, [field]: value }))
    if (error) setError('')
  }, [error])

  // ── Validate ───────────────────────────────────────────────────────────────
  const validate = () => {
    if (!form.name.trim())         return 'Please enter your name.'
    if (!form.email.trim())        return 'Please enter your email.'
    if (!isValidEmail(form.email)) return 'Please enter a valid email address.'
    if (!form.message.trim())      return 'Please enter a message.'
    if (form.message.trim().length < 10)
      return 'Message is too short. Please provide more detail.'
    return null
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Honeypot check — bots fill hidden fields
    if (honeypotRef.current?.value) return

    // Rate limit
    if (isRateLimited()) {
      setError(
        `Please wait ${getRateLimitRemaining()} more minute(s) before sending another message.`
      )
      return
    }

    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError('')

    // Save email before clearing form
    const emailSnapshot = form.email.trim()

    try {
      let attachment_url = null

      // Upload attachment if provided
      if (attachment) {
        setUploading(true)
        const path = `contact/${Date.now()}_${attachment.name}`
        const { error: upErr } = await supabase.storage
          .from('documents')
          .upload(path, attachment)
        if (!upErr) {
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(path)
          attachment_url = urlData?.publicUrl || null
        }
        setUploading(false)
      }

      // Insert into Supabase
      const { error: dbErr } = await supabase
        .from('contact_messages')
        .insert({
          name:           form.name.trim(),
          email:          form.email.trim().toLowerCase(),
          subject:        form.subject,
          message:        form.message.trim(),
          attachment_url,
          created_at:     new Date().toISOString(),
        })

      if (dbErr) throw dbErr

      // Rate limit stamp
      localStorage.setItem(RATE_KEY, String(Date.now()))

      setSubmittedEmail(emailSnapshot)
      setSuccess(true)
      setForm({
        name:    '',
        email:   '',
        subject: 'General Question',
        message: '',
      })
      setAttachment(null)

    } catch (err) {
      console.error('Contact form error:', err)
      // Real error — don't fake success
      setError(
        `Failed to send message: ${err.message}. Please email us directly at support@barprepai.com`
      )
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  const handleReset = () => {
    setSuccess(false)
    setSubmittedEmail('')
    setError('')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

      {/* ── Header ── */}
      <div className="text-center space-y-2">
        <div className="text-4xl">📞</div>
        <h1 className="text-3xl font-black text-slate-900">Contact Us</h1>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          We typically respond within 24–48 hours on business days. For
          instant answers, check our{' '}
          <Link to="/faq" className="text-blue-600 hover:underline">
            FAQ
          </Link>{' '}
          first.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left: Contact Info ── */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-800">
            Get In Touch
          </h2>

          {/* Contact cards */}
          {CONTACT_INFO.map(({ icon, title, value, href }) => (
            <div key={title}
                 className="bg-white border border-slate-200 rounded-2xl
                             p-4 space-y-1">
              <div className="flex items-center gap-2">
                <span>{icon}</span>
                <p className="text-xs font-bold text-slate-500
                               uppercase tracking-wide">
                  {title}
                </p>
              </div>
              <a
                href={href}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                {value}
              </a>
            </div>
          ))}

          {/* Response times */}
          <div className="bg-white border border-slate-200 rounded-2xl
                          p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span>⏰</span>
              <p className="text-xs font-bold text-slate-500 uppercase
                             tracking-wide">
                Response Times
              </p>
            </div>
            <div className="space-y-1">
              {RESPONSE_TIMES.map(({ label, time }) => (
                <div key={label}
                     className="flex justify-between text-xs text-slate-600">
                  <span>{label}</span>
                  <span className="font-semibold text-slate-800">{time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ CTA */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl
                          p-4 space-y-2">
            <p className="text-xs font-bold text-blue-800">💡 Quick Help</p>
            <p className="text-xs text-blue-700">
              Most questions are answered in our FAQ instantly.
            </p>
            <Link
              to="/faq"
              className="block text-center py-2 bg-blue-600 text-white
                         text-xs font-bold rounded-xl hover:bg-blue-700
                         transition-colors"
            >
              Browse FAQ →
            </Link>
          </div>

          {/* Blog CTA */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl
                          p-4 space-y-2">
            <p className="text-xs font-bold text-slate-700">
              📰 Bar Prep Blog
            </p>
            <p className="text-xs text-slate-500">
              Get daily tips, updates and exam strategies from our AI blog.
            </p>
            <Link
              to="/blog"
              className="block text-center py-2 border border-slate-200
                         text-slate-600 text-xs font-bold rounded-xl
                         hover:bg-slate-100 transition-colors"
            >
              Read Blog →
            </Link>
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div className="lg:col-span-2">
          {success ? (
            /* ── Success state ── */
            <div className="bg-green-50 border border-green-200 rounded-2xl
                            p-8 text-center space-y-4">
              <div className="text-5xl">✅</div>
              <h2 className="text-xl font-bold text-green-900">
                Message Sent!
              </h2>
              <p className="text-sm text-green-700">
                Thank you for reaching out. We will get back to you at{' '}
                <strong>{submittedEmail}</strong> within 24–48 business hours.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="px-6 py-2 text-sm font-medium border
                             border-green-300 text-green-700 rounded-xl
                             hover:bg-green-100 transition-colors"
                >
                  Send Another
                </button>
                <Link
                  to="/faq"
                  className="px-6 py-2 text-sm font-bold bg-green-600
                             text-white rounded-xl hover:bg-green-700
                             transition-colors"
                >
                  Browse FAQ →
                </Link>
              </div>
            </div>
          ) : (
            /* ── Form ── */
            <div className="bg-white border border-slate-200 rounded-2xl
                            p-6 space-y-5">
              <h2 className="text-lg font-bold text-slate-900">
                Send a Message
              </h2>

              {/* Honeypot — hidden from real users, bots fill it */}
              <input
                ref={honeypotRef}
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                style={{ display: 'none' }}
                aria-hidden="true"
              />

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                {/* Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400
                                       uppercase tracking-wide mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="John Smith"
                      value={form.name}
                      onChange={e => setField('name', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl
                                 px-4 py-2.5 text-sm focus:outline-none
                                 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400
                                       uppercase tracking-wide mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="john@example.com"
                      value={form.email}
                      onChange={e => setField('email', e.target.value)}
                      className={`
                        w-full border rounded-xl px-4 py-2.5 text-sm
                        focus:outline-none transition-colors
                        ${form.email && !isValidEmail(form.email)
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-slate-200 focus:border-blue-500'
                        }
                      `}
                    />
                    {form.email && !isValidEmail(form.email) && (
                      <p className="text-[10px] text-red-500 mt-1">
                        Please enter a valid email address
                      </p>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-slate-400
                                     uppercase tracking-wide mb-2">
                    Subject
                  </label>
                  <select
                    value={form.subject}
                    onChange={e => setField('subject', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl
                               px-4 py-2.5 text-sm focus:outline-none
                               focus:border-blue-500 transition-colors
                               bg-white"
                  >
                    {SUBJECTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold text-slate-400
                                     uppercase tracking-wide mb-2">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Describe your question or issue in detail..."
                    value={form.message}
                    onChange={e => setField('message', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl
                               px-4 py-2.5 text-sm resize-none
                               focus:outline-none focus:border-blue-500
                               transition-colors"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-slate-400">
                      Be as detailed as possible
                    </p>
                    <p className={`text-[10px] ${
                      form.message.length > 2000
                        ? 'text-red-500'
                        : 'text-slate-400'
                    }`}>
                      {form.message.length} / 2000
                    </p>
                  </div>
                </div>

                {/* Attachment — for bug reports */}
                {form.subject === 'Bug Report' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400
                                       uppercase tracking-wide mb-2">
                      Screenshot (optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={e => setAttachment(e.target.files?.[0] || null)}
                      className="w-full text-sm text-slate-500
                                 file:mr-4 file:py-1.5 file:px-3
                                 file:rounded-lg file:border-0
                                 file:text-xs file:font-medium
                                 file:bg-slate-100 file:text-slate-700
                                 hover:file:bg-slate-200"
                    />
                    {attachment && (
                      <p className="text-[10px] text-green-600 mt-1">
                        ✅ {attachment.name}
                      </p>
                    )}
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200
                                  rounded-xl text-red-700 text-sm flex
                                  items-start gap-2">
                    <span className="shrink-0">❌</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || uploading || form.message.length > 2000}
                  className="w-full py-3 bg-blue-600 text-white font-bold
                             rounded-xl hover:bg-blue-700 transition-colors
                             disabled:opacity-60 flex items-center
                             justify-center gap-2 min-h-[48px]"
                >
                  {loading || uploading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      {uploading ? 'Uploading…' : 'Sending…'}
                    </>
                  ) : (
                    '📤 Send Message'
                  )}
                </button>

                <p className="text-[10px] text-slate-400 text-center">
                  By submitting, you agree to our{' '}
                  <Link to="/privacy"
                        className="text-blue-500 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
