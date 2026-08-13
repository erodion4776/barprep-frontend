import { useEffect }  from 'react'
import { Link }       from 'react-router-dom'

const LAST_UPDATED  = 'January 15, 2025'
const PRIVACY_EMAIL = 'privacy@barprepai.com'

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

const SECTIONS = [
  { id: 'collect',  label: '1. Information We Collect'   },
  { id: 'use',      label: '2. How We Use It'            },
  { id: 'ai',       label: '3. AI & Data Processing'     },
  { id: 'blog',     label: '4. Blog & Scraper Data'      },
  { id: 'storage',  label: '5. Storage & Security'       },
  { id: 'cookies',  label: '6. Cookies'                  },
  { id: 'sharing',  label: '7. Data Sharing'             },
  { id: 'email',    label: '8. Email & Newsletter'       },
  { id: 'rights',   label: '9. Your Rights'              },
  { id: 'children', label: '10. Children\'s Privacy'     },
  { id: 'gdpr',     label: '11. GDPR & CCPA'             },
  { id: 'changes',  label: '12. Policy Changes'          },
  { id: 'contact',  label: '13. Contact Us'              },
]

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy — BarPrep AI'
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

      <div className="text-center space-y-2 pb-6 border-b border-slate-200">
        <div className="text-4xl">🔒</div>
        <h1 className="text-3xl font-black text-slate-900">Privacy Policy</h1>
        <p className="text-slate-500 text-sm">
          Last updated: <strong>{LAST_UPDATED}</strong>
        </p>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          At BarPrep AI, we take your privacy seriously. This policy explains
          what data we collect, how we use it, and your rights.
        </p>
      </div>

      <nav className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
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

        <Section id="collect" title="1. Information We Collect">
          <p>We collect the following types of information:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <span className="font-semibold text-slate-800">Account Information:</span>{' '}
              Your email address and encrypted password when you create an account.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Study Data:</span>{' '}
              Exam attempts, scores, chat messages, assignments, watched modules,
              and study plan preferences.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Usage Data:</span>{' '}
              Pages visited, features used, and time spent in the app.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Device Information:</span>{' '}
              Browser type, operating system, and IP address for security.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Newsletter Email:</span>{' '}
              If you subscribe to our newsletter, we store your email address.
            </li>
          </ul>
        </Section>

        <Section id="use" title="2. How We Use Your Information">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>To provide and personalize your bar exam preparation experience</li>
            <li>To power AI recommendations based on your progress and weak topics</li>
            <li>To analyze your assignments and generate AI feedback</li>
            <li>To save your study sessions, chat history, and exam attempts</li>
            <li>To generate your daily AI study plan</li>
            <li>To curate and generate blog content relevant to your weak topics</li>
            <li>To send important account notifications</li>
            <li>To improve our AI models and app features</li>
            <li>To ensure the security and integrity of our platform</li>
          </ul>
        </Section>

        <Section id="ai" title="3. AI & Data Processing">
          <p>
            BarPrep AI uses artificial intelligence to power study recommendations,
            question generation, and assignment analysis. When you interact with
            our AI features:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              Your questions and assignment text may be sent to AI providers
              (such as Groq or OpenAI-compatible providers) for processing.
            </li>
            <li>
              We do not store your raw AI conversations with third-party providers
              beyond what is necessary for the service.
            </li>
            <li>
              AI providers have their own privacy policies which apply to data
              processed through their APIs.
            </li>
            <li>
              Do not submit sensitive personal information (SSN, financial data,
              etc.) in assignments or chat messages.
            </li>
            <li>
              AI-generated responses may be saved to your account as part of your
              chat history for continuity.
            </li>
          </ul>
        </Section>

        <Section id="blog" title="4. Blog & Web Scraper Data">
          <p>
            BarPrep AI operates an AI-powered blog and a web content scraper:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <span className="font-semibold text-slate-800">Pollinations AI:</span>{' '}
              Blog articles and cover images are generated by Pollinations AI.
              Topic prompts (not personal data) are sent to Pollinations AI.
              See{' '}
              <a
                href="https://pollinations.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Pollinations AI's privacy policy
              </a>.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Web Scraper:</span>{' '}
              We scrape publicly available bar prep content from authorized sources
              to build our AI knowledge base. No personal user data is scraped.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Blog Reading:</span>{' '}
              We may track which blog posts you read to personalize content
              recommendations.
            </li>
            <li>
              <span className="font-semibold text-slate-800">AI Blog Disclaimer:</span>{' '}
              Blog content is AI-generated and not reviewed by licensed attorneys.
              It is for educational purposes only.
            </li>
          </ul>
        </Section>

        <Section id="storage" title="5. Data Storage & Security">
          <p>
            Your data is stored securely using Supabase:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>All data is encrypted in transit using SSL/TLS</li>
            <li>Passwords are hashed and never stored in plain text</li>
            <li>Row-level security ensures you can only access your own data</li>
            <li>Regular security audits and backups are performed</li>
            <li>Data is stored in secure AWS cloud infrastructure</li>
            <li>
              Uploaded files (PDFs, assignments) are stored in Supabase Storage
              with private access controls
            </li>
          </ul>
        </Section>

        <Section id="cookies" title="6. Cookies">
          <p>
            We use cookies to keep you logged in, remember your preferences,
            and analyze app usage. See our{' '}
            <Link to="/cookies" className="text-blue-600 hover:underline font-medium">
              Cookie Policy
            </Link>{' '}
            for full details.
          </p>
        </Section>

        <Section id="sharing" title="7. Data Sharing">
          <p>
            We do <span className="font-bold text-slate-800">NOT</span> sell
            your personal data. We may share data only with:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <span className="font-semibold text-slate-800">Supabase:</span>{' '}
              Database, authentication, and file storage provider.
            </li>
            <li>
              <span className="font-semibold text-slate-800">AI Providers:</span>{' '}
              For AI chat and question generation. Only your typed input is sent —
              not your personal account data.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Pollinations AI:</span>{' '}
              For blog article and image generation. Topic prompts only.
            </li>
            <li>
              <span className="font-semibold text-slate-800">YouTube:</span>{' '}
              Embedded tutorial videos may be subject to YouTube/Google's policies.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Legal Requirements:</span>{' '}
              If required by law or court order.
            </li>
          </ul>
        </Section>

        <Section id="email" title="8. Email & Newsletter">
          <p>If you subscribe to our newsletter or contact form:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              Your email is stored in our Supabase database and used only to send
              study tips, bar prep updates, and product announcements.
            </li>
            <li>
              We never sell or share your email address with third parties for
              marketing purposes.
            </li>
            <li>
              You can unsubscribe at any time by emailing{' '}
              <a href={`mailto:${PRIVACY_EMAIL}`} className="text-blue-600 hover:underline">
                {PRIVACY_EMAIL}
              </a>{' '}
              with the subject "Unsubscribe".
            </li>
            <li>
              Contact form submissions are stored in Supabase and used only to
              respond to your inquiry.
            </li>
          </ul>
        </Section>

        <Section id="rights" title="9. Your Rights">
          <p>You have the following rights regarding your data:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <span className="font-semibold text-slate-800">Access:</span>{' '}
              Request a copy of all data we hold about you
            </li>
            <li>
              <span className="font-semibold text-slate-800">Correction:</span>{' '}
              Update or correct your personal information
            </li>
            <li>
              <span className="font-semibold text-slate-800">Deletion:</span>{' '}
              Request deletion of your account and all associated data
            </li>
            <li>
              <span className="font-semibold text-slate-800">Portability:</span>{' '}
              Export your study data in a readable format
            </li>
            <li>
              <span className="font-semibold text-slate-800">Objection:</span>{' '}
              Opt out of non-essential data processing and newsletter emails
            </li>
            <li>
              <span className="font-semibold text-slate-800">Cookie Control:</span>{' '}
              Manage cookie preferences via our{' '}
              <Link to="/cookies" className="text-blue-600 hover:underline">
                Cookie Settings
              </Link>
            </li>
          </ul>
          <p className="mt-2">
            To exercise these rights, contact us at{' '}
            <a href={`mailto:${PRIVACY_EMAIL}`} className="text-blue-600 hover:underline">
              {PRIVACY_EMAIL}
            </a>.
            We respond within 30 days.
          </p>
        </Section>

        <Section id="children" title="10. Children's Privacy">
          <p>
            BarPrep AI is designed for adults (18+) preparing for the bar exam.
            We do not knowingly collect data from anyone under 18 years of age.
            If you believe a minor has created an account, please contact us at{' '}
            <a href={`mailto:${PRIVACY_EMAIL}`} className="text-blue-600 hover:underline">
              {PRIVACY_EMAIL}
            </a>.
          </p>
        </Section>

        <Section id="gdpr" title="11. GDPR & CCPA Compliance">
          <p>Depending on your location, you may have additional rights:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {[
              {
                law:  'GDPR (EU/UK)',
                desc: 'Right to access, rectification, erasure, restriction, portability, and objection.',
              },
              {
                law:  'CCPA (California)',
                desc: 'Right to know, delete, and opt-out of sale (we do not sell data).',
              },
            ].map(({ law, desc }) => (
              <div key={law} className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-800 mb-1">{law}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-3">
            To exercise these rights, email{' '}
            <a href={`mailto:${PRIVACY_EMAIL}`} className="text-blue-600 hover:underline">
              {PRIVACY_EMAIL}
            </a>.
          </p>
        </Section>

        <Section id="changes" title="12. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of significant changes via email or an in-app notification.
            Continued use of the app after changes constitutes acceptance.
          </p>
        </Section>

        <Section id="contact" title="13. Contact Us">
          <p>For privacy-related questions or requests:</p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <p>
              <span className="font-semibold text-slate-800">Email:</span>{' '}
              <a href={`mailto:${PRIVACY_EMAIL}`} className="text-blue-600 hover:underline">
                {PRIVACY_EMAIL}
              </a>
            </p>
            <p>
              <span className="font-semibold text-slate-800">Response Time:</span>{' '}
              Within 30 days
            </p>
            <p>
              <span className="font-semibold text-slate-800">Data Requests:</span>{' '}
              Include "Privacy Request" in your subject line
            </p>
          </div>
        </Section>

      </div>

      <div className="border-t border-slate-200 pt-6 flex flex-wrap gap-4">
        <Link to="/terms"      className="text-sm text-blue-600 hover:underline font-medium">Terms of Service →</Link>
        <Link to="/cookies"    className="text-sm text-blue-600 hover:underline font-medium">Cookie Policy →</Link>
        <Link to="/disclaimer" className="text-sm text-blue-600 hover:underline font-medium">Disclaimer →</Link>
        <Link to="/contact"    className="text-sm text-blue-600 hover:underline font-medium">Contact Us →</Link>
      </div>

    </div>
  )
}
