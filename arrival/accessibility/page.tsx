import Link from "next/link";

export default function AccessibilityPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-8">

        <h1 className="text-4xl font-bold mb-6">
          Accessibility Information
        </h1>

        <p className="text-gray-700 mb-6">
          This information is provided to help disabled guests
          navigate the marae comfortably and safely.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">
            Disabled Bathrooms
          </h2>

          <p className="text-gray-700">
            Accessible bathrooms are located at 
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">
            Wheelchair Access Points
          </h2>

          <p className="text-gray-700">
            Wheelchair ramps are available at
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">
            Need Assistance?
          </h2>

          <p className="text-gray-700">
            Please contact the marae caretaker if assistance
            is required during your stay.
          </p>
        </section>

        <Link
          href="/arrival"
          className="inline-block mt-8 bg-black text-white px-6 py-3 rounded-xl"
        >
          Back to Arrival Information
        </Link>

      </div>
    </main>
  );
}