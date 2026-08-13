import { Link, useEffect } from 'react-router-dom'

// ── IMPORTANT: Update manually when terms change ──────────────────────────────
const LAST_UPDATED = 'January 15, 2025'
const LEGAL_EMAIL  = 'legal@barprepai.com'

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

// ── Jump links ────────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'acceptance',   label: '1. Acceptance of Terms'          },
  { id: 'description',  label: '2. Description of Service'       },
  { id: 'eligibility',  label: '3. Eligibility'                  },
  { id: 'disclaimer',   label: '4. AI Disclaimer'                },
  { id: 'blog',         label: '5. Blog & AI Content'            },
  { id: 'acceptable',   label: '6. Acceptable Use'               },
  { id: 'ip',           label: '7. Intellectual Property'        },
  { id: 'privacy',      label: '8. Privacy'                      },
  { id: 'billing',      label: '9. Billing & Cancellation'       },
  { id: 'termination',  label: '10. Account Termination'         },
  { id: 'liability',    label: '11. Limitation of Liability'     },
  { id: 'modifications',label: '12. Modifications'               },
  { id: 'governing',    label: '13. Governing Law'               },
  { id: 'contact',      label: '14. Contact'                     },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function TermsOfService() {

  // SEO
  useEffect(() => {
    document.title = 'Terms of Service — BarPrep AI'
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

      {/* ── Header ── */}
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

      {/* ── Jump navigation ── */}
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

      {/* ── Sections ── */}
      <div className="space-y-10">

        {/* 1 */}
        <Section id="acceptance" title="1. Acceptance of Terms">
          <p>
            By accessing or using BarPrep AI ("the Service"), you agree to be
            bound by these Terms of Service and all applicable laws and
            regulations. If you do not agree with any part of these terms,
            please do not use the Service. These terms apply to all users
            including students, visitors, and administrators.
          </p>
        </Section>

        {/* 2 */}
        <Section id="description" title="2. Description of Service">
          <p>
            BarPrep AI is an AI-powered educational platform designed to help
            individuals prepare for bar examinations. The Service includes:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>AI-powered chat coaching for bar exam topics</li>
            <li>Mock exam questions with AI grading and feedback</li>
            <li>Personalized study plan generation</li>
            <li>Assignment submission and AI analysis</li>
            <li>Video tutorial access and progress tracking</li>
            <li>
              AI-generated blog content on bar exam topics (see Section 5)
            </li>
            <li>Web-scraped educational content for AI knowledge base</li>
          </ul>
        </Section>

        {/* 3 */}
        <Section id="eligibility" title="3. Eligibility">
          <ul className="list-disc pl-5 space-y-1">
            <li>You must be at least 18 years of age to use this Service</li>
            <li>You must provide accurate registration information</li>
            <li>One account per person — no shared accounts</li>
            <li>You are responsible for maintaining account security</li>
            <li>
              You are responsible for all activity that occurs under your account
            </li>
          </ul>
        </Section>

        {/* 4 */}
        <Section id="disclaimer" title="4. Educational Purpose & AI Disclaimer">
          <div className="bg-amber-50 border border-amber-200
                          rounded-xl p-4 space-y-2">
            <p className="font-bold text-amber-900">⚠️ Important Notice</p>
            <ul className="list-disc pl-5 space-y-1 text-amber-800">
              <li>
                BarPrep AI is an <strong>educational tool only</strong>.
                It is NOT a law firm and does not provide legal advice.
              </li>
              <li>
                AI-generated content — including chat responses, mock exam
                questions, study plans, and blog posts — may contain errors,
                omissions, or outdated information. Always verify with official
                sources.
              </li>
              <li>
                We do <strong>not guarantee</strong> that use of this Service
                will result in passing the bar exam.
              </li>
              <li>
                BarPrep AI is not affiliated with the NCBE (National Conference
                of Bar Examiners) or any state bar association.
              </li>
            </ul>
          </div>
        </Section>

        {/* 5 — NEW: Blog & AI Content */}
        <Section id="blog" title="5. Blog & AI-Generated Content">
          <p>
            BarPrep AI operates an AI-powered blog that generates articles
            using live bar prep data feeds and Pollinations AI. By using the
            blog feature, you acknowledge and agree that:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <span className="font-semibold text-slate-800">
                AI-Generated Articles:
              </span>{' '}
              Blog posts are written by artificial intelligence and have not
              been reviewed, verified, or approved by licensed attorneys or
              bar preparation professionals.
            </li>
            <li>
              <span className="font-semibold text-slate-800">
                No Legal Reliance:
              </span>{' '}
              Blog content is for general educational purposes only and must
              not be relied upon as legal advice, exam preparation guidance,
              or a definitive statement of law.
            </li>
            <li>
              <span className="font-semibold text-slate-800">
                AI Images:
              </span>{' '}
              Blog cover images are AI-generated by Pollinations AI.
              They are original AI creations and may not accurately represent
              legal concepts.
            </li>
            <li>
              <span className="font-semibold text-slate-800">
                Web Scraper:
              </span>{' '}
              We collect publicly available educational content from authorized
              sources to build our AI knowledge base. This content is used
              only to improve AI coaching and is not redistributed.
            </li>
            <li>
              <span className="font-semibold text-slate-800">
                Content Accuracy:
              </span>{' '}
              Laws and legal standards change over time. We cannot guarantee
              that blog content reflects the most current legal rules.
            </li>
          </ul>
        </Section>

        {/* 6 */}
        <Section id="acceptable" title="6. Acceptable Use">
          <p>You agree NOT to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Share your account credentials with others</li>
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to reverse engineer or copy our AI systems</li>
            <li>Submit harmful, offensive, or inappropriate content</li>
            <li>Attempt to manipulate or deceive the AI systems</li>
            <li>Use automated bots or scrapers on the platform</li>
            <li>Resell or redistribute AI-generated content commercially</li>
            <li>Interfere with the platform's operation or security</li>
            <li>
              Impersonate any person or entity or misrepresent your
              affiliation with any person or entity
            </li>
            <li>
              Submit content that violates any third party's intellectual
              property rights
            </li>
          </ul>
          <p>
            Violation of these terms may result in immediate account
            termination without refund.
          </p>
        </Section>

        {/* 7 */}
        <Section id="ip" title="7. Intellectual Property">
          <p>
            All content on BarPrep AI — including AI responses, question banks,
            study plans, interface design, and code — is the intellectual
            property of BarPrep AI or its licensors. You may not copy,
            reproduce, or distribute our content without written permission.
          </p>
          <p>
            Content you submit (assignments, chat messages) remains yours.
            By submitting, you grant us a limited, non-exclusive, royalty-free
            license to process, store, and display it for the sole purpose
            of providing the Service.
          </p>
          <p>
            AI-generated blog images created by Pollinations AI are original
            works generated on behalf of BarPrep AI and may not be reproduced
            or redistributed without permission.
          </p>
        </Section>

        {/* 8 */}
        <Section id="privacy" title="8. Privacy">
          <p>
            Your use of the Service is also governed by our{' '}
            <Link to="/privacy"
                  className="text-blue-600 hover:underline font-medium">
              Privacy Policy
            </Link>
            , which is incorporated into these Terms by reference. By using
            the Service, you consent to the data practices described in the
            Privacy Policy, including the processing of your data by
            third-party AI providers.
          </p>
        </Section>

        {/* 9 — NEW: Billing */}
        <Section id="billing" title="9. Billing & Cancellation">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <span className="font-semibold text-slate-800">
                Free Plan:
              </span>{' '}
              The Free plan is available at no cost with limited features.
              No credit card is required.
            </li>
            <li>
              <span className="font-semibold text-slate-800">
                Paid Plans:
              </span>{' '}
              Pro and Bar Ready plans are billed monthly or yearly as selected.
              All prices are in USD.
            </li>
            <li>
              <span className="font-semibold text-slate-800">
                Cancellation:
              </span>{' '}
              You may cancel your subscription at any time. You will retain
              access to paid features until the end of your current billing
              period. No partial refunds are issued for unused time.
            </li>
            <li>
              <span className="font-semibold text-slate-800">
                Pass Guarantee:
              </span>{' '}
              The Bar Ready plan includes a pass guarantee subject to
              specific terms. You must have actively used the plan for the
              full preparation period and followed the AI study plan.
              Contact us at{' '}
              <a href={`mailto:${LEGAL_EMAIL}`}
                 className="text-blue-600 hover:underline">
                {LEGAL_EMAIL}
              </a>{' '}
              to request a refund under the guarantee.
            </li>
            <li>
              <span className="font-semibold text-slate-800">
                Price Changes:
              </span>{' '}
              We reserve the right to change pricing with 30 days' notice.
              Existing subscribers will be notified by email.
            </li>
          </ul>
        </Section>

        {/* 10 */}
        <Section id="termination" title="10. Account Termination">
          <p>
            We reserve the right to suspend or terminate your account if you:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Violate these Terms of Service</li>
            <li>Engage in fraudulent or abusive behavior</li>
            <li>Attempt to harm other users or our systems</li>
            <li>Fail to pay subscription fees when due</li>
          </ul>
          <p>
            You may delete your account at any time by contacting us at{' '}
            <a href={`mailto:${LEGAL_EMAIL}`}
               className="text-blue-600 hover:underline">
              {LEGAL_EMAIL}
            </a>.
            Upon deletion, your data will be removed within 30 days per
            our Privacy Policy.
          </p>
        </Section>

        {/* 11 */}
        <Section id="liability" title="11. Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law, BarPrep AI,
            its owners, operators, employees, and affiliates shall not be
            liable for any indirect, incidental, special, consequential,
            or punitive damages arising from your use of the Service,
            including but not limited to:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Failure to pass the bar examination</li>
            <li>Reliance on AI-generated content or blog posts</li>
            <li>Data loss or service interruption</li>
            <li>Errors in AI responses or study recommendations</li>
          </ul>
          <p className="mt-2">
            In no event shall our total liability to you exceed the amount
            you paid for the Service in the twelve (12) months preceding
            the claim.
          </p>
        </Section>

        {/* 12 */}
        <Section id="modifications" title="12. Modifications to Terms">
          <p>
            We reserve the right to modify these Terms at any time.
            Material changes will be communicated via email or in-app
            notification at least 14 days before taking effect.
            Continued use after changes constitutes acceptance of the
            updated Terms. The "Last updated" date at the top of this
            page reflects the most recent revision.
          </p>
        </Section>

        {/* 13 */}
        <Section id="governing" title="13. Governing Law & Disputes">
          <p>
            These Terms shall be governed by and construed in accordance
            with the laws of the State of Delaware, United States, without
            regard to conflict of law principles.
          </p>
          <p>
            Any disputes arising from these Terms or your use of the Service
            shall first be attempted to be resolved through good-faith
            negotiation. If unresolved within 30 days, disputes shall be
            submitted to binding arbitration under the American Arbitration
            Association (AAA) rules, conducted in English.
          </p>
          <p>
            You waive the right to participate in class action lawsuits
            or class-wide arbitration related to the Service.
          </p>
        </Section>

        {/* 14 */}
        <Section id="contact" title="14. Contact">
          <p>For legal questions or notices:</p>
          <div className="bg-slate-50 border border-slate-200
                          rounded-xl p-4 space-y-1.5">
            <p>
              <span className="font-semibold text-slate-800">Email:</span>{' '}
              <a href={`mailto:${LEGAL_EMAIL}`}
                 className="text-blue-600 hover:underline">
                {LEGAL_EMAIL}
              </a>
            </p>
            <p>
              <span className="font-semibold text-slate-800">
                Contact Form:
              </span>{' '}
              <Link to="/contact" className="text-blue-600 hover:underline">
                Contact Us
              </Link>
            </p>
            <p>
              <span className="font-semibold text-slate-800">
                Response Time:
              </span>{' '}
              Within 30 days for legal requests
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
          to="/cookies"
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          Cookie Policy →
        </Link>
        <Link
          to="/disclaimer"
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          Disclaimer →
        </Link>
        <Link
          to="/contact"
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          Contact Us →
        </Link>
      </div>

    </div>
  )
}
