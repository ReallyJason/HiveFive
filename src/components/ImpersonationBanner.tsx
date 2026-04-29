import { useAuth } from '../lib/auth';
import { apiPost } from '../lib/api';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

export function ImpersonationBanner() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  if (!user?.impersonating) return null;

  const handleStop = async () => {
    await apiPost('/admin/stop-impersonate.php');
    await refreshUser();
    navigate('/admin');
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      background: 'linear-gradient(90deg, #1C1917, #292524)', color: '#FAF8F5',
      fontSize: 13, fontWeight: 600, borderBottom: '2px solid #E9A020',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <span style={{ color: '#E9A020' }}>Viewing as</span>
      <span>@{user.username}</span>
      <button
        onClick={handleStop}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '4px 12px', borderRadius: 6,
          background: '#E9A020', color: '#1C1917',
          fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
        }}
      >
        <ArrowLeft style={{ width: 14, height: 14 }} />
        Back to Admin
      </button>
    </div>
  );
}
