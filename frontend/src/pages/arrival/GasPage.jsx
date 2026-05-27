import { Link } from "react-router-dom";

export default function GasPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-8">

        <h1 className="text-4xl font-bold mb-6">
          How to Turn on the Gas
        </h1>

        <p className="text-gray-700 mb-6">
          Please follow these steps carefully to safely turn on the gas supply.
        </p>

        <div className="space-y-6">

          <section>
            <h2 className="text-2xl font-semibold mb-2">Step 1: Locate the Gas Valve</h2>
            <p className="text-gray-700">
              The gas valve is located outside near the kitchen area.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">Step 2: Turn the Valve Slowly</h2>
            <p className="text-gray-700">
              Slowly turn the valve until fully open.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">Step 3: Test the Stove</h2>
            <p className="text-gray-700">
              Check that burners are working correctly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-red-600">
              Safety Notice
            </h2>
            <p className="text-gray-700">
              If you smell gas, turn it off immediately and notify staff.
            </p>
          </section>

        </div>

        <Link href="/arrival" className="inline-block mt-8 text-blue-600">
          ← Back to Arrival
        </Link>

      </div>
    </main>
  );
}