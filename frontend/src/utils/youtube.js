// frontend/src/utils/youtube.js
//
// Ported from the teammate's arrival-items branch. Extracts a YouTube video
// ID from common URL formats (watch?v=, youtu.be/, embed/) so we can build
// an embeddable iframe src. Used both by the admin Content Manager (preview)
// and any public page that renders a content item with a video attached.
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
