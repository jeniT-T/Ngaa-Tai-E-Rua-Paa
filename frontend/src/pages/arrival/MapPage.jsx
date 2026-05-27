import Link from "next/link";

export default function MapPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow">

        <h1 className="text-4xl font-bold mb-6">
          Marae Map & Facilities
        </h1>

        <p className="text-gray-700 mb-6">
          This guide shows where key facilities are located.
        </p>

        <div className="space-y-6">

          <div>
            <h2 className="text-xl font-semibold">Kitchen</h2>
            <p className="text-gray-600">Located in the wharekai.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Sleeping Areas</h2>
            <p className="text-gray-600">Located in the wharenui.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Bathrooms</h2>
            <p className="text-gray-600">Near the main hall.</p>
          </div>

        </div>

        <Link href="/arrival" className="inline-block mt-8 text-blue-600">
          ← Back to Arrival
        </Link>

      </div>
    </main>
  );
}