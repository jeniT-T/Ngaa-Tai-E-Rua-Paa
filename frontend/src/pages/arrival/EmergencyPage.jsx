import { Link } from "react-router-dom";
import usePageContent from "../../hooks/usePageContent.js";

const DEFAULT_SECTIONS = [
  { title: "Primary Exit Point", body: "Follow marked signage to the main exit." },
  { title: "Secondary Exit Point", body: "Located at the rear near the kitchen area." },
  { title: "Assembly Area", body: "Open field located away from the main buildings." },
  { title: "Important", body: "Do not re-enter buildings until instructed by marae staff or emergency services." },
];

export default function EmergencyPage() {
  const { heading, sections } = usePageContent("arrival-emergency");
  const items = sections.length > 0 ? sections : DEFAULT_SECTIONS;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow">

        <h1 className="text-4xl font-bold mb-6 text-red-600">
          {heading ? heading.title : "Emergency Evacuation Information"}
        </h1>

        <p className="text-gray-700 mb-6 whitespace-pre-line">
          {heading ? heading.body : "In case of emergency, follow these evacuation points and procedures."}
        </p>

        <div className="space-y-6">
          {items.map((item) => (
            <div
              key={item.title}
              className={item.title === "Important" ? "bg-red-50 p-4 rounded-xl" : undefined}
            >
              <h2 className={item.title === "Important" ? "font-semibold text-red-700" : "text-xl font-semibold"}>
                {item.title}
              </h2>
              <p className="whitespace-pre-line">{item.body}</p>
            </div>
          ))}
        </div>

        <Link to="/arrival" className="inline-block mt-8 text-blue-600">
          ← Back to Arrival
        </Link>

      </div>
    </main>
  );
}
