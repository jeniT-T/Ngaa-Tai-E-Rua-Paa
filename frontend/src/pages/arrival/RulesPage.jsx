import { Link } from "react-router-dom";

export default function RulesPage() {
  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-4">
        Rules & Regulations
      </h1>

      <p className="mb-6">
        Marae rules and expectations for all visitors.
      </p>

      <section>
        <h2 className="text-2xl font-semibold mb-2">
          Facility Time Restrictions
        </h2>

        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>Kitchen use allowed 6am - 10pm</li>
          <li>No loud activities during services</li>
        </ul>
      </section>
    </main>
  );
}