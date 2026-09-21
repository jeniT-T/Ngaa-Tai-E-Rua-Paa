import { Link } from "react-router-dom";
import usePageContent from "../../hooks/usePageContent.js";

const DEFAULT_SECTIONS = [
  { title: "Step 1: Locate the Gas Valve", body: "The gas valve is located outside near the kitchen area." },
  { title: "Step 2: Turn the Valve Slowly", body: "Slowly turn the valve until fully open." },
  { title: "Step 3: Test the Stove", body: "Check that burners are working correctly." },
  { title: "Safety Notice", body: "If you smell gas, turn it off immediately and notify staff." },
];

export default function GasPage() {
  const { heading, sections } = usePageContent("arrival-gas");
  const items = sections.length > 0 ? sections : DEFAULT_SECTIONS;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-8">

        <h1 className="text-4xl font-bold mb-6">
          {heading ? heading.title : "How to Turn on the Gas"}
        </h1>

        <p className="text-gray-700 mb-6 whitespace-pre-line">
          {heading ? heading.body : "Please follow these steps carefully to safely turn on the gas supply."}
        </p>

        <div className="space-y-6">
          {items.map((item) => (
            <section key={item.title}>
              <h2 className="text-2xl font-semibold mb-2">{item.title}</h2>
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
