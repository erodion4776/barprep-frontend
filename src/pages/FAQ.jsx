import { useState } from 'react'
import { Link } from 'react-router-dom'

const faqs = [
  {
    category: '🤖 About BarPrep AI',
    questions: [
      {
        q: 'What is BarPrep AI?',
        a: 'BarPrep AI is an AI-powered bar exam preparation platform. It provides an AI coach for legal questions, mock exam practice with instant grading, personalized study plans, video tutorials, and assignment analysis — all powered by artificial intelligence.',
      },
      {
        q: 'Is BarPrep AI affiliated with the NCBE or any bar association?',
        a: 'No. BarPrep AI is an independent educational tool and is not affiliated with, endorsed by, or connected to the National Conference of Bar Examiners (NCBE), any state bar association, or any official bar examination authority.',
      },
      {
        q: 'What bar exams does BarPrep AI cover?',
        a: 'BarPrep AI primarily focuses on the Uniform Bar Exam (UBE) content including all 10 MBE subjects (Constitutional Law, Contracts, Torts, Criminal Law, Civil Procedure, Evidence, Real Property, Business Associations, Family Law, and Wills & Trusts) as well as MEE essay topics.',
      },
      {
        q: 'Can BarPrep AI guarantee I will pass the bar exam?',
        a: 'No. We cannot guarantee bar exam results. BarPrep AI is a study supplement designed to improve your preparation. Passing depends on many factors including individual effort, baseline knowledge, and exam conditions. We strongly recommend using BarPrep AI alongside accredited bar prep courses.',
      },
    ],
  },
  {
    category: '🔒 Privacy & Data',
    questions: [
      {
        q: 'Is my data safe?',
        a: 'Yes. We use Supabase, an enterprise-grade database with encryption in transit and at rest. Your password is never stored in plain text. Row-level security ensures only you can access your study data.',
      },
      {
        q: 'Does BarPrep AI sell my data?',
        a: 'Absolutely not. We do not sell, rent, or trade your personal data to any third parties. See our Privacy Policy for full details on how we handle your data.',
      },
      {
        q: 'How do I delete my account?',
        a: 'You can request account deletion by contacting us at privacy@barprepai.com. We will delete your account and all associated data within 30 days of your request.',
      },
      {
        q: 'Is my chat data used to train AI models?',
        a: 'Your conversations are processed by AI providers (such as OpenAI or Google) to generate responses. We do not use your personal study data to train our own AI models. Third-party AI providers have their own data policies.',
      },
    ],
  },
  {
    category: '📝 Using the App',
    questions: [
      {
        q: 'How accurate is the AI grading on mock exams?',
        a: 'The AI grading is designed to closely mirror bar exam standards, but it is not perfect. AI assessments are meant to give you directional feedback and help identify weak areas. We recommend treating AI grades as learning tools rather than definitive assessments.',
      },
      {
        q: 'How does the personalized study plan work?',
        a: 'Enter your bar exam date and the AI analyzes your mock exam history, weak topics, and accuracy rates to build a day-by-day study schedule. The plan prioritizes your weakest topics and includes regular reviews and mock exam simulation days.',
      },
      {
        q: 'What file types can I upload for assignment analysis?',
        a: 'You can upload TXT, PDF, and DOC/DOCX files up to 5MB. You can also paste text directly into the text area. The AI will analyze your essay, memo, brief, or practice answer and provide detailed feedback.',
      },
      {
        q: 'How many mock exam questions can I practice?',
        a: 'There is no limit. You can generate as many practice questions as you want across all 10 MBE topics. Each question is AI-generated and unique.',
      },
      {
        q: 'Can I use BarPrep AI on my phone?',
        a: 'Yes. BarPrep AI is fully responsive and works on smartphones, tablets, and desktop computers. We recommend using a tablet or desktop for the best experience with longer study sessions.',
      },
    ],
  },
  {
    category: '💰 Account & Billing',
    questions: [
      {
        q: 'Is BarPrep AI free to use?',
        a: 'BarPrep AI offers a free tier with access to core features. Contact us for information about premium plans with additional features such as unlimited AI coaching sessions and advanced analytics.',
      },
      {
        q: 'How do I reset my password?',
        a: 'Click "Forgot Password" on the login page and enter your email address. You will receive a password reset link within a few minutes. Check your spam folder if you do not see it.',
      },
      {
        q: 'Can I use one account on multiple devices?',
        a: 'Yes. Your account works across all your devices. Your study progress, chat history, and exam attempts are synced via our cloud database.',
      },
    ],
  },
  {
    category: '🛠️ Technical',
    questions: [
      {
        q: 'What browsers are supported?',
        a: 'BarPrep AI works best on modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated to the latest version for the best experience.',
      },
      {
        q: 'What do I do if the AI is not responding?',
        a: 'First, check your internet connection. If the issue persists, try refreshing the page. If you continue to experience problems, please contact our support team with details about the issue.',
      },
      {
        q: 'Is my data backed up?',
        a: 'Yes. Your data is stored in Supabase cloud infrastructure with automatic backups. However, we recommend periodically exporting important study notes for your own records.',
      },
    ],
  },
]

export default function FAQ() {
  const [openItem, setOpenItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = faqs.map(cat => ({
    ...cat,
    questions: cat.questions.filter(
      ({ q, a }) =>
        q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(cat => cat.questions.length > 0)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="text-4xl">❓</div>
        <h1 className="text-3xl font-bold text-slate-900">
          Frequently Asked Questions
        </h1>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          Can't find what you're looking for?{' '}
          <Link to="/contact"
            className="text-blue-600 hover:underline font-medium">
            Contact us
          </Link>
        </p>

        {/* Search */}
        <div className="max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full text-sm"
          />
        </div>
      </div>

      {/* FAQ Items */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-4xl">🔍</p>
          <p className="text-slate-500 text-sm">
            No results found for "{searchQuery}"
          </p>
          <Link to="/contact"
            className="text-blue-600 hover:underline text-sm font-medium">
            Ask us directly →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {filtered.map((cat) => (
            <div key={cat.category} className="space-y-3">
              <h2 className="text-base font-bold text-slate-800
                             uppercase tracking-wide">
                {cat.category}
              </h2>

              <div className="space-y-2">
                {cat.questions.map(({ q, a }) => {
                  const key     = `${cat.category}-${q}`
                  const isOpen  = openItem === key

                  return (
                    <div key={key}
                      className="card bg-white border border-slate-200
                                 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setOpenItem(isOpen ? null : key)}
                        className="w-full flex items-center justify-between
                                   p-4 text-left gap-4">
                        <span className="text-sm font-semibold text-slate-900">
                          {q}
                        </span>
                        <span className={`text-slate-400 text-xs shrink-0
                          transition-transform duration-200
                          ${isOpen ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-slate-100
                                        pt-3 bg-slate-50/50">
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {a}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Still have questions */}
      <div className="card bg-blue-50 border border-blue-200 p-6
                      text-center space-y-3 rounded-2xl">
        <p className="text-lg font-bold text-blue-900">
          Still have questions?
        </p>
        <p className="text-sm text-blue-700">
          Our support team is here to help.
        </p>
        <Link to="/contact"
          className="inline-block btn-primary px-8 py-2.5 text-sm">
          Contact Support →
        </Link>
      </div>

    </div>
  )
}
