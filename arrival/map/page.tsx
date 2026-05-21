import Link from "next/link";

export default function MapPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow">

        <h1 className="text-4xl font-bold mb-6">Marae Map & Facilities</h1>

        <p className="text-gray-700 mb-6">
          This guide shows where key facilities are located on the marae grounds.
        </p>

        <div className="space-y-6">

          <div>
            <h2 className="text-xl font-semibold">Kitchen / Cooking Area</h2>
            <p className="text-gray-600">Located in .</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Sleeping Quarters</h2>
            <p className="text-gray-600">Located in </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Bathrooms</h2>
            <p className="text-gray-600">Over at</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Emergency Exits</h2>
            <p className="text-gray-600">See emergency section for evacuation points.</p>
          </div>

        </div>

        <Link href="/arrival" className="inline-block mt-8 text-blue-600">
          ← Back to Arrival
        </Link>

      </div>
    </main>
  );
}