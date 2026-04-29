import { useAuth } from '../lib/auth';
import { ShieldOff, Ban } from 'lucide-react';
import { parseUTC } from '../lib/constants';

export function AccountStatusGate({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();

  // Don't block while loading
  if (loading) return <>{children}</>;

  // Don't block if not logged in
  if (!user) return <>{children}</>;

  // Don't block admins or impersonated sessions
  if (user.role === 'admin' || user.impersonating) return <>{children}</>;

  // Check banned
  if (user.banned_at) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#1C1917', padding: 16,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(239,68,68,0.15)',
          }}>
            <Ban style={{ width: 40, height: 40, color: '#EF4444' }} />
          </div>
          <h1 className="font-display italic text-3xl" style={{ color: '#FAF8F5', marginBottom: 12 }}>
            Account Banned
          </h1>
          <p style={{ color: '#A8A29E', fontSize: 16, lineHeight: 1.6, marginBottom: 8 }}>
            Your HiveFive account has been permanently banned.
          </p>
          {user.ban_reason && (
            <p style={{
              color: '#78756E', fontSize: 14, marginBottom: 24,
              padding: '12px 16px', borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <strong style={{ color: '#A8A29E' }}>Reason:</strong> {user.ban_reason}
            </p>
          )}
          <p style={{ color: '#78756E', fontSize: 14, marginBottom: 32 }}>
            If you believe this is a mistake, contact <strong style={{ color: '#A8A29E' }}>support@hivefive.com</strong>
          </p>
          <button
            onClick={() => logout()}
            style={{
              height: 44, padding: '0 32px', borderRadius: 8, border: 'none',
              backgroundColor: '#292524', color: '#FAF8F5',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // Check suspended (only if suspended_until is in the future)
  if (user.suspended_until && parseUTC(user.suspended_until) > new Date()) {
    const suspendedDate = parseUTC(user.suspended_until);
    const formattedDate = suspendedDate.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#1C1917', padding: 16,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(245,158,11,0.15)',
          }}>
            <ShieldOff style={{ width: 40, height: 40, color: '#F59E0B' }} />
          </div>
          <h1 className="font-display italic text-3xl" style={{ color: '#FAF8F5', marginBottom: 12 }}>
            Account Suspended
          </h1>
          <p style={{ color: '#A8A29E', fontSize: 16, lineHeight: 1.6, marginBottom: 8 }}>
            Your account has been temporarily suspended.
          </p>
          <p style={{
            color: '#78756E', fontSize: 14, marginBottom: 24,
            padding: '12px 16px', borderRadius: 8,
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            Access will be restored on <strong style={{ color: '#F59E0B' }}>{formattedDate}</strong>
          </p>
          <p style={{ color: '#78756E', fontSize: 14, marginBottom: 32 }}>
            If you believe this is a mistake, contact <strong style={{ color: '#A8A29E' }}>support@hivefive.com</strong>
          </p>
          <button
            onClick={() => logout()}
            style={{
              height: 44, padding: '0 32px', borderRadius: 8, border: 'none',
              backgroundColor: '#292524', color: '#FAF8F5',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // User is fine, render normally
  return <>{children}</>;
}
