
import GuestAccessGate from "../components/GuestAccessGate.jsx";
import ArrivalGuideView from "../components/ArrivalGuideView.jsx";

export default function GuestArrivalPage() {
  return (
    <GuestAccessGate>
      <ArrivalGuideView />
    </GuestAccessGate>
  );
}
