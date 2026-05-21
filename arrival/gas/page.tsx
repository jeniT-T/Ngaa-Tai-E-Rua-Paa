export default function GasPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-8">

        <h1 className="text-4xl font-bold mb-6">
          How to Turn on the Gas
        </h1>

        <p className="text-gray-700 mb-6">
          Please follow these steps carefully to safely turn on the gas
          supply for cooking facilities at the marae.
        </p>

        <div className="space-y-6">

          <section>
            <h2 className="text-2xl font-semibold mb-2">
              Step 1: Locate the Gas Valve
            </h2>

            <p className="text-gray-700">
              The gas valve is located outside near the kitchen area.
              Look for the labelled gas cylinder and valve handle.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">
              Step 2: Turn the Valve Slowly
            </h2>

            <p className="text-gray-700">
              Slowly turn the valve clockwise until fully open.
              Do not force the handle.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">
              Step 3: Test the Stove
            </h2>

            <p className="text-gray-700">
              Return to the kitchen and test a gas burner to ensure
              supply is active.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-red-600">
              Safety Notice
            </h2>

            <p className="text-gray-700">
              If you smell gas or suspect a leak, turn the gas off
              immediately and contact marae staff.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">
              Need Help?
            </h2>

            <p className="text-gray-700">
              Contact the marae caretaker:
            </p>

            <p className="font-semibold mt-2">
              John Smith
            </p>

            <p>021 123 4567</p>
          </section>

        </div>
      </div>
    </main>
  );
}