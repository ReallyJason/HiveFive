/**
 * Resolve an asset path against the app base path so it works for both
 * root deployments and subpath deployments.
 */
export function resolveAssetUrl(path?: string | null): string | null {
  if (!path) return null;

  // Keep absolute/protocol/data/blob URLs unchanged.
  if (
    /^(https?:)?\/\//i.test(path) ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  const rawBase = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const base = rawBase === '' || rawBase === '/' ? '' : rawBase;

  // Already prefixed with the deployment base.
  if (base && (path === base || path.startsWith(`${base}/`))) {
    return path;
  }

  if (path.startsWith('/')) {
    return `${base}${path}`;
  }
  return base ? `${base}/${path}` : `/${path}`;
}

/**
 * Build deterministic fallback variants for stock service media paths.
 * Handles common deploy layouts:
 * - /services/webp/...
 * - /public/services/webp/...
 * - /build/services/webp/...
 */
function serviceLibraryVariants(path: string): string[] {
  const roots = ['/services/webp/', '/public/services/webp/', '/build/services/webp/'];
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (v: string) => {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  };

  let matched = false;
  for (const root of roots) {
    const idx = path.indexOf(root);
    if (idx === -1) continue;
    matched = true;
    const prefix = path.slice(0, idx);
    const suffix = path.slice(idx + root.length);
    for (const r of roots) push(`${prefix}${r}${suffix}`);
    break;
  }

  // Relative-path fallback support.
  if (!matched && path.startsWith('services/webp/')) {
    const suffix = path.slice('services/webp/'.length);
    push(`services/webp/${suffix}`);
    push(`public/services/webp/${suffix}`);
    push(`build/services/webp/${suffix}`);
  }

  return out;
}

export function nextServiceLibraryFallbackUrl(current?: string | null): string | null {
  if (!current) return null;
  const variants = serviceLibraryVariants(current);
  if (variants.length <= 1) return null;
  const idx = variants.indexOf(current);
  if (idx >= 0 && idx < variants.length - 1) return variants[idx + 1];
  // If current is not an exact known variant string, try the first alternative.
  return variants[1] ?? null;
}
