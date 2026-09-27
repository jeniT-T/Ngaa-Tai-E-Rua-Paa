// frontend/src/utils/media.js
//
// Admin-uploaded content images (see ContentManagementPage's image picker,
// backend's POST /api/content/upload) come back from the API as a relative
// path like "/uploads/abc123.jpg" — served by the backend, not the
// frontend's own dev server. This turns that into a full URL pointing at
// the backend, following the same window.location.hostname pattern already
// used for API_BASE everywhere (see the auth/CORS fix) so it keeps working
// whether the app is opened via localhost or a LAN IP.
const UPLOADS_ORIGIN =
  import.meta.env.VITE_UPLOADS_ORIGIN || `http://${window.location.hostname}:4000`;

export function resolveImageUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path; // already absolute
  return `${UPLOADS_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}
