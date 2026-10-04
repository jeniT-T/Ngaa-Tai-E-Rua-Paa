// frontend/src/pages/GenericGuestArrivalPage.jsx
//
// The non-booking-specific guest route, routed at /arrival/guest (no
// token) -- sibling of GuestArrivalPage.jsx's /arrival/guest/:token.
// Backs a generic QR code the client can post physically around the marae
// itself, valid only while there's a currently active booking -- see §24.
import GenericGuestAccessGate from "../components/GenericGuestAccessGate.jsx";
import ArrivalGuideView from "../components/ArrivalGuideView.jsx";

export default function GenericGuestArrivalPage() {
  return (
    <GenericGuestAccessGate>
      <ArrivalGuideView />
    </GenericGuestAccessGate>
  );
}
