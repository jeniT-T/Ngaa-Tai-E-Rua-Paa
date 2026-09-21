import { Link } from "react-router-dom";
import usePageContent from "../../hooks/usePageContent.js";

const DEFAULT_SECTIONS = [{ title: "WiFi Instructions", body: "WiFi instructions will go here." }];

export default function WifiPage() {
  const { heading, sections } = usePageContent("arrival-wifi");
  const items = sections.length > 0 ? sections : DEFAULT_SECTIONS;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-3xl font-bold mb-4">
          {heading ? heading.title : "WiFi Information"}
        </h1>

        {heading?.body && <p className="text-gray-700 mb-6 whitespace-pre-line">{heading.body}</p>}

        <div className="space-y-6">
          {items.map((item) => (
            <section key={item.title}>
              {item.title && sections.length > 0 && (
                <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
              )}
              <p className="text-gray-700 whitespace-pre-line">{item.body}</p>
            </section>
          ))}
        </div>

        <Link to="/arrival" className="inline-block mt-8 text-blue-600">
          ← Back to Arrival
        </Link>
      </div>
    </main>
  );
}
