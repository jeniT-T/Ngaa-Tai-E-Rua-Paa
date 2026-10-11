const UPLOADS_ORIGIN =
  import.meta.env.VITE_UPLOADS_ORIGIN ?? `http://${window.location.hostname}:4000`;

export function resolveImageUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path; // already absolute
  return `${UPLOADS_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}
