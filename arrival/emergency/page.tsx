import Link from "next/link";

export default function EmergencyPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow">

        <h1 className="text-4xl font-bold mb-6 text-red-600">
          Emergency Evacuation Information
        </h1>

        <p className="text-gray-700 mb-6">
          In case of emergency, follow these evacuation points and procedures.
        </p>

        <div className="space-y-6">

          <div>
            <h2 className="text-xl font-semibold">Primary Exit Point</h2>
            <p>Follow signs to the.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Secondary Exit Point</h2>
            <p>At the </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Assembly Area</h2>
            <p>Open field located at.</p>
          </div>

          <div className="bg-red-50 p-4 rounded-xl">
            <h2 className="font-semibold text-red-700">Important</h2>
            <p>
              Do not re-enter buildings until instructed by marae staff or emergency services.
            </p>
          </div>

        </div>

        <Link href="/arrival" className="inline-block mt-8 text-blue-600">
          ← Back to Arrival
        </Link>

      </div>
    </main>
  );
}