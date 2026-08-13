import { Link } from 'react-router-dom'

// ── IMPORTANT: Update this date manually when policy changes ──────────────────
const LAST_UPDATED = 'January 15, 2025'

// ── Cookie data ───────────────────────────────────────────────────────────────
const COOKIES = [
  {
    name:     'sb-auth-token',
    type:     'Essential',
    purpose:  'Keeps you logged in securely via Supabase authentication',
    duration: 'Session / 1 week',
    provider: 'Supabase',
  },
  {
    name:     'cookie_consent',
    type:     'Essential',
    purpose:  'Remembers your cookie consent preference',
    duration: '1 year',
    provider: 'BarPrep AI',
  },
  {
    name:     'bar_exam_date',
    type:     'Functional',
    purpose:  'Stores your exam date for study plan calculations',
    duration: 'Until cleared',
    provider: 'BarPrep AI (localStorage)',
  },
  {
    name:     'bar_study_plan',
    type:     'Functional',
    purpose:  'Stores your generated study plan locally',
    duration: 'Until regenerated',
    provider: 'BarPrep AI (localStorage)',
  },
  {
    name:     'admin_token',
    type:     'Essential',
    purpose:  'Authenticates admin dashboard access',
    duration: 'Session',
    provider: 'BarPrep AI (localStorage)',
  },
  {
    name:     'barpre_affirmation',
    type:     'Functional',
    purpose:  'Caches your daily affirmation to reduce API calls',
    duration: '24 hours',
    provider: 'BarPrep AI (localStorage)',
  },
  {
    name:     'admin_login_attempts',
    type:     'Essential',
    purpose:  'Tracks failed admin login attempts for security lockout',
    duration: '15 minutes',
    provider: 'BarPrep AI (localStorage)',
  },
]

// New cookies for blog/AI/scraper system
const NEW_COOKIES = [
  {
    name:     'pollinations_cache_*',
    type:     'Functional',
    purpose:  'Caches AI-generated blog content and images from Pollinations AI',
    duration: '24 hours',
    provider: 'Pollinations AI / BarPrep AI',
  },
  {
    name:     'blog_read_*',
    type:     'Functional',
    purpose:  'Tracks which blog posts you have read for personalization',
    duration: '30 days',
    provider: 'BarPrep AI (localStorage)',
  },
]

const ALL_COOKIES = [...COOKIES, ...NEW_COOKIES]

const COOKIE_TYPES = [
  {
    type:  '✅ Essential Cookies',
    color: 'bg-green-50 border-green-200',
    desc:  'Required for the app to function. Cannot be disabled. These handle authentication, security, and your consent record.',
  },
  {
    type:  '⚙️ Functional Cookies',
    color: 'bg-blue-50 border-blue-200',
    desc:  'Remember your preferences such as exam date, study plan, daily affirmation, and watched videos. Disabling these may limit app functionality.',
  },
  {
    type:  '📊 Analytics Cookies',
    color: 'bg-purple-50 border-purple-200',
    desc:  'Help us understand how users interact with the app so we can improve it. You can decline these without affecting core functionality.',
  },
  {
    type:  '🤖 AI Session Cookies',
    color: 'bg-amber-50 border-amber-200',
    desc:  'Store your AI chat sessions and blog personalization data locally. Used to maintain continuity between study sessions.',
  },
]

const THIRD_PARTIES = [
  {
    name: 'Supabase',
    desc: 'Authentication, database, and file storage service',
    url:  'https://supabase.com/privacy',
  },
  {
    name: 'YouTube',
    desc: 'Embedded tutorial videos — YouTube may set their own cookies when videos are loaded',
    url:  'https://policies.google.com/privacy',
  },
  {
    name: 'Pollinations AI',
    desc: 'AI text and image generation for blog posts and content — no personal data sent',
    url:  'https://pollinations.ai',
  },
  {
    name: 'Groq / OpenAI-compatible providers',
    desc: 'Powers the AI Coach chat — only your typed questions are processed, not personal data',
    url:  'https://groq.com/privacy',
  },
]

