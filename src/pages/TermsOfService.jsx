import { Link } from 'react-router-dom'

const Section = ({ title, children }) => (
  <div className="space-y-3">
    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    <div className="text-slate-600 text-sm leading-relaxed space-y-2">
      {children}
    </div>
  </div>
)

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

      <div className="text-center space-y-2 pb-6 border-b border-slate-200">
        <div className="text-4xl">📜</div>
        <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
        <p className="text-slate-500 text-sm">
          Last updated: {new Date().toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
          })}
        </p>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          Please read these terms carefully before using BarPrep AI.
          By using our service, you agree to these terms.
        </p>
      </div>

      <div className="space-y-8">

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using BarPrep AI ("the Service"), you agree to be
            bound by these Terms of Service. If you do not agree, please do not
            use the Service. These terms apply to all users including students,
            visitors, and administrators.
          </p>
        </Section>

        <Section title="2. Description of Service">
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
          </ul>
        </Section>

        <Section title="3. Eligibility">
          <ul className="list-disc pl-5 space-y-1">
            <li>You must be at least 18 years of age to use this Service</li>
            <li>You must provide accurate registration information</li>
            <li>One account per person — no shared accounts</li>
            <li>You are responsible for maintaining account security</li>
          </ul>
        </Section>

        <Section title="4. Educational Purpose & AI Disclaimer">
          <div className="bg-amber-50 border border-amber-200
                          rounded-xl p-4 space-y-2">
            <p className="font-bold text-amber-900">⚠️ Important Notice</p>
            <ul className="list-disc pl-5 space-y-1 text-amber-800">
              <li>
                BarPrep AI is an <strong>educational tool only</strong>.
                It is NOT a law firm and does not provide legal advice.
              </li>
              <li>
                AI-generated content may contain errors, omissions,
                or outdated information. Always verify with official sources.
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

        <Section title="5. Acceptable Use">
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
          </ul>
        </Section>

        <Section title="6. Intellectual Property">
          <p>
            All content on BarPrep AI — including AI responses, question banks,
            study plans, interface design, and code — is the intellectual
            property of BarPrep AI. You may not copy, reproduce, or distribute
            our content without written permission.
          </p>
          <p>
            Content you submit (assignments, chat messages) remains yours.
            By submitting, you grant us a limited license to process it
            for the purpose of providing the Service.
          </p>
        </Section>

        <Section title="7. Privacy">
          <p>
            Your use of the Service is also governed by our{' '}
            <Link to="/privacy"
              className="text-blue-600 hover:underline font-medium">
              Privacy Policy
            </Link>
            , which is incorporated into these Terms by reference.
          </p>
        </Section>

        <Section title="8. Account Termination">
          <p>We reserve the right to suspend or terminate your account if you:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Violate these Terms of Service</li>
            <li>Engage in fraudulent or abusive behavior</li>
            <li>Attempt to harm other users or our systems</li>
          </ul>
          <p>
            You may delete your account at any time by contacting us.
            Upon deletion, your data will be removed within 30 days.
          </p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, BarPrep AI shall not be
            liable for any indirect, incidental, special, or consequential
            damages arising from your use of the Service, including but not
            limited to failure to pass the bar exam, reliance on AI-generated
            content, or data loss.
          </p>
        </Section>

        <Section title="10. Modifications">
          <p>
            We reserve the right to modify these Terms at any time.
            Changes will be communicated via email or in-app notification.
            Continued use after changes constitutes acceptance.
          </p>
        </Section>

        <Section title="11. Governing Law">
          <p>
            These Terms shall be governed by and construed in accordance
            with the laws of the United States. Any disputes shall be
            resolved through binding arbitration.
          </p>
        </Section>

        <Section title="12. Contact">
          <div className="bg-slate-50 border border-slate-200
                          rounded-xl p-4 space-y-1">
            <p>
              <span className="font-semibold">Email:</span>{' '}
              <a href="mailto:legal@barprepai.com"
                className="text-blue-600 hover:underline">
                legal@barprepai.com
              </a>
            </p>
            <p>
              <span className="font-semibold">Contact Form:</span>{' '}
              <Link to="/contact"
                className="text-blue-600 hover:underline">
                Contact Us
              </Link>
            </p>
          </div>
        </Section>

      </div>

      <div className="border-t border-slate-200 pt-6 flex flex-wrap gap-3">
        <Link to="/privacy"
          className="text-sm text-blue-600 hover:underline font-medium">
          Privacy Policy →
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
