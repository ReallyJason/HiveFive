const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/avif',
] as const;

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'avif'] as const;

const CHAT_FILE_MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  md: 'text/markdown',
  txt: 'text/plain',
  csv: 'text/csv',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

const CHAT_FILE_MIME_TYPES = Object.values(CHAT_FILE_MIME_BY_EXTENSION);

export const SERVICE_IMAGE_ACCEPT = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/avif',
  '.heic',
  '.heif',
  '.avif',
].join(',');

export const CHAT_ATTACHMENT_ACCEPT = [
  ...SERVICE_IMAGE_ACCEPT.split(','),
  'application/pdf',
  'text/markdown',
  'text/plain',
  'text/csv',
  '.pdf',
  '.md',
  '.txt',
  '.csv',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
].join(',');

export const SUPPORTED_IMAGE_COPY = 'JPG, PNG, GIF, WebP, HEIC, HEIF or AVIF';

function fileExtension(name: string): string {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? '';
}

function inferredMimeTypeFromExtension(name: string): string | null {
  const ext = fileExtension(name);
  if ((IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
    if (ext === 'jpg') return 'image/jpeg';
    return `image/${ext}`;
  }
  return CHAT_FILE_MIME_BY_EXTENSION[ext] ?? null;
}

export function resolveUploadMimeType(file: File): string | null {
  const explicit = file.type.trim().toLowerCase();
  if (explicit) return explicit;
  return inferredMimeTypeFromExtension(file.name);
}

export function isSupportedImageFile(file: File): boolean {
  const mimeType = resolveUploadMimeType(file);
  if (!mimeType) return false;
  return (IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function getChatAttachmentMeta(file: File): { mimeType: string; kind: 'image' | 'file' } | null {
  const mimeType = resolveUploadMimeType(file);
  if (!mimeType) return null;
  if ((IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return { mimeType, kind: 'image' };
  }
  if (CHAT_FILE_MIME_TYPES.includes(mimeType)) {
    return { mimeType, kind: 'file' };
  }
  return null;
}

function withForcedMimeType(dataUrl: string, mimeType: string): string {
  return dataUrl.replace(/^data:[^,]*;base64,/, `data:${mimeType};base64,`);
}

export async function readFileAsDataUrl(file: File, mimeType?: string): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  if (!mimeType) return raw;
  const currentMime = raw.match(/^data:([^;,]+)/)?.[1]?.toLowerCase() ?? '';
  if (currentMime === mimeType.toLowerCase()) return raw;
  return withForcedMimeType(raw, mimeType);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
