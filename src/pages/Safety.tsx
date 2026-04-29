import { Link, useNavigate } from 'react-router';
import { NavBar } from '../components/NavBar';
import { useAuth } from '../lib/auth';
import {
  Shield,
  AlertTriangle,
  MessageSquare,
  Star,
  Eye,
  Lock,
  UserX,
  Phone,
  ArrowLeft,
} from 'lucide-react';

export default function Safety() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

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
            <Shield style={{ width: '32px', height: '32px', color: '#E9A020' }} />
          </div>
          <h1
            className="font-display italic"
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#FAF8F5', letterSpacing: '-0.025em', marginBottom: '16px' }}
          >
            Your Safety Matters
          </h1>
          <p style={{ color: '#78756E', fontSize: '18px', maxWidth: '560px', margin: '0 auto' }}>
            HiveFive is built by students, for students. We take your safety seriously — here's how we protect this community.
          </p>
        </div>
      </section>

      {/* Content */}
      <section style={{ maxWidth: '768px', margin: '0 auto', padding: '48px 16px 64px' }}>

        {/* Trust & Verification */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(233,160,32,0.1)' }}>
              <Eye style={{ width: '20px', height: '20px', color: '#C4850C' }} />
            </div>
            <h2 className="font-display italic" style={{ fontSize: '24px', color: '#1C1917' }}>Verified Campus Community</h2>
          </div>
          <div style={{ color: '#57534E', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p>
              Every HiveFive account requires a valid <strong>.edu email address</strong>. This means everyone you interact with is a verified student at a participating university. No randos from the internet — just your fellow classmates and campus neighbors.
            </p>
            <p>
              We verify email ownership during signup with a confirmation code. Accounts that fail verification are never activated.
            </p>
          </div>
        </div>

        {/* Reviews & Reputation */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(233,160,32,0.1)' }}>
              <Star style={{ width: '20px', height: '20px', color: '#C4850C' }} />
            </div>
            <h2 className="font-display italic" style={{ fontSize: '24px', color: '#1C1917' }}>Ratings & Reviews</h2>
          </div>
          <div style={{ color: '#57534E', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p>
              After every completed order, both the client and provider can leave honest reviews. These ratings are public and permanent — they build a track record that helps the whole community make informed decisions.
            </p>
            <p>
              Gaming the review system (fake reviews, review manipulation, retaliation reviews) is a violation of our Terms and may result in account suspension.
            </p>
          </div>
        </div>

        {/* Secure Messaging */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(233,160,32,0.1)' }}>
              <MessageSquare style={{ width: '20px', height: '20px', color: '#C4850C' }} />
            </div>
            <h2 className="font-display italic" style={{ fontSize: '24px', color: '#1C1917' }}>On-Platform Messaging</h2>
          </div>
          <div style={{ color: '#57534E', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p>
              All communication between clients and providers happens through HiveFive's built-in messaging system. This keeps your personal phone number, social media, and email private until <em>you</em> decide to share them.
            </p>
            <p>
              If a conversation ever makes you uncomfortable, you can block the other user or report the conversation. Our moderation team reviews every report.
            </p>
          </div>
        </div>

        {/* Account Security */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(233,160,32,0.1)' }}>
              <Lock style={{ width: '20px', height: '20px', color: '#C4850C' }} />
            </div>
            <h2 className="font-display italic" style={{ fontSize: '24px', color: '#1C1917' }}>Account Security</h2>
          </div>
          <div style={{ color: '#57534E', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p>
              Passwords are hashed with <strong>bcrypt</strong> — we never store them in plain text. We enforce a minimum 8-character password with at least one uppercase letter and one number. Session tokens are rotated regularly.
            </p>
            <p>
              If you ever suspect unauthorized access, change your password immediately from Settings and reach out to our team.
            </p>
          </div>
        </div>

        {/* Reporting */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(233,160,32,0.1)' }}>
              <AlertTriangle style={{ width: '20px', height: '20px', color: '#C4850C' }} />
            </div>
            <h2 className="font-display italic" style={{ fontSize: '24px', color: '#1C1917' }}>Reporting & Moderation</h2>
          </div>
          <div style={{ color: '#57534E', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p>
              See something sketchy? Every user profile has a <strong>Report</strong> button. Select a reason, describe what happened, and our team gets notified instantly.
            </p>
            <p>
              We have an <strong>automated escalation system</strong> — users who accumulate multiple valid reports get automatically suspended. Repeated violations lead to permanent bans. Our team reviews every report within 24 hours and can also take manual action at any time.
            </p>
            <p>
              Depending on severity, consequences range from a temporary suspension to permanent account removal.
            </p>
          </div>
        </div>

        {/* Prohibited Conduct */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(233,160,32,0.1)' }}>
              <UserX style={{ width: '20px', height: '20px', color: '#C4850C' }} />
            </div>
            <h2 className="font-display italic" style={{ fontSize: '24px', color: '#1C1917' }}>Zero-Tolerance Stuff</h2>
          </div>
          <div style={{ color: '#57534E', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p>The following will get you banned immediately, no warnings:</p>
            <ul style={{ paddingLeft: '20px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li><strong>Harassment or threats</strong> of any kind</li>
              <li><strong>Discrimination</strong> based on race, gender, sexuality, religion, disability, or national origin</li>
              <li><strong>Academic dishonesty services</strong> — we're here to tutor, not to do your homework</li>
              <li><strong>Scams or fraud</strong> — misrepresenting services, not delivering after payment</li>
              <li><strong>Illegal services</strong> — anything that violates federal, state, or university policy</li>
              <li><strong>Doxxing</strong> — sharing someone's personal information without consent</li>
            </ul>
          </div>
        </div>

        {/* Meeting Safety */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(233,160,32,0.1)' }}>
              <Phone style={{ width: '20px', height: '20px', color: '#C4850C' }} />
            </div>
            <h2 className="font-display italic" style={{ fontSize: '24px', color: '#1C1917' }}>Meeting In Person?</h2>
          </div>
          <div style={{ color: '#57534E', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p>
              Some services (tutoring, photography, fitness coaching) involve meeting face-to-face. When that happens:
            </p>
            <ul style={{ paddingLeft: '20px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li><strong>Meet on campus</strong> — libraries, student unions, and coffee shops are great spots</li>
              <li><strong>Tell a friend</strong> where you're going and who you're meeting</li>
              <li><strong>Trust your gut</strong> — if something feels off, leave. You can always cancel</li>
              <li><strong>First meetings in public</strong> — never go to a stranger's private space for a first session</li>
            </ul>
            <p>
              HiveFive is a platform, not a chaperone. We do our best to verify identities, but please exercise the same common sense you'd use with any campus interaction.
            </p>
          </div>
        </div>

        {/* Alpha notice */}
        <div style={{ borderRadius: '8px', padding: '24px', marginBottom: '48px', backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <h3 className="font-sans" style={{ fontWeight: 700, fontSize: '18px', color: '#DC2626', marginBottom: '8px' }}>Alpha Notice</h3>
          <p style={{ color: '#57534E', lineHeight: 1.7 }}>
            HiveFive is in <strong>alpha</strong> — an early-stage student project. The safety features described on this page represent our implemented protections and our goals, but they are provided on an <strong>"as-is" basis with no guarantees</strong>. We are not a security company and this platform has not been independently audited. Always exercise your own judgment in any interaction, on-platform or off. See our <Link to="/terms" style={{ color: '#E9A020', textDecoration: 'underline' }}>Terms of Service</Link> for full details.
          </p>
        </div>

        {/* Emergency */}
        <div style={{ borderRadius: '8px', padding: '24px', marginBottom: '48px', backgroundColor: 'rgba(233,160,32,0.08)', border: '1px solid rgba(233,160,32,0.2)' }}>
          <h3 className="font-sans" style={{ fontWeight: 700, fontSize: '18px', color: '#1C1917', marginBottom: '8px' }}>In an emergency?</h3>
          <p style={{ color: '#57534E', lineHeight: 1.7 }}>
            If you're in immediate danger, call <strong>911</strong>. For on-campus emergencies, contact your university's public safety office. HiveFive's moderation team handles platform issues — we're not equipped for real-world emergencies.
          </p>
        </div>

        {/* Back link */}
        <div style={{ paddingTop: '16px', borderTop: '1px solid #E7E5E4' }}>
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
