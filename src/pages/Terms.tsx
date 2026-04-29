import { Link, useNavigate } from 'react-router';
import { NavBar } from '../components/NavBar';
import { useAuth } from '../lib/auth';
import { FileText, ArrowLeft } from 'lucide-react';

export default function Terms() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const effectiveDate = 'February 18, 2026';

  const sectionStyle = { marginBottom: '32px' } as const;
  const headingStyle = { fontSize: '24px', color: '#1C1917', marginBottom: '12px' } as const;
  const bodyStyle = { color: '#57534E', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '12px' } as const;
  const listStyle = { paddingLeft: '20px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '6px' } as const;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF8F5' }}>
      <NavBar />

      {/* Hero */}
      <section style={{ backgroundColor: '#1C1917', paddingTop: '64px', paddingBottom: '96px' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '0 16px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: 'rgba(233,160,32,0.15)', marginBottom: '24px',
            }}
          >
            <FileText style={{ width: '32px', height: '32px', color: '#E9A020' }} />
          </div>
          <h1
            className="font-display italic"
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#FAF8F5', letterSpacing: '-0.025em', marginBottom: '16px' }}
          >
            Terms of Service
          </h1>
          <p style={{ color: '#78756E', fontSize: '18px' }}>
            The rules of the hive. Last updated {effectiveDate}.
          </p>
        </div>
      </section>

      {/* Content */}
      <section style={{ maxWidth: '768px', margin: '0 auto', padding: '48px 16px 64px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

          {/* Alpha banner */}
          <div style={{
            borderRadius: '8px', padding: '24px',
            backgroundColor: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}>
            <h2 className="font-sans" style={{ fontWeight: 700, fontSize: '18px', color: '#DC2626', marginBottom: '12px' }}>
              Alpha Release — Read This First
            </h2>
            <div style={bodyStyle}>
              <p>
                HiveFive is currently in <strong>alpha</strong>. This means the platform is an early-stage, in-development student project. Features may be incomplete, change without notice, or disappear entirely. Data may be wiped during development cycles.
              </p>
              <p>
                While we've written these Terms to be as thorough as possible, <strong>most provisions below are aspirational and may not be legally binding or enforceable</strong> during this alpha phase. We're students, not lawyers.
              </p>
              <p style={{ fontWeight: 700 }}>
                What IS enforceable — right now, today, and forever: Sections 8 (Intellectual Property), 9 (Alpha Participation & Ownership), 10 (Limitation of Liability), 11 (Indemnification), and 14 (Reservation of Rights). These sections protect the team's rights, intellectual property, and future interests regardless of the platform's development stage.
              </p>
            </div>
          </div>

          {/* 1 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>1. What HiveFive Is</h2>
            <div style={bodyStyle}>
              <p>
                HiveFive is a student services marketplace that connects university students who need services with university students who provide them. Think of us as the campus bulletin board, but searchable, reviewable, and way less covered in thumbtacks.
              </p>
              <p>
                We provide the platform. We do <strong>not</strong> employ, endorse, or guarantee any service provider. When you hire someone through HiveFive, you're entering into an arrangement with another student — not with us.
              </p>
            </div>
          </div>

          {/* 2 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>2. Who Can Use HiveFive</h2>
            <div style={bodyStyle}>
              <p>To create an account, you must:</p>
              <ul style={listStyle}>
                <li>Be at least <strong>18 years old</strong></li>
                <li>Be a currently enrolled student at a participating university</li>
                <li>Have a valid <strong>.edu email address</strong> and verify it</li>
                <li>Provide accurate information during registration</li>
              </ul>
              <p>
                One account per person. Shared accounts, bot accounts, and impersonation accounts are prohibited and will be terminated.
              </p>
            </div>
          </div>

          {/* 3 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>3. Your Account</h2>
            <div style={bodyStyle}>
              <p>
                You're responsible for everything that happens under your account. Keep your password secure (we recommend a password manager — seriously, get one). If you suspect unauthorized access, change your password immediately and contact us.
              </p>
              <p>
                We reserve the right to suspend or terminate accounts that violate these Terms, engage in prohibited conduct, or have been inactive for more than 12 months.
              </p>
            </div>
          </div>

          {/* 4 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>4. Service Listings</h2>
            <div style={bodyStyle}>
              <p>If you're listing a service on HiveFive, you agree that:</p>
              <ul style={listStyle}>
                <li>Your listing <strong>accurately describes</strong> the service you provide</li>
                <li>Your pricing is <strong>honest and transparent</strong> — no hidden fees</li>
                <li>You have the <strong>skills, qualifications, and legal right</strong> to provide the service</li>
                <li>You will <strong>deliver what you promise</strong>, on time and as described</li>
                <li>Your service <strong>does not violate</strong> any law, university policy, or these Terms</li>
              </ul>
              <p>
                We may remove listings that are misleading, prohibited, or reported by other users without prior notice.
              </p>
            </div>
          </div>

          {/* 5 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>5. Prohibited Services & Conduct</h2>
            <div style={bodyStyle}>
              <p>Don't use HiveFive for:</p>
              <ul style={listStyle}>
                <li><strong>Academic dishonesty</strong> — writing papers, taking exams, completing assignments for others. Tutoring and study help are fine; doing someone's work is not.</li>
                <li><strong>Illegal activities</strong> — selling controlled substances, fake IDs, stolen goods, etc.</li>
                <li><strong>Harassment, hate speech, or threats</strong></li>
                <li><strong>Spam or misleading listings</strong></li>
                <li><strong>Circumventing the platform</strong> — don't ask users to pay off-platform to dodge reviews or accountability</li>
                <li><strong>Scraping, botting, or data harvesting</strong></li>
              </ul>
              <p>
                Violations result in content removal, account suspension, or permanent ban depending on severity. We don't do three-strikes — egregious violations get one strike: the last one.
              </p>
            </div>
          </div>

          {/* 6 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>6. Payments & Disputes</h2>
            <div style={bodyStyle}>
              <p>
                Orders on HiveFive use in-app HiveCoin balances. When you place an order, the approved amount is set aside for that order until the work is completed, cancelled, or resolved through the dispute flow. HiveFive does not place holds on external credit cards.
              </p>
              <p>
                If you have a dispute with another user, start in your order thread or messages. If you still cannot agree, use the dispute tools inside the order and our moderation team may step in when needed.
              </p>
            </div>
          </div>

          {/* 7 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>7. Reviews & Ratings</h2>
            <div style={bodyStyle}>
              <p>Reviews must reflect your genuine experience. You may not:</p>
              <ul style={listStyle}>
                <li>Post fake reviews (for yourself or others)</li>
                <li>Offer incentives for positive reviews</li>
                <li>Threaten or retaliate against someone for a negative review</li>
                <li>Use reviews to harass, defame, or spam</li>
              </ul>
              <p>
                We may remove reviews that violate these guidelines and take action against the accounts responsible.
              </p>
            </div>
          </div>

          {/* 8 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>8. Intellectual Property</h2>
            <div style={bodyStyle}>
              <p>
                <strong>Your content:</strong> You own the content you post (listings, reviews, messages, profile info). By posting it on HiveFive, you grant us a non-exclusive, worldwide, royalty-free license to display, distribute, and promote that content within the platform and in marketing materials. We won't sell your content or use it for unrelated purposes. This license survives account deletion only for content that has been shared publicly (e.g., reviews visible to other users).
              </p>
              <p>
                <strong>Our stuff — and we mean all of it:</strong> The HiveFive name, logo, brand identity, visual design, user interface, codebase, algorithms, architecture, database schemas, API design, documentation, and all associated intellectual property are the <strong>exclusive property of their respective creators within the HiveFive team</strong>.
              </p>
              <p>
                <strong>Creation & authorship:</strong> HiveFive was built using a variety of development tools including code editors, frameworks, libraries, AI-assisted development tools, and design software. The use of any such tools does not diminish or transfer the creative rights of the team members who <strong>conceived, directed, designed, and integrated</strong> the platform's components. The person who exercises creative control over a work — not the instrument used to produce it — holds authorship rights.
              </p>
              <p>
                <strong>Trade secrets:</strong> The platform's non-public source code, proprietary business logic, system architecture, database design, internal algorithms, deployment configurations, and operational processes constitute <strong>trade secrets</strong> of the HiveFive team, protected under applicable trade secret law (including the Defend Trade Secrets Act of 2016 and New York's adoption of the Uniform Trade Secrets Act). Trade secret protection exists independently of and in addition to any copyright, patent, or other intellectual property protection, and does not depend on the copyrightability of any individual component.
              </p>
              <p>
                <strong>Compilation & arrangement:</strong> Even where individual components of the platform may not be independently protectable, the overall <strong>selection, arrangement, coordination, and integration</strong> of the platform's components — including the combination of features, the architecture of the system, the design language, and the user experience as a whole — constitute a protectable compilation under copyright law.
              </p>
              <p>
                <strong>Contractual protection:</strong> Regardless of the intellectual property status of any component, all users are bound by the restrictions in these Terms as a matter of contract. Your agreement not to copy, reverse-engineer, or create derivative works from the platform is a <strong>contractual obligation</strong> enforceable independently of copyright or any other IP right.
              </p>
              <p>
                You may not copy, reproduce, distribute, reverse-engineer, decompile, create derivative works from, or otherwise use any part of HiveFive's intellectual property, trade secrets, or proprietary materials without prior written consent from the HiveFive team. This includes but is not limited to:
              </p>
              <ul style={listStyle}>
                <li><strong>Cloning or forking</strong> the platform's design, features, or functionality</li>
                <li><strong>Using the HiveFive name, logo, or branding</strong> in any context without authorization</li>
                <li><strong>Scraping, extracting, or harvesting</strong> data, designs, or code from the platform</li>
                <li><strong>Misrepresenting affiliation</strong> with or endorsement by HiveFive</li>
                <li><strong>Using platform data or insights</strong> to build a competing product</li>
              </ul>
              <p>
                Violation of this section may result in legal action under copyright law, trade secret law, contract law, or any combination thereof. This section is enforceable regardless of the platform's development stage.
              </p>
            </div>
          </div>

          {/* 9 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>9. Alpha Participation & Ownership</h2>
            <div style={bodyStyle}>
              <p>
                Let's be very clear about this: <strong>using HiveFive during its alpha phase (or any phase) does not grant you any ownership, equity, intellectual property rights, revenue share, or any other financial or proprietary interest</strong> in HiveFive, its code, its brand, or any future entity derived from it.
              </p>
              <p>
                Specifically, by using this platform you acknowledge and agree that:
              </p>
              <ul style={listStyle}>
                <li>You have <strong>no claim to ownership or equity</strong> in HiveFive, regardless of how early you joined, how much you used it, or how much feedback you provided</li>
                <li>Your user data, activity, and contributions to the platform do not constitute an investment or partnership of any kind</li>
                <li>If HiveFive is incorporated, acquired, receives funding, generates revenue, or is otherwise commercialized, <strong>no alpha user is entitled to any portion of the proceeds</strong> unless explicitly agreed to in a separate, signed written agreement</li>
                <li>Providing feedback, bug reports, feature suggestions, or other input does not create an employment, contractor, partnership, or joint venture relationship</li>
                <li>The HiveFive team may freely use any feedback, ideas, or suggestions you provide without compensation or attribution</li>
              </ul>
              <p>
                This section survives termination of your account and applies in perpetuity.
              </p>
            </div>
          </div>

          {/* 10 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>10. Limitation of Liability</h2>
            <div style={bodyStyle}>
              <p>
                HiveFive is provided <strong>"as is"</strong> and <strong>"as available"</strong> with <strong>absolutely no warranties of any kind</strong>, whether express, implied, statutory, or otherwise. This includes, without limitation, implied warranties of merchantability, fitness for a particular purpose, title, and non-infringement.
              </p>
              <p>
                We are a student project in active development. Features may break, data may be lost, and the platform may be taken offline at any time, temporarily or permanently, with or without notice. <strong>Do not rely on HiveFive for anything mission-critical.</strong>
              </p>
              <p>
                To the maximum extent permitted by applicable law, the HiveFive team and its individual members shall not be liable for any direct, indirect, incidental, special, consequential, exemplary, or punitive damages of any kind arising from:
              </p>
              <ul style={listStyle}>
                <li>Your use of (or inability to use) the platform</li>
                <li>Any transactions, interactions, or disputes between users</li>
                <li>Loss of data, revenue, profits, or business opportunities</li>
                <li>Personal injury, property damage, or emotional distress</li>
                <li>Unauthorized access to your account or data</li>
                <li>Errors, bugs, viruses, or inaccuracies in the platform</li>
                <li>Any third-party content, services, or conduct on the platform</li>
              </ul>
              <p>
                <strong>In no event shall our total aggregate liability exceed $0 (zero dollars).</strong> You use this platform entirely at your own risk.
              </p>
            </div>
          </div>

          {/* 11 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>11. Indemnification</h2>
            <div style={bodyStyle}>
              <p>
                You agree to indemnify, defend, and hold harmless the HiveFive team and its individual members from and against any and all claims, damages, obligations, losses, liabilities, costs, or expenses (including but not limited to attorney's fees and legal costs) arising from:
              </p>
              <ul style={listStyle}>
                <li>Your use of or access to the platform</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any applicable law or regulation</li>
                <li>Your violation of any third party's rights, including intellectual property rights</li>
                <li>Any content you post, upload, or transmit through the platform</li>
                <li>Any dispute between you and another user</li>
              </ul>
              <p>
                This obligation survives termination of your account and these Terms.
              </p>
            </div>
          </div>

          {/* 12 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>12. Changes to These Terms</h2>
            <div style={bodyStyle}>
              <p>
                We may update these Terms at any time, for any reason, with or without prior notice. Given the alpha nature of this project, changes may be frequent. When we make significant changes, we'll make reasonable efforts to notify you through the platform. Continued use of HiveFive after changes take effect constitutes acceptance of the updated Terms.
              </p>
              <p>
                If you don't agree with the updated Terms, your remedy is to stop using the platform and deactivate your account.
              </p>
            </div>
          </div>

          {/* 13 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>13. Governing Law</h2>
            <p style={{ color: '#57534E', lineHeight: 1.7 }}>
              These Terms are governed by the laws of the State of New York, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of HiveFive shall be resolved in the state or federal courts located in the State of New York. You consent to the exclusive jurisdiction of these courts and waive any objection to venue.
            </p>
          </div>

          {/* 14 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>14. Reservation of Rights</h2>
            <div style={bodyStyle}>
              <p>
                The HiveFive team reserves all rights not expressly granted in these Terms. Without limitation, the HiveFive team reserves the right to:
              </p>
              <ul style={listStyle}>
                <li>Modify, suspend, or discontinue the platform at any time, for any reason</li>
                <li>Refuse service to anyone, for any reason</li>
                <li>Commercialize, license, sell, transfer, or otherwise dispose of the platform and all associated intellectual property</li>
                <li>Form a legal entity (LLC, corporation, etc.) and transfer all platform rights to that entity</li>
                <li>Set, change, or waive fees for use of the platform</li>
                <li>Remove any content or terminate any account without prior notice</li>
              </ul>
              <p>
                These reserved rights apply during all phases of development and are not contingent on the platform reaching any particular milestone or status.
              </p>
            </div>
          </div>

          {/* 15 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>15. Severability</h2>
            <p style={{ color: '#57534E', lineHeight: 1.7 }}>
              If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction, that provision shall be enforced to the maximum extent permissible, and the remaining provisions shall continue in full force and effect. The unenforceability of any provision does not affect the enforceability of any other provision.
            </p>
          </div>

          {/* 16 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>16. Contact</h2>
            <p style={{ color: '#57534E', lineHeight: 1.7 }}>
              Questions about these Terms? Reach out to us at <strong>support@hivefive.com</strong> or through the platform's support system. We're students too — we read our emails (eventually).
            </p>
          </div>

        </div>

        {/* Back link */}
        <div style={{ paddingTop: '32px', marginTop: '32px', borderTop: '1px solid #E7E5E4' }}>
          <button
            onClick={() => isLoggedIn ? navigate(-1) : navigate('/')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#A8A29E', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            {isLoggedIn ? 'Go Back' : 'Back to Home'}
          </button>
        </div>
      </section>
    </div>
  );
}
