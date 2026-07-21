import { Link } from 'react-router-dom'

const Section = ({ title, children }) => (
  <div className="space-y-3">
    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    <div className="text-slate-600 text-sm leading-relaxed space-y-2">
      {children}
    </div>
  </div>
)

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="text-center space-y-2 pb-6 border-b border-slate-200">
        <div className="text-4xl">🔒</div>
        <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="text-slate-500 text-sm">
          Last updated: {new Date().toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
          })}
        </p>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          At BarPrep AI, we take your privacy seriously.
          This policy explains what data we collect,
          how we use it, and your rights.
        </p>
      </div>

      <div className="space-y-8">

        <Section title="1. Information We Collect">
          <p>We collect the following types of information:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <span className="font-semibold text-slate-800">
                Account Information:
              </span>{' '}
              Your email address and password (encrypted) when you create an account.
            </li>
            <li>
              <span className="font-semibold text-slate-800">
                Study Data:
              </span>{' '}
              Your exam attempts, scores, chat messages, assignments,
              and study plan preferences.
            </li>
            <li>
              <span className="font-semibold text-slate-800">
                Usage Data:
              </span>{' '}
              Pages visited, features used, and time spent in the app
              to help us improve the service.
            </li>
            <li>
              <span className="font-semibold text-slate-800">
                Device Information:
              </span>{' '}
              Browser type, operating system, and IP address for security purposes.
            </li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>To provide and personalize your bar exam preparation experience</li>
            <li>To power AI recommendations based on your progress and weak topics</li>
            <li>To analyze your assignments and generate feedback</li>
            <li>To save your study sessions, chat history, and exam attempts</li>
            <li>To send important account notifications (not marketing spam)</li>
            <li>To improve our AI models and app features</li>
            <li>To ensure the security and integrity of our platform</li>
          </ul>
        </Section>

        <Section title="3. AI & Data Processing">
          <p>
            BarPrep AI uses artificial intelligence to power study recommendations,
            question generation, and assignment analysis. When you interact with
            our AI features:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              Your questions and assignment text may be sent to AI providers
              (such as OpenAI or Google) for processing.
            </li>
            <li>
              We do not store your raw AI conversations with third-party providers
              beyond what is necessary for the service.
            </li>
            <li>
              AI providers have their own privacy policies which apply to
              data processed through their APIs.
            </li>
            <li>
              Do not submit sensitive personal information (SSN, financial data,
              etc.) in your assignments or chat messages.
            </li>
          </ul>
        </Section>

        <Section title="4. Data Storage & Security">
          <p>
            Your data is stored securely using Supabase, a trusted cloud
            database provider with enterprise-grade security:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>All data is encrypted in transit using SSL/TLS</li>
            <li>Passwords are hashed and never stored in plain text</li>
            <li>Row-level security ensures you can only access your own data</li>
            <li>Regular security audits and backups are performed</li>
            <li>Data is stored in secure cloud infrastructure</li>
          </ul>
        </Section>

        <Section title="5. Cookies">
          <p>
            We use cookies to keep you logged in, remember your preferences,
            and analyze app usage. See our{' '}
            <Link to="/cookies"
              className="text-blue-600 hover:underline font-medium">
              Cookie Policy
            </Link>{' '}
            for full details.
          </p>
        </Section>

        <Section title="6. Data Sharing">
          <p>
            We do <span className="font-bold text-slate-800">NOT</span>{' '}
            sell your personal data. We may share data with:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <span className="font-semibold text-slate-800">
                Service Providers:
              </span>{' '}
              Supabase (database), AI API providers (question generation),
              for the sole purpose of providing our service.
            </li>
            <li>
              <span className="font-semibold text-slate-800">
                Legal Requirements:
              </span>{' '}
              If required by law, court order, or to protect our rights.
            </li>
          </ul>
        </Section>

        <Section title="7. Your Rights">
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
              Opt out of non-essential data processing
            </li>
          </ul>
          <p className="mt-2">
            To exercise these rights, contact us at{' '}
            <a href="mailto:privacy@barprepai.com"
              className="text-blue-600 hover:underline">
              privacy@barprepai.com
            </a>
          </p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>
            BarPrep AI is designed for adults preparing for the bar exam.
            We do not knowingly collect data from anyone under 18 years of age.
            If you believe a minor has created an account, please contact us immediately.
          </p>
        </Section>

        <Section title="9. GDPR & CCPA Compliance">
          <p>
            If you are located in the European Union or California,
            you have additional rights under GDPR and CCPA respectively,
            including the right to know, delete, and opt out of data sale.
            We honor all such requests submitted to our privacy email.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time.
            We will notify you of significant changes via email or
            an in-app notification. Continued use of the app after
            changes constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section title="11. Contact Us">
          <p>
            For privacy-related questions or requests:
          </p>
          <div className="bg-slate-50 border border-slate-200
                          rounded-xl p-4 space-y-1">
            <p><span className="font-semibold">Email:</span>{' '}
              <a href="mailto:privacy@barprepai.com"
                className="text-blue-600 hover:underline">
                privacy@barprepai.com
              </a>
            </p>
            <p><span className="font-semibold">Response Time:</span>{' '}
              Within 30 days
            </p>
          </div>
        </Section>

      </div>

      {/* Bottom Links */}
      <div className="border-t border-slate-200 pt-6 flex flex-wrap gap-3">
        <Link to="/terms"
          className="text-sm text-blue-600 hover:underline font-medium">
          Terms of Service →
        </Link>
        <Link to="/cookies"
          className="text-sm text-blue-600 hover:underline font-medium">
          Cookie Policy →
        </Link>
        <Link to="/disclaimer"
          className="text-sm text-blue-600 hover:underline font-medium">
          Disclaimer →
        </Link>
      </div>

    </div>
  )
}
