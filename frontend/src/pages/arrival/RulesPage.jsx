import { Link } from "react-router-dom";
import usePageContent from "../../hooks/usePageContent.js";

const DEFAULT_SECTIONS = [
  {
    title: "General Rules",
    body: "Respect the marae and all visitors\nNo shoes inside the wharenui (meeting house)\nKeep noise to a minimum during evening hours\nClean up after using shared spaces",
  },
  {
    title: "Facility Time Restrictions",
    body: "Kitchen use: 6am – 10pm\nQuiet hours: 10pm – 7am",
  },
];

export default function RulesPage() {
  const { heading, sections } = usePageContent("arrival-rules");
  const items = sections.length > 0 ? sections : DEFAULT_SECTIONS;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow">

        <h1 className="text-4xl font-bold mb-6">
          {heading ? heading.title : "Rules & Regulations"}
        </h1>

        <p className="text-gray-700 mb-6 whitespace-pre-line">
          {heading
            ? heading.body
            : "Welcome to the marae. Please follow these rules to ensure respect, safety, and a smooth stay for everyone."}
        </p>

        {items.map((item) => (
          <section key={item.title} className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">{item.title}</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              {item.body.split("\n").filter(Boolean).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}

        <Link to="/arrival" className="inline-block mt-4 text-blue-600">
          ← Back to Arrival
        </Link>

      </div>
    </main>
  );
}