const SECTIONS = [
  { id: 'what',      label: '1. What Are Cookies?'           },
  { id: 'types',     label: '2. Types We Use'                },
  { id: 'specific',  label: '3. Specific Cookies'            },
  { id: 'third',     label: '4. Third Parties'               },
  { id: 'managing',  label: '5. Managing Preferences'        },
  { id: 'gdpr',      label: '6. Your Legal Rights'           },
  { id: 'contact',   label: '7. Contact'                     },
]

// ── Section component ─────────────────────────────────────────────────────────
function Section({ id, title, children }) {
  return (
    <div id={id} className="space-y-3 scroll-mt-20">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <div className="text-slate-600 text-sm leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  )
}

// ── Type badge ────────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const styles = {
    Essential:  'bg-green-100 text-green-700',
    Functional: 'bg-blue-100 text-blue-700',
    Analytics:  'bg-purple-100 text-purple-700',
    AI:         'bg-amber-100 text-amber-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold
      ${styles[type] || 'bg-slate-100 text-slate-600'}`}>
      {type}
    </span>
  )
}

// ── Reset helper — uses custom event (matches CookieBanner) ───────────────────
function resetCookiePreferences() {
  localStorage.removeItem('cookie_consent')
  localStorage.removeItem('cookie_consent_date')
  // Fire custom event so CookieBanner reappears without reload
  window.dispatchEvent(new Event('cookie_consent_reset'))
  // Fallback reload after short delay
  setTimeout(() => window.location.reload(), 150)
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CookiePolicy() {

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

      {/* ── Header ── */}
      <div className="text-center space-y-2 pb-6 border-b border-slate-200">
        <div className="text-4xl">🍪</div>
        <h1 className="text-3xl font-black text-slate-900">Cookie Policy</h1>
        <p className="text-slate-500 text-sm">
          Last updated: <strong>{LAST_UPDATED}</strong>
        </p>
        <p className="text-slate-400 text-xs max-w-md mx-auto">
          This policy explains how BarPrep AI uses cookies and similar
          browser storage technologies on our platform.
        </p>
      </div>

      {/* ── Jump links ── */}
      <nav className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <p className="text-xs font-bold text-slate-500 uppercase
                      tracking-wider mb-3">
          Jump to Section
        </p>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="text-xs text-blue-600 hover:text-blue-800
                         hover:underline transition-colors px-2 py-1
                         bg-white border border-slate-200 rounded-lg"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-10">

        {/* ── 1. What are cookies ── */}
        <Section id="what" title="1. What Are Cookies?">
          <p>
            Cookies are small text files stored on your device when you
            visit a website. They help the website remember information
            about your visit, making your next visit easier and the site
            more useful to you.
          </p>
          <p>
            BarPrep AI also uses <strong>localStorage</strong> — a similar
            browser storage technology — to save your study preferences
            and progress data locally on your device. Unlike cookies,
            localStorage data is never automatically sent to our servers.
          </p>
          <p>
            We do <strong>not</strong> use cookies for advertising or
            sell your data to third parties.
          </p>
        </Section>

        {/* ── 2. Types ── */}
        <Section id="types" title="2. Types of Cookies We Use">
          <div className="space-y-3">
            {COOKIE_TYPES.map(({ type, color, desc }) => (
              <div
                key={type}
                className={`border rounded-xl p-4 ${color}`}
              >
                <p className="font-bold text-slate-800 text-sm">{type}</p>
                <p className="text-slate-600 text-xs mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 3. Specific cookies ── */}
        <Section id="specific" title="3. Specific Cookies We Use">
          <p>
            The table below lists every cookie and localStorage item
            used by BarPrep AI:
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  {[
                    'Cookie Name', 'Type', 'Purpose',
                    'Duration', 'Provider',
                  ].map(h => (
                    <th
                      key={h}
                      className="text-left p-3 font-bold text-slate-700
                                 border-b border-slate-200 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_COOKIES.map((c, i) => (
                  <tr
                    key={i}
                    className={`
                      ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                      hover:bg-blue-50/30 transition-colors
                    `}
                  >
                    <td className="p-3 border-b border-slate-100
                                   font-mono text-slate-700 whitespace-nowrap">
                      {c.name}
                    </td>
                    <td className="p-3 border-b border-slate-100">
                      <TypeBadge type={c.type} />
                    </td>
                    <td className="p-3 border-b border-slate-100
                                   text-slate-600">
                      {c.purpose}
                    </td>
                    <td className="p-3 border-b border-slate-100
                                   text-slate-600 whitespace-nowrap">
                      {c.duration}
                    </td>
                    <td className="p-3 border-b border-slate-100
                                   text-slate-600 whitespace-nowrap">
                      {c.provider}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── 4. Third parties ── */}
        <Section id="third" title="4. Third-Party Services">
          <p>
            We use the following third-party services that may set their
            own cookies or process data:
          </p>
          <div className="space-y-3">
            {THIRD_PARTIES.map(({ name, desc, url }) => (
              <div
                key={name}
                className="bg-white border border-slate-200 rounded-xl
                           p-4 flex items-start justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {name}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                </div>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-600 hover:underline
                             shrink-0 mt-0.5"
                >
                  Privacy →
                </a>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 5. Managing preferences ── */}
        <Section id="managing" title="5. Managing Your Cookie Preferences">
          <p>You can control cookies in the following ways:</p>

          <div className="space-y-3">
            {[
              {
                title: 'Cookie Banner',
                desc:  'Use our cookie consent banner to accept or decline non-essential cookies when you first visit the site.',
              },
              {
                title: 'Browser Settings',
                desc:  'Most browsers allow you to block or delete cookies in their privacy/security settings.',
              },
              {
                title: 'Reset Preferences',
                desc:  'Use the button below to clear your cookie consent and see the banner again.',
              },
            ].map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full
                                  mt-1.5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={resetCookiePreferences}
            className="mt-3 px-5 py-2.5 bg-slate-900 text-white text-sm
                       font-bold rounded-xl hover:bg-slate-700
                       transition-colors flex items-center gap-2"
          >
            🔄 Reset Cookie Preferences
          </button>

          <div className="bg-amber-50 border border-amber-200
                          rounded-xl p-4 mt-3">
            <p className="text-xs text-amber-800">
              ⚠️ <span className="font-bold">Note:</span> Disabling
              essential cookies will prevent you from logging in and
              using the app. Functional cookies store your study
              preferences — clearing them will reset your local settings.
            </p>
          </div>
        </Section>

        {/* ── 6. Legal rights ── */}
        <Section id="gdpr" title="6. Your Legal Rights">
          <p>
            Depending on your location, you may have rights under
            applicable privacy laws including:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                law:    'GDPR (EU/UK)',
                rights: 'Right to access, rectification, erasure, portability, and objection',
              },
              {
                law:    'CCPA (California)',
                rights: 'Right to know, delete, opt-out of sale, and non-discrimination',
              },
              {
                law:    'All Users',
                rights: 'Right to withdraw cookie consent at any time without penalty',
              },
              {
                law:    'Data Requests',
                rights: 'Email privacy@barprepai.com to exercise any of these rights',
              },
            ].map(({ law, rights }) => (
              <div
                key={law}
                className="bg-white border border-slate-200 rounded-xl p-4"
              >
                <p className="text-xs font-bold text-slate-800 mb-1">
                  {law}
                </p>
                <p className="text-xs text-slate-500">{rights}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 7. Contact ── */}
        <Section id="contact" title="7. Contact Us">
          <p>
            For cookie-related questions or to exercise your privacy
            rights, contact us at:
          </p>
          <div className="bg-white border border-slate-200 rounded-xl p-4
                          space-y-1">
            <p className="text-sm font-medium text-slate-800">
              BarPrep AI — Privacy Team
            </p>
            <a
              href="mailto:privacy@barprepai.com"
              className="text-sm text-blue-600 hover:underline"
            >
              privacy@barprepai.com
            </a>
            <p className="text-xs text-slate-400">
              We respond to privacy requests within 30 days.
            </p>
          </div>
        </Section>

      </div>

      {/* ── Footer links ── */}
      <div className="border-t border-slate-200 pt-6 flex flex-wrap gap-4">
        <Link
          to="/privacy"
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          Privacy Policy →
        </Link>
        <Link
          to="/terms"
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          Terms of Service →
        </Link>
        <Link
          to="/settings"
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          Cookie Settings →
        </Link>
      </div>

    </div>
  )
}
