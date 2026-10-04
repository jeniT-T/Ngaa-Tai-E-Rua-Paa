// frontend/src/components/StarRating.jsx
//
// A simple 1-5 star picker, shared by the manager's private review of a
// guest and a guest's own review of the marae (see ManagerBookingsPage.jsx
// and MyBookingsPage.jsx). Pass `onChange` for an interactive picker;
// leave it out (or pass `readOnly`) to just display a value.
export default function StarRating({ value = 0, onChange, readOnly = false, size = "1.3rem" }) {
  const interactive = !readOnly && typeof onChange === "function";
  const stars = [1, 2, 3, 4, 5];

  return (
    <div role={interactive ? "radiogroup" : undefined} aria-label="Rating" style={{ display: "inline-flex", gap: "2px" }}>
      {stars.map((star) => {
        const filled = star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={interactive ? () => onChange(star) : undefined}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            aria-pressed={filled}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: interactive ? "pointer" : "default",
              fontSize: size,
              lineHeight: 1,
              color: filled ? "#f5a623" : "#d1d5db",
            }}
          >
            {filled ? "★" : "☆"}
          </button>
        );
      })}
    </div>
  );
}
