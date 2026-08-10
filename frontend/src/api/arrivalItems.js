// frontend/src/api/arrivalItems.js
//
// Small fetch helper for the arrival_items API. These endpoints are
// currently open (no auth) so any visitor can add/edit/delete items.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function handleResponse(res) {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export async function getArrivalItems() {
  const res = await fetch(`${API_BASE}/arrival-items`, { credentials: 'include' });
  const data = await handleResponse(res);
  return data.items;
}

export async function getArrivalItem(id) {
  const res = await fetch(`${API_BASE}/arrival-items/${id}`, { credentials: 'include' });
  const data = await handleResponse(res);
  return data.item;
}

export async function createArrivalItem(payload) {
  const res = await fetch(`${API_BASE}/arrival-items`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse(res);
  return data.item;
}

export async function updateArrivalItem(id, payload) {
  const res = await fetch(`${API_BASE}/arrival-items/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse(res);
  return data.item;
}

export async function deleteArrivalItem(id) {
  const res = await fetch(`${API_BASE}/arrival-items/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  await handleResponse(res);
}

// Extract a YouTube video ID from common URL formats
// (watch?v=, youtu.be/, embed/) so we can build an embeddable iframe src.
export function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
}
