import { useState, useEffect, useRef } from 'react';
import { NavBar } from '../components/NavBar';
import { Avatar } from '../components/Avatar';
import { CurrencyInput } from '../components/CurrencyInput';
import { UniversitySearch } from '../components/UniversitySearch';
import { universityFromEmail } from '../lib/universities';
import { User, Lock, Wallet, Bell, Shield, HelpCircle, LogOut, ChevronRight, CreditCard, Plus, ArrowDownToLine, Send, Check, AlertCircle, Camera, Trash2, Loader2, Eye, EyeOff, Palette, Monitor, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate, useSearchParams, Navigate } from 'react-router';
import { useAuth } from '../lib/auth';
import { api, apiGet, apiPatch, apiPost, ApiError } from '../lib/api';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { parseUTC } from '../lib/constants';
import { CharacterLimitHint } from '../components/CharacterLimitHint';
import { isSupportedImageFile, readFileAsDataUrl, resolveUploadMimeType, SERVICE_IMAGE_ACCEPT, SUPPORTED_IMAGE_COPY } from '../lib/fileUploads';

type WalletAction = 'deposit' | 'withdraw' | 'transfer' | null;

interface Transaction {
  id: number;
  type: string;
  description: string;
  amount: number;
  created_at: string;
}

export function Settings() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = searchParams.get('tab') || 'account';
  const { user, loading: authLoading, isLoggedIn, refreshUser, logout } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin' && !user?.impersonating) navigate('/admin', { replace: true });
  }, [user, navigate]);

  const [activeTab, setActiveTab] = useState<'account' | 'wallet' | 'notifications' | 'security' | 'appearance'>(
    initialTab as any
  );
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [walletAction, setWalletAction] = useState<WalletAction>(null);
  const [actionAmount, setActionAmount] = useState('');
  const [transferEmail, setTransferEmail] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Wallet data from API
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);

  // Account settings state -- initialized from auth user
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    university: '',
    major: '',
    year: '',
  });
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  // Avatar upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [showDeactivatePassword, setShowDeactivatePassword] = useState(false);

  // Notification settings
  const [notifications, setNotifications] = useState({
    ordersPayments: true,
    messages: true,
    proposalsReviews: false,
  });
  const [notificationsSaving, setNotificationsSaving] = useState(false);

  // Email change state
  const [emailData, setEmailData] = useState({ newEmail: '', password: '' });
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Deactivate account state
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [deactivating, setDeactivating] = useState(false);

  // Sync account data from user when it loads
  useEffect(() => {
    if (user) {
      setAccountData({
        name: `${user.first_name} ${user.last_name}`.trim(),
        email: user.email,
        university: user.university || '',
        major: user.major || '',
        year: user.year || '',
      });
      setNotifications({
        ordersPayments: user.notify_orders ?? true,
        messages: user.notify_messages ?? true,
        proposalsReviews: user.notify_proposals ?? false,
      });
    }
  }, [user]);

  // Auto-fill university from email domain (updates when domain changes)
  useEffect(() => {
    if (!accountData.email) return;
    const mappedUniversity = universityFromEmail(accountData.email);
    if (!mappedUniversity) return;
    setAccountData((prev) => {
      if (prev.university === mappedUniversity) return prev;
      return { ...prev, university: mappedUniversity };
    });
  }, [accountData.email]);

  // Fetch wallet data when wallet tab is active
  useEffect(() => {
    if (activeTab === 'wallet' && isLoggedIn) {
      setWalletLoading(true);
      Promise.all([
        apiGet<{ balance: number }>('/wallet/balance.php').catch(() => null),
        apiGet<{ transactions: Transaction[] }>('/wallet/transactions.php').catch(() => null),
      ]).then(([balanceData, txData]) => {
        if (balanceData) setWalletBalance(balanceData.balance);
        if (txData) setTransactions(txData.transactions);
        setWalletLoading(false);
      });
    }
  }, [activeTab, isLoggedIn]);

  // Auth gate
  if (!authLoading && !isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
          {/* Title */}
          <div className="h-7 w-32 bg-charcoal-100 rounded animate-pulse mb-8" />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-charcoal-100 rounded-xl p-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="size-5 rounded bg-charcoal-100 animate-pulse" />
                    <div className="h-4 w-20 bg-charcoal-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <div className="bg-white border border-charcoal-100 rounded-xl p-6">
                {/* Section title */}
                <div className="h-6 w-48 bg-charcoal-100 rounded animate-pulse mb-6" />

                {/* Avatar row */}
                <div className="flex items-center gap-5 mb-6 pb-6 border-b border-charcoal-100">
                  <div className="size-20 rounded-full bg-charcoal-100 animate-pulse" />
                  <div>
                    <div className="h-4 w-24 bg-charcoal-100 rounded animate-pulse mb-2" />
                    <div className="h-9 w-20 rounded-lg bg-charcoal-100 animate-pulse" />
                  </div>
                </div>

                {/* 4 form fields */}
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="mb-4">
                    <div className="h-4 w-24 bg-charcoal-100 rounded animate-pulse mb-2" />
                    <div className="h-11 w-full rounded-lg bg-charcoal-100 animate-pulse" />
                  </div>
                ))}

                {/* Save button */}
                <div className="h-11 w-28 rounded-md bg-charcoal-100 animate-pulse mt-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayBalance = walletBalance !== null ? walletBalance : user.hivecoin_balance;
  const lockedUniversity = universityFromEmail(accountData.email);

  const handleWalletAction = async () => {
    const newErrors: Record<string, string> = {};
    const amount = parseFloat(actionAmount);

    if (!actionAmount || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (walletAction === 'withdraw' && amount > displayBalance) {
      newErrors.amount = 'Insufficient balance';
    }

    if (walletAction === 'transfer') {
      if (!transferEmail) {
        newErrors.email = 'Please enter recipient email';
      } else if (!transferEmail.includes('@')) {
        newErrors.email = 'Please enter a valid email';
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      if (walletAction === 'deposit') {
        await apiPost('/wallet/transfer.php', {
          amount,
          action: 'deposit',
        });
      } else if (walletAction === 'withdraw') {
        await apiPost('/wallet/transfer.php', {
          amount,
          action: 'withdraw',
        });
      } else if (walletAction === 'transfer') {
        await apiPost('/wallet/transfer.php', {
          recipient_email: transferEmail,
          amount,
        });
      }

      // Refresh wallet data
      const [balanceData, txData] = await Promise.all([
        apiGet<{ balance: number }>('/wallet/balance.php').catch(() => null),
        apiGet<{ transactions: Transaction[] }>('/wallet/transactions.php').catch(() => null),
      ]);
      if (balanceData) setWalletBalance(balanceData.balance);
      if (txData) setTransactions(txData.transactions);
      await refreshUser();

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setWalletAction(null);
        setActionAmount('');
        setTransferEmail('');
      }, 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({ amount: err.message });
      } else {
        setErrors({ amount: 'Transaction failed. Please try again.' });
      }
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSupportedImageFile(file)) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setAvatarUploading(true);
    try {
      const base64 = await readFileAsDataUrl(file, resolveUploadMimeType(file) ?? undefined);

      await apiPost('/users/upload-avatar.php', { image: base64 });
      await refreshUser();
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to upload photo');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarUploading(true);
    try {
      await apiPatch('/users/update.php', { profile_image: '' });
      await refreshUser();
      toast.success('Profile photo removed');
    } catch (err) {
      toast.error('Failed to remove photo');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveAccount = async () => {
    setAccountSaving(true);
    setAccountError(null);

    try {
      // Split name into first_name and last_name
      const nameParts = accountData.name.trim().split(/\s+/);
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';
      const mappedUniversity = universityFromEmail(accountData.email);
      const universityToSave = mappedUniversity || accountData.university;

      await apiPatch('/users/update.php', {
        first_name,
        last_name,
        university: universityToSave,
        major: accountData.major,
        year: accountData.year || null,
      });

      await refreshUser();
      toast.success('Account updated successfully');
    } catch (err) {
      if (err instanceof ApiError) {
        setAccountError(err.message);
        toast.error(err.message);
      } else {
        setAccountError('Could not connect to server. Check your connection and try again.');
        toast.error('Could not connect to server');
      }
    } finally {
      setAccountSaving(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Must contain at least one uppercase letter';
    if (!/[0-9]/.test(password)) return 'Must contain at least one number';
    return '';
  };

  const handleChangePassword = async () => {
    setPasswordSaving(true);
    setPasswordError(null);

    if (!passwordData.oldPassword || !passwordData.newPassword) {
      setPasswordError('Please fill in all password fields');
      setPasswordSaving(false);
      return;
    }

    const pwError = validatePassword(passwordData.newPassword);
    if (pwError) {
      setPasswordError(pwError);
      setPasswordSaving(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordSaving(false);
      return;
    }

    try {
      await apiPost('/auth/change-password.php', {
        old_password: passwordData.oldPassword,
        new_password: passwordData.newPassword,
      });

      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated successfully');
    } catch (err) {
      if (err instanceof ApiError) {
        setPasswordError(err.message);
        toast.error(err.message);
      } else {
        setPasswordError('Could not connect to server. Check your connection and try again.');
        toast.error('Could not connect to server');
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    setEmailSaving(true);
    setEmailError(null);

    if (!emailData.newEmail || !emailData.password) {
      setEmailError('Please fill in all fields');
      setEmailSaving(false);
      return;
    }

    if (!emailData.newEmail.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailData.newEmail)) {
      setEmailError('Please enter a valid email address');
      setEmailSaving(false);
      return;
    }

    if (emailData.newEmail === user.email) {
      setEmailError('This is already your current email address');
      setEmailSaving(false);
      return;
    }



    try {
      await apiPost('/auth/change-email.php', {
        new_email: emailData.newEmail,
        password: emailData.password,
      });

      setEmailData({ newEmail: '', password: '' });
      await refreshUser();
      toast.success('Check your email for a verification code');
      navigate('/verify');
    } catch (err) {
      if (err instanceof ApiError) {
        setEmailError(err.message);
        toast.error(err.message);
      } else {
        setEmailError('Could not connect to server. Check your connection and try again.');
        toast.error('Could not connect to server');
      }
    } finally {
      setEmailSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setNotificationsSaving(true);

    try {
      await apiPatch('/users/update.php', {
        notify_orders: notifications.ordersPayments,
        notify_messages: notifications.messages,
        notify_proposals: notifications.proposalsReviews,
      });

      await refreshUser();
      toast.success('Notification preferences saved');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to save notification preferences');
      }
    } finally {
      setNotificationsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const handleDeactivateAccount = async () => {
    if (!deactivatePassword) {
      toast.error('Please enter your password to confirm');
      return;
    }

    setDeactivating(true);
    try {
      await api('/users/delete.php', { method: 'DELETE', body: { password: deactivatePassword } });
      await logout();
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to deactivate account');
      }
    } finally {
      setDeactivating(false);
    }
  };

  const tabs = [
    { id: 'account' as const, label: 'Account', icon: User },
    { id: 'wallet' as const, label: 'Wallet', icon: Wallet },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant="logged-in" />

      <div className="max-w-6xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
        <h1 className="font-display italic text-3xl md:text-5xl text-charcoal-900 mb-8">
          Settings
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-charcoal-100 rounded-xl p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-honey-50 text-charcoal-900'
                        : 'text-charcoal-600 hover:bg-cream-50'
                    }`}
                  >
                    <Icon className="size-5" />
                    <span className="font-sans font-bold text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="bg-white border border-charcoal-100 rounded-xl p-6">
                <h2 className="text-xl font-display italic text-charcoal-900 mb-6">
                  Account Information
                </h2>

                {accountError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="size-4 text-red-600" />
                    <p className="text-sm text-red-900">{accountError}</p>
                  </div>
                )}

                {/* Profile Photo */}
                <div className="flex items-center gap-5 mb-6 pb-6 border-b border-charcoal-100">
                  <div className="relative">
                    <Avatar
                      name={user ? `${user.first_name} ${user.last_name}` : ''}
                      src={user?.profile_image}
                      size="xl"
                      frame={user?.cosmetics?.frame}
                    />
                    {avatarUploading && (
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                        <Loader2 className="size-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-sans font-bold text-sm text-charcoal-900 mb-2">Profile Photo</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="h-9 px-4 bg-honey-500 text-charcoal-900 rounded-lg font-sans font-bold text-sm hover:bg-honey-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Camera className="size-4" />
                        Upload
                      </button>
                      {user?.profile_image && (
                        <button
                          onClick={handleAvatarRemove}
                          disabled={avatarUploading}
                          className="h-9 px-3 text-charcoal-500 hover:text-red-500 rounded-lg font-sans text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <Trash2 className="size-3.5" />
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-charcoal-400 mt-1.5">{SUPPORTED_IMAGE_COPY}. Max 5MB.</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={SERVICE_IMAGE_ACCEPT}
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block font-sans font-bold text-charcoal-900 mb-2 text-sm">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={accountData.name}
                      onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                      maxLength={50}
                      className="w-full h-11 px-4 bg-cream-50 border border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-honey-500"
                    />
                    <CharacterLimitHint current={accountData.name.length} max={50} />
                  </div>

                  <div>
                    <label className="block font-sans font-bold text-charcoal-900 mb-2 text-sm">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={accountData.email}
                      readOnly
                      className="w-full h-11 px-4 bg-charcoal-50 border border-charcoal-100 rounded-lg text-charcoal-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-charcoal-500 mt-1">
                      To change your email, go to Security settings
                    </p>
                  </div>

                  <div>
                    <label className="block font-sans font-bold text-charcoal-900 mb-2 text-sm">
                      University
                    </label>
                    <UniversitySearch
                      value={accountData.university}
                      onChange={(value) => setAccountData({ ...accountData, university: value })}
                      disabled={!!lockedUniversity}
                    />
                    {lockedUniversity && (
                      <p className="text-xs text-charcoal-500 mt-1">
                        Locked to {lockedUniversity} based on your email domain.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-sans font-bold text-charcoal-900 mb-2 text-sm">
                      Major
                    </label>
                    <input
                      type="text"
                      value={accountData.major}
                      onChange={(e) => setAccountData({ ...accountData, major: e.target.value })}
                      placeholder="e.g. Computer Science"
                      maxLength={100}
                      className="w-full h-11 px-4 bg-cream-50 border border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-honey-500"
                    />
                    <CharacterLimitHint current={accountData.major.length} max={100} />
                  </div>

                  <div>
                    <label className="block font-sans font-bold text-charcoal-900 mb-2 text-sm">
                      Academic Year
                    </label>
                    <select
                      value={accountData.year}
                      onChange={(e) => setAccountData({ ...accountData, year: e.target.value })}
                      className="w-full h-11 px-4 bg-cream-50 border border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-honey-500 text-charcoal-900"
                    >
                      <option value="">Select year</option>
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleSaveAccount}
                      disabled={accountSaving}
                      className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {accountSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Tab */}
            {activeTab === 'wallet' && (
              <div className="space-y-6">
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-honey-400 to-honey-600 rounded-xl p-8 text-charcoal-900">
                  <div className="mb-2 font-mono text-sm opacity-90">Total Balance</div>
                  <div className="font-display italic text-5xl mb-6">
                    {walletLoading ? (
                      <span className="opacity-50">Loading...</span>
                    ) : (
                      <>⬡ {displayBalance.toLocaleString()}</>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setWalletAction('deposit')}
                      className="h-11 bg-white/90 hover:bg-white rounded-lg font-sans font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Plus className="size-4" />
                      Deposit
                    </button>
                    <button
                      onClick={() => setWalletAction('withdraw')}
                      className="h-11 bg-white/90 hover:bg-white rounded-lg font-sans font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <ArrowDownToLine className="size-4" />
                      Withdraw
                    </button>
                    <button
                      onClick={() => setWalletAction('transfer')}
                      className="h-11 bg-white/90 hover:bg-white rounded-lg font-sans font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Send className="size-4" />
                      Transfer
                    </button>
                  </div>
                </div>

                {/* Action Modal */}
                {walletAction && (
                  <div className="bg-white border border-charcoal-100 rounded-xl p-6">
                    {showSuccess ? (
                      <div className="text-center py-8">
                        <div className="size-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Check className="size-8 text-white" />
                        </div>
                        <h3 className="font-display italic text-2xl text-charcoal-900 mb-2">
                          {walletAction === 'deposit' && 'Deposit Successful!'}
                          {walletAction === 'withdraw' && 'Withdrawal Successful!'}
                          {walletAction === 'transfer' && 'Transfer Successful!'}
                        </h3>
                        <p className="text-charcoal-600">
                          Your transaction has been processed.
                        </p>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-xl font-display italic text-charcoal-900 mb-4">
                          {walletAction === 'deposit' && 'Deposit HiveCoins'}
                          {walletAction === 'withdraw' && 'Withdraw HiveCoins'}
                          {walletAction === 'transfer' && 'Transfer HiveCoins'}
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <label className="block font-sans font-bold text-charcoal-900 mb-2 text-sm">
                              Amount (⬡)
                            </label>
                            <CurrencyInput
                              value={actionAmount}
                              onChange={(value) => setActionAmount(value)}
                              placeholder="0.00"
                              className={`w-full h-11 px-4 bg-cream-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-honey-500 ${
                                errors.amount ? 'border-red-500' : 'border-charcoal-100'
                              }`}
                            />
                            {errors.amount && (
                              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                <AlertCircle className="size-4" />
                                {errors.amount}
                              </p>
                            )}
                          </div>

                          {walletAction === 'transfer' && (
                            <div>
                              <label className="block font-sans font-bold text-charcoal-900 mb-2 text-sm">
                                Recipient Email
                              </label>
                              <input
                                type="email"
                                value={transferEmail}
                                onChange={(e) => setTransferEmail(e.target.value)}
                                placeholder="recipient@email.com"
                                maxLength={100}
                                className={`w-full h-11 px-4 bg-cream-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-honey-500 ${
                                  errors.email ? 'border-red-500' : 'border-charcoal-100'
                                }`}
                              />
                              <CharacterLimitHint current={transferEmail.length} max={100} />
                              {errors.email && (
                                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                  <AlertCircle className="size-4" />
                                  {errors.email}
                                </p>
                              )}
                            </div>
                          )}

                          {walletAction === 'deposit' && (
                            <div className="bg-honey-50 border border-honey-200 rounded-lg p-3">
                              <p className="text-sm text-charcoal-700">
                                <strong>Note:</strong> This is a sandbox environment with dummy payment flows.
                                No real money will be charged.
                              </p>
                            </div>
                          )}

                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={handleWalletAction}
                              className="flex-1 h-11 bg-honey-500 text-charcoal-900 rounded-lg font-sans font-bold text-sm transition-all hover:bg-honey-600"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => {
                                setWalletAction(null);
                                setActionAmount('');
                                setTransferEmail('');
                                setErrors({});
                              }}
                              className="px-6 h-11 bg-charcoal-100 text-charcoal-900 rounded-lg font-sans font-bold text-sm transition-all hover:bg-charcoal-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Transaction History */}
                <div className="bg-white border border-charcoal-100 rounded-xl p-6">
                  <h3 className="font-sans font-bold text-charcoal-900 mb-4">
                    Recent Transactions
                  </h3>
                  <div className="space-y-3">
                    {walletLoading ? (
                      <p className="text-sm text-charcoal-500 py-4 text-center">Loading transactions...</p>
                    ) : transactions.length > 0 ? (
                      transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between py-2 border-b border-charcoal-50 last:border-0">
                          <div>
                            <div className="font-sans font-bold text-sm text-charcoal-900">{tx.description}</div>
                            <div className="text-xs text-charcoal-500">
                              {parseUTC(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {parseUTC(tx.created_at).getFullYear()}
                            </div>
                          </div>
                          <div className={`font-mono text-sm ${['earning', 'bonus', 'refund'].includes(tx.type) ? 'text-green-600' : 'text-red-600'}`}>
                            {['earning', 'bonus', 'refund'].includes(tx.type) ? '+' : '-'}⬡ {tx.amount}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-charcoal-500 py-4 text-center">No transactions yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white border border-charcoal-100 rounded-xl p-6">
                <h2 className="text-xl font-display italic text-charcoal-900 mb-6">
                  Notification Preferences
                </h2>

                <div className="space-y-4">
                  {([
                    { key: 'ordersPayments' as const, label: 'Orders & Payments', desc: 'Order confirmations, status updates, and payment receipts' },
                    { key: 'messages' as const, label: 'Messages', desc: 'New messages from buyers and sellers' },
                    { key: 'proposalsReviews' as const, label: 'Proposals & Reviews', desc: 'New proposals on your services and review notifications' },
                  ]).map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-charcoal-100 last:border-0">
                      <div>
                        <div className="font-sans font-bold text-charcoal-900 mb-1">{label}</div>
                        <div className="text-sm text-charcoal-600">{desc}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[key]}
                          onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-charcoal-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-honey-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-honey-500"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="pt-6">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={notificationsSaving}
                    className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {notificationsSaving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="bg-white border border-charcoal-100 rounded-xl p-6">
                <h2 className="text-xl font-display italic text-charcoal-900 mb-6">
                  Appearance
                </h2>
                <p className="text-sm text-charcoal-600 mb-6">
                  Choose how HiveFive looks for you. System will match your device settings.
                </p>

                <div className="grid grid-cols-3 gap-4">
                  {([
                    { id: 'light', label: 'Light', icon: Sun, preview: { bg: '#fefdfb', card: '#fff', border: '#eceae8', text: '#131210', accent: '#e9a020' } },
                    { id: 'dark', label: 'Dark', icon: Moon, preview: { bg: '#131210', card: '#1a1917', border: '#252420', text: '#f6f6f5', accent: '#e9a020' } },
                    { id: 'system', label: 'System', icon: Monitor, preview: null },
                  ] as const).map(({ id, label, icon: Icon, preview }) => {
                    const isActive = theme === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setTheme(id)}
                        className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          isActive
                            ? 'border-honey-500 bg-honey-50'
                            : 'border-charcoal-100 hover:border-charcoal-200'
                        }`}
                      >
                        {preview ? (
                          <div
                            className="w-full aspect-[4/3] rounded-lg border overflow-hidden"
                            style={{ backgroundColor: preview.bg, borderColor: preview.border }}
                          >
                            <div className="px-2 pt-2 space-y-1.5">
                              <div className="h-2 w-10 rounded-full" style={{ backgroundColor: preview.accent }} />
                              <div className="rounded-md p-1.5" style={{ backgroundColor: preview.card, borderColor: preview.border, border: '1px solid' }}>
                                <div className="h-1.5 w-full rounded-full mb-1" style={{ backgroundColor: preview.text, opacity: 0.2 }} />
                                <div className="h-1.5 w-3/4 rounded-full" style={{ backgroundColor: preview.text, opacity: 0.1 }} />
                              </div>
                              <div className="rounded-md p-1.5" style={{ backgroundColor: preview.card, borderColor: preview.border, border: '1px solid' }}>
                                <div className="h-1.5 w-2/3 rounded-full" style={{ backgroundColor: preview.text, opacity: 0.15 }} />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full aspect-[4/3] rounded-lg border border-charcoal-100 overflow-hidden flex">
                            <div className="w-1/2 h-full bg-cream-50 p-1.5">
                              <div className="h-1.5 w-6 rounded-full bg-honey-500 mb-1" />
                              <div className="h-1.5 w-full rounded-full bg-charcoal-200" />
                            </div>
                            <div className="w-1/2 h-full p-1.5" style={{ backgroundColor: '#131210' }}>
                              <div className="h-1.5 w-6 rounded-full bg-honey-500 mb-1" />
                              <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: '#252420' }} />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Icon className="size-4" />
                          <span className="font-sans font-bold text-sm text-charcoal-900">{label}</span>
                        </div>
                        {isActive && (
                          <span className="text-xs text-honey-600 font-medium">Active</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {mounted && (
                  <p className="text-xs text-charcoal-400 mt-4">
                    Currently using {resolvedTheme === 'dark' ? 'dark' : 'light'} mode
                    {theme === 'system' ? ' (based on your system preference)' : ''}.
                  </p>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white border border-charcoal-100 rounded-xl p-6">
                <h2 className="text-xl font-display italic text-charcoal-900 mb-6">
                  Security Settings
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-sans font-bold text-charcoal-900 mb-3">
                      Change Password
                    </h3>

                    {passwordError && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                        <AlertCircle className="size-4 text-red-600" />
                        <p className="text-sm text-red-900">{passwordError}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type={showOldPassword ? 'text' : 'password'}
                          placeholder="Current password"
                          value={passwordData.oldPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                          maxLength={72}
                          className="w-full h-11 px-4 pr-10 bg-cream-50 border border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-honey-500"
                        />
                        <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600">
                          {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <CharacterLimitHint current={passwordData.oldPassword.length} max={72} />
                      <div>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="New password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            maxLength={72}
                            className="w-full h-11 px-4 pr-10 bg-cream-50 border border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-honey-500"
                          />
                          <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600">
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <CharacterLimitHint current={passwordData.newPassword.length} max={72} />
                        {passwordData.newPassword && (() => {
                          const strength = getPasswordStrength(passwordData.newPassword);
                          const colors = ['bg-charcoal-200', 'bg-red-500', 'bg-amber-500', 'bg-honey-500', 'bg-emerald-500'];
                          const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
                          return (
                            <div className="mt-2">
                              <div className="flex gap-1 h-1">
                                {[1, 2, 3, 4].map((i) => (
                                  <div
                                    key={i}
                                    className={`flex-1 rounded-full transition-all ${
                                      i <= strength ? colors[strength] : 'bg-charcoal-200'
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-xs text-charcoal-500 mt-1">
                                {labels[strength]} &bull; 8–72 characters, one number, one uppercase
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm new password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          maxLength={72}
                          className="w-full h-11 px-4 pr-10 bg-cream-50 border border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-honey-500"
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600">
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <CharacterLimitHint current={passwordData.confirmPassword.length} max={72} />
                      <button
                        onClick={handleChangePassword}
                        disabled={passwordSaving || !passwordData.oldPassword || !passwordData.newPassword || validatePassword(passwordData.newPassword) !== '' || passwordData.newPassword !== passwordData.confirmPassword}
                        className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {passwordSaving ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-charcoal-100">
                    <h3 className="font-sans font-bold text-charcoal-900 mb-3">
                      Change Email
                    </h3>

                    {emailError && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                        <AlertCircle className="size-4 text-red-600" />
                        <p className="text-sm text-red-900">{emailError}</p>
                      </div>
                    )}

                    <p className="text-sm text-charcoal-600 mb-3">
                      Current email: <span className="font-bold">{user.email}</span>
                    </p>

                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="New email address"
                        value={emailData.newEmail}
                        onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                        maxLength={100}
                        className="w-full h-11 px-4 bg-cream-50 border border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-honey-500"
                      />
                      <CharacterLimitHint current={emailData.newEmail.length} max={100} />
                      <div className="relative">
                        <input
                          type={showEmailPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          value={emailData.password}
                          onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                          maxLength={72}
                          className="w-full h-11 px-4 pr-10 bg-cream-50 border border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-honey-500"
                        />
                        <button type="button" onClick={() => setShowEmailPassword(!showEmailPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600">
                          {showEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <CharacterLimitHint current={emailData.password.length} max={72} />
                      <button
                        onClick={handleChangeEmail}
                        disabled={emailSaving}
                        className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {emailSaving ? 'Updating...' : 'Update Email'}
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-charcoal-100">
                    <h3 className="font-sans font-bold text-charcoal-900 mb-3 text-red-600">
                      Danger Zone
                    </h3>

                    <button
                      onClick={handleLogout}
                      className="h-11 px-6 bg-red-50 text-red-600 border border-red-200 rounded-md font-sans font-bold text-sm transition-all hover:bg-red-100 flex items-center gap-2 mb-3"
                    >
                      <LogOut className="size-4" />
                      Sign Out
                    </button>

                    {!showDeactivateConfirm ? (
                      <button
                        onClick={() => setShowDeactivateConfirm(true)}
                        className="h-11 px-6 bg-red-500 text-white rounded-md font-sans font-bold text-sm transition-all hover:opacity-90 flex items-center gap-2"
                      >
                        <Trash2 className="size-4" />
                        Deactivate Account
                      </button>
                    ) : (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3 mt-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="size-5 text-red-600 mt-0.5 shrink-0" />
                          <p className="text-sm text-red-700">
                            Your profile will be hidden and you'll be signed out. Your past orders and reviews will be preserved. You can reactivate anytime by logging back in.
                          </p>
                        </div>
                        <div className="relative">
                          <input
                            type={showDeactivatePassword ? 'text' : 'password'}
                            placeholder="Enter your password to confirm"
                            value={deactivatePassword}
                            onChange={(e) => setDeactivatePassword(e.target.value)}
                            maxLength={72}
                            className="w-full h-11 px-4 pr-10 bg-white border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-honey-500"
                          />
                          <button type="button" onClick={() => setShowDeactivatePassword(!showDeactivatePassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600">
                            {showDeactivatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <CharacterLimitHint current={deactivatePassword.length} max={72} />
                        <div className="flex gap-3">
                          <button
                            onClick={handleDeactivateAccount}
                            disabled={deactivating}
                            className="h-11 px-6 bg-red-500 text-white rounded-md font-sans font-bold text-sm transition-all hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {deactivating ? (
                              <>
                                <Loader2 className="size-4 animate-spin" />
                                Deactivating...
                              </>
                            ) : (
                              <>
                                <Trash2 className="size-4" />
                                Deactivate My Account
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowDeactivateConfirm(false);
                              setDeactivatePassword('');
                            }}
                            disabled={deactivating}
                            className="h-11 px-6 bg-white text-charcoal-900 border border-charcoal-200 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-50 disabled:opacity-70"
                          >
                            Cancel
                          </button>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
