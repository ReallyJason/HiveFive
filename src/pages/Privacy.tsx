import { Link, useNavigate } from 'react-router';
import { NavBar } from '../components/NavBar';
import { useAuth } from '../lib/auth';
import { Fingerprint, ArrowLeft } from 'lucide-react';

export default function Privacy() {
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
            <Fingerprint style={{ width: '32px', height: '32px', color: '#E9A020' }} />
          </div>
          <h1
            className="font-display italic"
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#FAF8F5', letterSpacing: '-0.025em', marginBottom: '16px' }}
          >
            Privacy Policy
          </h1>
          <p style={{ color: '#78756E', fontSize: '18px' }}>
            What we collect, why, and what we do with it. No surprises. Last updated {effectiveDate}.
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
              Alpha Release Notice
            </h2>
            <p style={{ color: '#57534E', lineHeight: 1.7 }}>
              HiveFive is in <strong>alpha</strong> — an early-stage student project under active development. Our data handling practices described below represent our best efforts and intentions, but <strong>may not meet the standards of a production-grade commercial service</strong>. Data may be wiped during development. Use the platform with this understanding.
            </p>
          </div>

          {/* TL;DR */}
          <div style={{ borderRadius: '8px', padding: '24px', backgroundColor: 'rgba(233,160,32,0.08)', border: '1px solid rgba(233,160,32,0.2)' }}>
            <h2 className="font-sans" style={{ fontWeight: 700, fontSize: '18px', color: '#1C1917', marginBottom: '12px' }}>The Short Version</h2>
            <p style={{ color: '#57534E', lineHeight: 1.7 }}>
              We collect only what we need to run HiveFive. We don't sell your data. We don't share it with advertisers. We don't track you across the internet. We're a student project, not an ad company.
            </p>
          </div>

          {/* 1 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>1. What We Collect</h2>
            <div style={bodyStyle}>
              <p><strong>Account Information</strong> — When you sign up, we collect:</p>
              <ul style={listStyle}>
                <li>Your name, .edu email address, and university</li>
                <li>Your username and hashed password (we never see or store your actual password)</li>
                <li>Your major, graduation year, and bio (optional, provided during onboarding)</li>
                <li>Profile photo (optional)</li>
              </ul>

              <p><strong>Service Data</strong> — When you use the platform:</p>
              <ul style={listStyle}>
                <li>Service listings you create (title, description, price, category, images)</li>
                <li>Service requests you post</li>
                <li>Reviews and ratings you leave</li>
                <li>Messages you send through the platform</li>
                <li>Orders and booking history</li>
              </ul>

              <p><strong>Technical Data</strong> — Automatically collected:</p>
              <ul style={listStyle}>
                <li>IP address and approximate location (city-level, for security)</li>
                <li>Browser type and device information</li>
                <li>Pages visited and actions taken on the platform</li>
                <li>Timestamps of account activity</li>
              </ul>
            </div>
          </div>

          {/* 2 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>2. What We Don't Collect</h2>
            <div style={bodyStyle}>
              <p>Let's be clear about what we <em>don't</em> do:</p>
              <ul style={listStyle}>
                <li>We don't collect payment information (we don't process payments yet)</li>
                <li>We don't use tracking cookies or third-party analytics</li>
                <li>We don't collect data from your other browser tabs or apps</li>
                <li>We don't access your contacts, camera, or microphone</li>
                <li>We don't buy data about you from data brokers</li>
              </ul>
            </div>
          </div>

          {/* 3 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>3. How We Use Your Data</h2>
            <div style={bodyStyle}>
              <p>We use the data we collect to:</p>
              <ul style={listStyle}>
                <li><strong>Run the platform</strong> — display your profile, show your listings, deliver your messages</li>
                <li><strong>Verify your identity</strong> — confirm your .edu email, prevent duplicate accounts</li>
                <li><strong>Keep things safe</strong> — detect suspicious activity, enforce our Terms, respond to reports</li>
                <li><strong>Improve HiveFive</strong> — understand how features are used so we can make them better</li>
                <li><strong>Communicate with you</strong> — order updates, security alerts, and platform announcements (you can control notification preferences in Settings)</li>
              </ul>
              <p>
                That's it. We don't use your data for targeted advertising, profiling, or any purpose unrelated to operating HiveFive.
              </p>
            </div>
          </div>

          {/* 4 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>4. Who Sees Your Data</h2>
            <div style={bodyStyle}>
              <p><strong>Other Users</strong> can see:</p>
              <ul style={listStyle}>
                <li>Your public profile (name, username, university, major, bio, photo)</li>
                <li>Your service listings and reviews</li>
                <li>Your average rating</li>
              </ul>

              <p><strong>Other users cannot see:</strong></p>
              <ul style={listStyle}>
                <li>Your email address</li>
                <li>Your IP address or device information</li>
                <li>Your private messages (only you and the other participant can see those)</li>
                <li>Your notification preferences or account settings</li>
              </ul>

              <p><strong>Third Parties</strong> — We do not sell, rent, or share your personal data with any third party except:</p>
              <ul style={listStyle}>
                <li>When required by law (court order, subpoena, legal process)</li>
                <li>To protect the safety of our users or the public</li>
                <li>With your explicit consent</li>
              </ul>
            </div>
          </div>

          {/* 5 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>5. Data Security</h2>
            <div style={bodyStyle}>
              <p>We take reasonable measures to protect your data:</p>
              <ul style={listStyle}>
                <li>Passwords are hashed with <strong>bcrypt</strong> (industry standard)</li>
                <li>All connections use <strong>HTTPS</strong> encryption</li>
                <li>Database access is restricted to authorized systems only</li>
                <li>We use parameterized queries to prevent SQL injection</li>
                <li>Session tokens are rotated and expire automatically</li>
              </ul>
              <p>
                No system is 100% secure. We're honest about that. But we follow security best practices and stay current with vulnerability patches. If we ever discover a data breach, we'll notify affected users within 72 hours.
              </p>
            </div>
          </div>

          {/* 6 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>6. Data Retention</h2>
            <div style={bodyStyle}>
              <p>We keep your data for as long as your account is active. If you deactivate your account:</p>
              <ul style={listStyle}>
                <li>Your profile and listings are removed from public view immediately</li>
                <li>Your data is soft-deleted (flagged as inactive) and retained for 30 days in case you change your mind</li>
                <li>After 30 days, your personal data is permanently deleted from our active systems</li>
                <li>Anonymized usage data (without any personal identifiers) may be retained for analytics</li>
              </ul>
              <p>
                Reviews you've left on others' profiles may be retained in anonymized form after account deletion, as they contribute to the trust ecosystem.
              </p>
            </div>
          </div>

          {/* 7 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>7. Your Rights</h2>
            <div style={bodyStyle}>
              <p>You have the right to:</p>
              <ul style={listStyle}>
                <li><strong>Access</strong> your data — you can view everything we have through your profile and settings</li>
                <li><strong>Correct</strong> your data — edit your profile, listings, and account info at any time</li>
                <li><strong>Delete</strong> your data — deactivate your account from Settings to begin the deletion process</li>
                <li><strong>Export</strong> your data — contact us and we'll provide a copy of your data in a standard format</li>
                <li><strong>Object</strong> to processing — contact us if you believe we're using your data inappropriately</li>
              </ul>
              <p>
                To exercise any of these rights, email us at <strong>support@hivefive.com</strong> or use the in-platform settings.
              </p>
            </div>
          </div>

          {/* 8 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>8. Cookies</h2>
            <p style={{ color: '#57534E', lineHeight: 1.7 }}>
              We use <strong>essential cookies only</strong> — specifically, a session cookie to keep you logged in. That's it. No tracking cookies, no analytics cookies, no advertising cookies. You won't see a cookie banner because there's nothing optional to consent to.
            </p>
          </div>

          {/* 9 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>9. Children's Privacy</h2>
            <p style={{ color: '#57534E', lineHeight: 1.7 }}>
              HiveFive is for university students aged 18 and older. We do not knowingly collect data from anyone under 18. If we discover that a user is under 18, we'll terminate their account and delete their data promptly.
            </p>
          </div>

          {/* 10 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>10. Changes to This Policy</h2>
            <div style={bodyStyle}>
              <p>
                We may update this Privacy Policy as the platform evolves. When we make material changes, we'll notify you through email or an in-app notification. The "last updated" date at the top always reflects the current version.
              </p>
              <p>
                We'll keep previous versions accessible for transparency.
              </p>
            </div>
          </div>

          {/* 11 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>11. Alpha Limitations</h2>
            <div style={bodyStyle}>
              <p>
                During the alpha phase, please be aware of the following limitations:
              </p>
              <ul style={listStyle}>
                <li>Data may be <strong>reset or wiped</strong> during development cycles without prior notice</li>
                <li>Security measures, while implemented with best practices, have <strong>not been independently audited</strong></li>
                <li>Data retention and deletion timelines described above are <strong>goals, not guarantees</strong></li>
                <li>The platform's infrastructure may change substantially, which could affect how and where your data is stored</li>
              </ul>
              <p>
                By using HiveFive during alpha, you accept these limitations. If you're uncomfortable with them, we respect that — please don't create an account until we've reached a more stable release.
              </p>
            </div>
          </div>

          {/* 12 */}
          <div style={sectionStyle}>
            <h2 className="font-display italic" style={headingStyle}>12. Contact</h2>
            <p style={{ color: '#57534E', lineHeight: 1.7 }}>
              Privacy questions or concerns? Email <strong>support@hivefive.com</strong>. We'll respond within 5 business days. If you feel your privacy rights have been violated, you also have the right to file a complaint with your local data protection authority.
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
