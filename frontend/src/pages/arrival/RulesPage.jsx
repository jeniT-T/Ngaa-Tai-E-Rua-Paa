export default function RulesPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow">

        <h1 className="text-4xl font-bold mb-6">
          Rules & Regulations
        </h1>

        <p className="text-gray-700 mb-6">
          Welcome to the marae. Please follow these rules to ensure respect,
          safety, and a smooth stay for everyone.
        </p>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">
            General Rules
          </h2>

          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Respect the marae and all visitors</li>
            <li>No shoes inside the wharenui (meeting house)</li>
            <li>Keep noise to a minimum during evening hours</li>
            <li>Clean up after using shared spaces</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">
            Facility Time Restrictions
          </h2>

          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Kitchen use: 6am – 10pm</li>
            <li>Quiet hours: 10pm – 7am</li>
          </ul>
        </section>

      </div>
    </main>
  );
}