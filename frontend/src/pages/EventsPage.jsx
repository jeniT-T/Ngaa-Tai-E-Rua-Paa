import { Link } from "react-router-dom";

function EventsPage() {
  return (
    <div className="px-6 py-16 max-w-3xl mx-auto text-center">
      <h1 className="text-3xl font-semibold text-gray-900 mb-4">Events</h1>
      <div className="p-10 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <p className="text-gray-600">
          There are no upcoming events listed right now. Check back soon, or{" "}
          <Link to="/contacts" className="font-medium" style={{ color: "#0081bd" }}>
            contact us
          </Link>{" "}
          to find out what's happening at the marae.
        </p>
      </div>
    </div>
  );
}

export default EventsPage;
