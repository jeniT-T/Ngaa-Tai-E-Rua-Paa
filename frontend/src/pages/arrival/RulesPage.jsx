import { Link } from "react-router-dom";
import usePageContent from "../../hooks/usePageContent.js";
import ContentImage from "../../components/ContentImage.jsx";
import useArrivalAccess from "../../hooks/useArrivalAccess.js";

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

  // This page is reachable two ways: publicly, via the "Available
  // Facilities" page (no login needed — anyone deciding whether to hire the
  // marae should be able to read the rules first), and from inside the
  // Marae Guide once someone has an approved booking. A "Back to Marae
  // Guide" link used to be the *only* way back, which stranded anyone who
  // arrived the first way and had no guide access — this hook is the same
  // one the guide itself uses to decide access, so the link only shows when
  // it would actually go somewhere.
  const arrivalAccess = useArrivalAccess();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow">

        <h1 className="text-4xl font-bold mb-6">
          {heading ? heading.title : "Rules & Regulations"}
        </h1>

        {heading && <ContentImage item={heading} />}

        <p className="text-gray-700 mb-6 whitespace-pre-line">
          {heading
            ? heading.body
            : "Welcome to the marae. Please follow these rules to ensure respect, safety, and a smooth stay for everyone."}
        </p>

        {items.map((item) => (
          <section key={item.title} className="mb-6">
            <ContentImage item={item} />
            <h2 className="text-2xl font-semibold mb-2">{item.title}</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              {item.body.split("\n").filter(Boolean).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}

        <div className="flex flex-wrap gap-4 mt-4">
          <Link to="/facilities" className="inline-block text-blue-600">
            ← Back to Available Facilities
          </Link>
          {arrivalAccess === "allowed" && (
            <Link to="/arrival" className="inline-block text-blue-600">
              ← Back to Marae Guide
            </Link>
          )}
        </div>

      </div>
    </main>
  );
}
