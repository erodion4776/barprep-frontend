import { useEffect } from 'react'
import { Link }      from 'react-router-dom'

const LAST_UPDATED = 'January 15, 2025'
const LEGAL_EMAIL  = 'legal@barprepai.com'

const SECTIONS = [
  { id: 'acceptance',    label: '1. Acceptance of Terms'      },
  { id: 'description',   label: '2. Description of Service'   },
  { id: 'eligibility',   label: '3. Eligibility'              },
  { id: 'disclaimer',    label: '4. AI Disclaimer'            },
  { id: 'blog',          label: '5. Blog & AI Content'        },
  { id: 'acceptable',    label: '6. Acceptable Use'           },
  { id: 'ip',            label: '7. Intellectual Property'    },
  { id: 'privacy',       label: '8. Privacy'                  },
  { id: 'billing',       label: '9. Billing & Cancellation'   },
  { id: 'termination',   label: '10. Account Termination'     },
  { id: 'liability',     label: '11. Limitation of Liability' },
  { id: 'modifications', label: '12. Modifications'           },
  { id: 'governing',     label: '13. Governing Law'           },
  { id: 'contact',       label: '14. Contact'                 },
]

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

export default function TermsOfService() {
  useEffect(() => {
    document.title = 'Terms of Service — BarPrep AI'
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

      <div className="text-center space-y-2 pb-6 border-b border-slate-200">
        <div className="text-4xl">📜</div>
        <h1 className="text-3xl font-black text-slate-900">Terms of Service</h1>
        <p className="text-slate-500 text-sm">
          Last updated: <strong>{LAST_UPDATED}</strong>
        </p>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          Please read these terms carefully before using BarPrep AI.
          By using our service, you agree to these terms.
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

        <Section id="acceptance" title="1. Acceptance of Terms">
          <p>
            By accessing or using BarPrep AI ("the Service"), you agree to be
            bound by these Terms of Service and all applicable laws. If you do
            not agree, please do not use the Service.
          </p>
        </Section>

        <Section id="description" title="2. Description of Service">
          <p>BarPrep AI is an AI-powered educational platform that includes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>AI-powered chat coaching for bar exam topics</li>
            <li>Mock exam questions with AI grading and feedback</li>
            <li>Personalized study plan generation</li>
            <li>Assignment submission and AI analysis</li>
            <li>Video tutorial access and progress tracking</li>
            <li>AI-generated blog content on bar exam topics</li>
            <li>Web-scraped educational content for AI knowledge base</li>
          </ul>
        </Section>

        <Section id="eligibility" title="3. Eligibility">
          <ul className="list-disc pl-5 space-y-1">
            <li>You must be at least 18 years of age to use this Service</li>
            <li>You must provide accurate registration information</li>
            <li>One account per person — no shared accounts</li>
            <li>You are responsible for maintaining account security</li>
            <li>You are responsible for all activity under your account</li>
          </ul>
        </Section>

        <Section id="disclaimer" title="4. Educational Purpose & AI Disclaimer">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <p className="font-bold text-amber-900">⚠️ Important Notice</p>
            <ul className="list-disc pl-5 space-y-1 text-amber-800">
              <li>
                BarPrep AI is an <strong>educational tool only</strong>. It is NOT
                a law firm and does not provide legal advice.
              </li>
              <li>
                AI-generated content may contain errors, omissions, or outdated
                information. Always verify with official sources.
              </li>
              <li>
                We do <strong>not guarantee</strong> that use of this Service will
                result in passing the bar exam.
              </li>
              <li>
                BarPrep AI is not affiliated with the NCBE or any state bar
                association.
              </li>
            </ul>
          </div>
        </Section>

        <Section id="blog" title="5. Blog & AI-Generated Content">
          <p>
            BarPrep AI operates an AI-powered blog. By using the blog feature,
            you acknowledge:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <span className="font-semibold text-slate-800">AI-Generated Articles:</span>{' '}
              Blog posts are written by AI and have not been reviewed by licensed
              attorneys.
            </li>
            <li>
              <span className="font-semibold text-slate-800">No Legal Reliance:</span>{' '}
              Blog content is for general educational purposes only.
            </li>
            <li>
              <span className="font-semibold text-slate-800">AI Images:</span>{' '}
              Blog cover images are AI-generated by Pollinations AI.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Web Scraper:</span>{' '}
              We collect publicly available educational content from authorized
              sources only.
            </li>
          </ul>
        </Section>

        <Section id="acceptable" title="6. Acceptable Use">
          <p>You agree NOT to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Share your account credentials with others</li>
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to reverse engineer or copy our AI systems</li>
            <li>Submit harmful, offensive, or inappropriate content</li>
            <li>Use automated bots or scrapers on the platform</li>
            <li>Resell or redistribute AI-generated content commercially</li>
            <li>Interfere with the platform's operation or security</li>
            <li>Impersonate any person or entity</li>
          </ul>
        </Section>

        <Section id="ip" title="7. Intellectual Property">
          <p>
            All content on BarPrep AI — including AI responses, question banks,
            study plans, interface design, and code — is the intellectual property
            of BarPrep AI or its licensors.
          </p>
          <p>
            Content you submit remains yours. By submitting, you grant us a
            limited license to process it for the purpose of providing the Service.
          </p>
        </Section>

        <Section id="privacy" title="8. Privacy">
          <p>
            Your use of the Service is governed by our{' '}
            <Link to="/privacy" className="text-blue-600 hover:underline font-medium">
              Privacy Policy
            </Link>
            , which is incorporated into these Terms by reference.
          </p>
        </Section>

        <Section id="billing" title="9. Billing & Cancellation">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <span className="font-semibold text-slate-800">Free Plan:</span>{' '}
              Available at no cost with limited features. No credit card required.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Paid Plans:</span>{' '}
              Billed monthly or yearly as selected. All prices in USD.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Cancellation:</span>{' '}
              Cancel anytime. Access continues until end of billing period.
              No partial refunds for unused time.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Pass Guarantee:</span>{' '}
              Bar Ready plan includes a pass guarantee subject to specific terms.
              Contact{' '}
              <a href={`mailto:${LEGAL_EMAIL}`} className="text-blue-600 hover:underline">
                {LEGAL_EMAIL}
              </a>{' '}
              to request a refund under the guarantee.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Price Changes:</span>{' '}
              We reserve the right to change pricing with 30 days' notice.
            </li>
          </ul>
        </Section>

        <Section id="termination" title="10. Account Termination">
          <p>We may suspend or terminate your account if you:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Violate these Terms of Service</li>
            <li>Engage in fraudulent or abusive behavior</li>
            <li>Attempt to harm other users or our systems</li>
            <li>Fail to pay subscription fees when due</li>
          </ul>
          <p>
            You may delete your account at any time by contacting{' '}
            <a href={`mailto:${LEGAL_EMAIL}`} className="text-blue-600 hover:underline">
              {LEGAL_EMAIL}
            </a>.
            Your data will be removed within 30 days.
          </p>
        </Section>

        <Section id="liability" title="11. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, BarPrep AI shall not be liable
            for any indirect, incidental, special, or consequential damages,
            including:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Failure to pass the bar examination</li>
            <li>Reliance on AI-generated content or blog posts</li>
            <li>Data loss or service interruption</li>
            <li>Errors in AI responses or study recommendations</li>
          </ul>
          <p className="mt-2">
            In no event shall our total liability exceed the amount you paid for
            the Service in the twelve months preceding the claim.
          </p>
        </Section>

        <Section id="modifications" title="12. Modifications to Terms">
          <p>
            We may modify these Terms at any time. Material changes will be
            communicated via email or in-app notification at least 14 days before
            taking effect. Continued use after changes constitutes acceptance.
          </p>
        </Section>

        <Section id="governing" title="13. Governing Law & Disputes">
          <p>
            These Terms are governed by the laws of the State of Delaware, United
            States. Disputes shall be submitted to binding arbitration under AAA
            rules. You waive the right to participate in class action lawsuits.
          </p>
        </Section>

        <Section id="contact" title="14. Contact">
          <p>For legal questions or notices:</p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
            <p>
              <span className="font-semibold text-slate-800">Email:</span>{' '}
              <a href={`mailto:${LEGAL_EMAIL}`} className="text-blue-600 hover:underline">
                {LEGAL_EMAIL}
              </a>
            </p>
            <p>
              <span className="font-semibold text-slate-800">Contact Form:</span>{' '}
              <Link to="/contact" className="text-blue-600 hover:underline">
                Contact Us
              </Link>
            </p>
          </div>
        </Section>

      </div>

      <div className="border-t border-slate-200 pt-6 flex flex-wrap gap-4">
        <Link to="/privacy"    className="text-sm text-blue-600 hover:underline font-medium">Privacy Policy →</Link>
        <Link to="/cookies"    className="text-sm text-blue-600 hover:underline font-medium">Cookie Policy →</Link>
        <Link to="/disclaimer" className="text-sm text-blue-600 hover:underline font-medium">Disclaimer →</Link>
        <Link to="/contact"    className="text-sm text-blue-600 hover:underline font-medium">Contact Us →</Link>
      </div>

    </div>
  )
}
