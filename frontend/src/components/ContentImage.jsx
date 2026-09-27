// frontend/src/components/ContentImage.jsx
//
// Renders a content_items row's admin-uploaded image (item.image_url), if
// it has one — used everywhere a CMS-driven page shows a heading or section
// so an admin's uploaded photo actually appears without every page having
// to know the upload-URL-resolving details. Renders nothing if the item has
// no image, so it's always safe to drop in.
import { resolveImageUrl } from "../utils/media.js";

export default function ContentImage({ item, alt, style, className }) {
  const src = resolveImageUrl(item?.image_url);
  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt || item.title || ""}
      className={className}
      style={{
        width: "100%",
        maxHeight: "320px",
        objectFit: "cover",
        borderRadius: "var(--radius-md, 10px)",
        marginBottom: "16px",
        display: "block",
        ...style,
      }}
    />
  );
}
