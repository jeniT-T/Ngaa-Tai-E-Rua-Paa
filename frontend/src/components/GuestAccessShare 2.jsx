
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function GuestAccessShare({ token }) {
  const [open, setOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [qrError, setQrError] = useState(false);
  const [copied, setCopied] = useState(false);

  const guestUrl = `${window.location.origin}/arrival/guest/${token}`;

  useEffect(() => {
    if (!open || qrDataUrl) return;
    let cancelled = false;
    QRCode.toDataURL(guestUrl, { width: 220, margin: 1 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, qrDataUrl, guestUrl]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm border rounded px-3 py-1">
        Share arrival info with guests
      </button>
    );
  }

  return (
    <div className="border rounded-lg p-3 mt-2 bg-gray-50">
      <p className="text-xs text-gray-600 mb-2">
        Anyone with this link or QR code can view arrival information for this booking — no
        account needed. Useful if others besides you are staying (e.g. a group booking).
      </p>
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          readOnly
          value={guestUrl}
          onFocus={(e) => e.target.select()}
          className="flex-1 text-xs border rounded px-2 py-1 bg-white"
        />
        <button onClick={handleCopy} className="text-xs border rounded px-2 py-1 whitespace-nowrap">
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
      {qrError ? (
        <p className="text-xs text-red-600">Couldn't generate a QR code — the link above still works.</p>
      ) : qrDataUrl ? (
        <div className="flex flex-col items-start gap-1">
          <img src={qrDataUrl} alt="QR code for guest arrival info link" width={140} height={140} />
          <span className="text-xs text-gray-500">Scan, or print this out for the door.</span>
        </div>
      ) : (
        <p className="text-xs text-gray-400">Generating QR code...</p>
      )}
      <button onClick={() => setOpen(false)} className="text-xs text-gray-500 underline mt-2">
        Hide
      </button>
    </div>
  );
}
