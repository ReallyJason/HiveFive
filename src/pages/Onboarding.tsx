import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Loader2, Camera } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { CustomSelect } from '../components/CustomSelect';
import { CharacterLimitHint } from '../components/CharacterLimitHint';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';
import { apiPost, ApiError } from '../lib/api';
import { isSupportedImageFile, readFileAsDataUrl, resolveUploadMimeType, SERVICE_IMAGE_ACCEPT } from '../lib/fileUploads';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [bio, setBio] = useState('');
  const [job, setJob] = useState('');
  const [isStudent, setIsStudent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if already onboarded
  useEffect(() => {
    if (!authLoading && user?.onboarding_done) {
      navigate('/discover', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isSupportedImageFile(file)) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploading(true);
    try {
      const base64 = await readFileAsDataUrl(file, resolveUploadMimeType(file) ?? undefined);
      await apiPost('/users/upload-avatar.php', { image: base64 });
      await refreshUser();
      toast.success('Photo uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const canSubmit = job.trim().length > 0;

  const handleComplete = async () => {
    if (!job.trim()) {
      setError("Please enter your job title or occupation");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiPost('/users/onboarding.php', {
        job: job.trim(),
        is_student: isStudent ? 1 : 0,
        bio: bio.trim(),
      });
      await refreshUser();
      toast.success('Welcome to the hive!', { duration: 3000 });
      setTimeout(() => navigate('/discover'), 1000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-honey-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Minimal Nav */}
      <nav className="h-16 border-b border-charcoal-100">
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-honey-500 flex items-center justify-center">
              <span className="text-charcoal-900 font-bold text-sm">H</span>
            </div>
            <span className="font-sans font-bold text-base text-charcoal-900 tracking-tight">
              hive<span className="text-[18px] text-honey-600" style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontWeight: 400 }}>five</span>
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-lg mx-auto mt-8 px-4 pb-16">
        {/* Card */}
        <div className="bg-cream-50 border border-charcoal-100 rounded-xl shadow-sm p-8">
          <h1 className="font-sans font-bold text-xl text-charcoal-900">Tell us about yourself</h1>
          <p className="text-sm text-charcoal-400 mt-1 mb-6">Help others in your community know you</p>

          <div className="space-y-4">
            <div>
              <label className="block font-sans text-sm font-bold text-charcoal-700 mb-2">
                Profile Photo <span className="text-charcoal-400 font-normal">(optional)</span>
              </label>
              <div className="flex items-center gap-4">
                <Avatar size={56} initial={user?.first_name?.[0] ?? '?'} src={user?.profile_image} frame={null} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="h-9 px-4 bg-charcoal-50 border border-charcoal-200 rounded-md font-sans text-sm font-medium text-charcoal-700 hover:bg-charcoal-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Camera className="size-4" />
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={SERVICE_IMAGE_ACCEPT}
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
            </div>

            <div>
              <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                rows={4}
                maxLength={200}
                className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-charcoal-200 bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-[3px] focus:ring-honey-100 resize-none"
              />
              <CharacterLimitHint current={bio.length} max={200} />
            </div>

            <div>
              <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                Job Title / Occupation <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={job}
                onChange={(e) => setJob(e.target.value)}
                placeholder="e.g. Software Engineer"
                maxLength={100}
                className="w-full h-11 px-3.5 rounded-md border-[1.5px] border-charcoal-200 bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-[3px] focus:ring-honey-100"
              />
              <CharacterLimitHint current={job.length} max={100} />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="isStudent"
                checked={isStudent}
                onChange={(e) => setIsStudent(e.target.checked)}
                className="w-4 h-4 text-honey-600 rounded focus:ring-honey-500 border-charcoal-300"
              />
              <label htmlFor="isStudent" className="font-sans font-medium text-sm text-charcoal-700 cursor-pointer select-none">
                I am currently a student
              </label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end mt-6">
            <button
              onClick={handleComplete}
              disabled={submitting || !canSubmit}
              className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
