import { useState } from 'react';
import { Download, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { resolveAssetUrl } from '../lib/assetUrl';
import { formatFileSize } from '../lib/fileUploads';
import { toast } from 'sonner';

export interface MessageAttachmentItem {
  id: number;
  kind: 'image' | 'file';
  name: string;
  mime_type: string;
  size_bytes: number;
  url: string;
  download_url: string;
}

function attachmentDescriptor(attachment: MessageAttachmentItem): string {
  if (attachment.kind === 'image') {
    if (attachment.mime_type === 'image/heic' || attachment.mime_type === 'image/heif') return 'iPhone photo';
    if (attachment.mime_type === 'image/avif') return 'AVIF photo';
    return 'Photo';
  }

  const extension = attachment.name.split('.').pop()?.trim();
  return extension ? `${extension.toUpperCase()} file` : 'File';
}

export function MessageAttachmentGrid({
  attachments,
  isMine,
}: {
  attachments: MessageAttachmentItem[];
  isMine: boolean;
}) {
  if (attachments.length === 0) return null;

  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const surfaceClass = isMine ? 'bg-honey-50/70 border-honey-200/70' : 'bg-white/75 border-charcoal-200/70';
  const shellShadow = isMine
    ? '0 26px 50px -38px rgba(183, 121, 31, 0.45)'
    : '0 24px 48px -38px rgba(28, 28, 28, 0.28)';

  const handleDownload = async (attachment: MessageAttachmentItem) => {
    const downloadUrl = resolveAssetUrl(attachment.download_url || attachment.url);
    if (!downloadUrl) {
      toast.error(`"${attachment.name}" is unavailable`);
      return;
    }

    setDownloadingId(attachment.id);
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Download failed with ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = attachment.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      toast.error(`Couldn't download "${attachment.name}"`);
    } finally {
      setDownloadingId((current) => (current === attachment.id ? null : current));
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${isMine ? 'items-end' : 'items-start'}`}>
      <div className="flex w-full max-w-md flex-col gap-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className={`relative overflow-hidden rounded-[22px] border ${surfaceClass} px-3 py-3 backdrop-blur-sm`}
            style={{ boxShadow: shellShadow }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/22 via-white/6 to-transparent" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/70 bg-white/84 text-charcoal-700 shadow-[0_10px_18px_-14px_rgba(28,28,28,0.35)]">
                {attachment.kind === 'image' ? <ImageIcon className="size-4.5" /> : <FileText className="size-4.5" />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/78 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-charcoal-600">
                    {attachmentDescriptor(attachment)}
                  </span>
                  <span className="rounded-full bg-charcoal-900/5 px-2.5 py-1 text-[11px] font-mono text-charcoal-600">
                    {formatFileSize(attachment.size_bytes)}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm font-semibold text-charcoal-900" title={attachment.name}>
                  {attachment.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void handleDownload(attachment)}
                disabled={downloadingId === attachment.id}
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-white/75 bg-white/84 px-3 text-xs font-medium text-charcoal-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={`Download ${attachment.name}`}
                title={`Download ${attachment.name}`}
              >
                {downloadingId === attachment.id ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
