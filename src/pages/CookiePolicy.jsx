import { Link } from 'react-router-dom'

const Section = ({ title, children }) => (
  <div className="space-y-3">
    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    <div className="text-slate-600 text-sm leading-relaxed space-y-2">
      {children}
    </div>
  </div>
)

export default function CookiePolicy() {
  const cookies = [
    {
      name: 'sb-auth-token',
      type: 'Essential',
      purpose: 'Keeps you logged in securely via Supabase authentication',
      duration: 'Session / 1 week',
      provider: 'Supabase',
    },
    {
      name: 'cookie_consent',
      type: 'Essential',
      purpose: 'Remembers your cookie consent preference',
      duration: '1 year',
      provider: 'BarPrep AI',
    },
    {
      name: 'bar_exam_date',
      type: 'Functional',
      purpose: 'Stores your exam date for study plan calculations',
      duration: 'Until cleared',
      provider: 'BarPrep AI (localStorage)',
    },
    {
      name: 'bar_study_plan',
      type: 'Functional',
      purpose: 'Stores your generated study plan locally',
      duration: 'Until regenerated',
      provider: 'BarPrep AI (localStorage)',
    },
    {
      name: 'watched_modules_*',
      type: 'Functional',
      purpose: 'Tracks which tutorial videos you have watched',
      duration: 'Until cleared',
      provider: 'BarPrep AI (localStorage)',
    },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

      <div className="text-center space-y-2 pb-6 border-b border-slate-200">
        <div className="text-4xl">🍪</div>
        <h1 className="text-3xl font-bold text-slate-900">Cookie Policy</h1>
        <p className="text-slate-500 text-sm">
          Last updated: {new Date().toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
          })}
        </p>
      </div>

      <div className="space-y-8">

        <Section title="1. What Are Cookies?">
          <p>
            Cookies are small text files stored on your device when you
            visit a website. They help the website remember information
            about your visit, making your next visit easier and the
            site more useful to you.
          </p>
          <p>
            BarPrep AI also uses <strong>localStorage</strong> — a similar
            browser storage technology — to save your study preferences
            and progress data locally on your device.
          </p>
        </Section>

        <Section title="2. Types of Cookies We Use">
          <div className="space-y-3">
            {[
              {
                type: '✅ Essential Cookies',
                color: 'bg-green-50 border-green-200',
                desc: 'Required for the app to function. Cannot be disabled. These handle authentication and security.',
              },
              {
                type: '⚙️ Functional Cookies',
                color: 'bg-blue-50 border-blue-200',
                desc: 'Remember your preferences such as exam date, study plan, and watched videos.',
              },
              {
                type: '📊 Analytics Cookies',
                color: 'bg-purple-50 border-purple-200',
                desc: 'Help us understand how users interact with the app so we can improve it. You can decline these.',
              },
            ].map(({ type, color, desc }) => (
              <div key={type}
                className={`border rounded-xl p-4 ${color}`}>
                <p className="font-bold text-slate-800 text-sm">{type}</p>
                <p className="text-slate-600 text-xs mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="3. Specific Cookies We Use">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  {['Cookie Name', 'Type', 'Purpose', 'Duration', 'Provider'].map(h => (
                    <th key={h}
                      className="text-left p-3 font-bold text-slate-700
                                 border border-slate-200">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cookies.map((c, i) => (
                  <tr key={i}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-3 border border-slate-200 font-mono text-slate-700">
                      {c.name}
                    </td>
                    <td className="p-3 border border-slate-200">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold
                        ${c.type === 'Essential'
                          ? 'bg-green-100 text-green-700'
                          : c.type === 'Functional'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'}`}>
                        {c.type}
                      </span>
                    </td>
                    <td className="p-3 border border-slate-200 text-slate-600">
                      {c.purpose}
                    </td>
                    <td className="p-3 border border-slate-200 text-slate-600">
                      {c.duration}
                    </td>
                    <td className="p-3 border border-slate-200 text-slate-600">
                      {c.provider}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="4. Third-Party Cookies">
          <p>
            We use the following third-party services that may set their own cookies:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <span className="font-semibold text-slate-800">Supabase:</span>{' '}
              Authentication and database service
            </li>
            <li>
              <span className="font-semibold text-slate-800">YouTube:</span>{' '}
              Embedded tutorial videos (if you watch them)
            </li>
            <li>
              <span className="font-semibold text-slate-800">AI Providers:</span>{' '}
              For processing AI chat and question generation
            </li>
          </ul>
        </Section>

        <Section title="5. Managing Your Cookie Preferences">
          <p>You can control cookies in the following ways:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <span className="font-semibold text-slate-800">
                Cookie Banner:
              </span>{' '}
              Use our cookie consent banner to accept or decline
              non-essential cookies when you first visit.
            </li>
            <li>
              <span className="font-semibold text-slate-800">
                Browser Settings:
              </span>{' '}
              Most browsers allow you to block or delete cookies in their settings.
            </li>
            <li>
              <span className="font-semibold text-slate-800">
                Reset Preferences:
              </span>{' '}
              Click the button below to reset your cookie preferences.
            </li>
          </ul>

          <button
            onClick={() => {
              localStorage.removeItem('cookie_consent')
              localStorage.removeItem('cookie_consent_date')
              window.location.reload()
            }}
            className="mt-3 px-5 py-2.5 bg-slate-900 text-white text-sm
                       font-bold rounded-xl hover:bg-slate-700 transition-colors">
            🔄 Reset Cookie Preferences
          </button>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3">
            <p className="text-xs text-amber-800">
              ⚠️ <span className="font-bold">Note:</span> Disabling essential
              cookies will prevent you from logging in and using the app.
            </p>
          </div>
        </Section>

        <Section title="6. Contact Us">
          <p>
            For cookie-related questions, contact us at{' '}
            <a href="mailto:privacy@barprepai.com"
              className="text-blue-600 hover:underline">
              privacy@barprepai.com
            </a>
          </p>
        </Section>

      </div>

      <div className="border-t border-slate-200 pt-6 flex flex-wrap gap-3">
        <Link to="/privacy"
          className="text-sm text-blue-600 hover:underline font-medium">
          Privacy Policy →
        </Link>
        <Link to="/terms"
          className="text-sm text-blue-600 hover:underline font-medium">
          Terms of Service →
        </Link>
      </div>

    </div>
  )
}
