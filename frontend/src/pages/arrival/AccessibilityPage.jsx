import { Link } from "react-router-dom";
import usePageContent from "../../hooks/usePageContent.js";

const DEFAULT_SECTIONS = [
  { title: "Disabled Bathrooms", body: "Accessible bathrooms are located at the designated accessible facilities area." },
  { title: "Wheelchair Access Points", body: "Wheelchair ramps are available at main entrances and key buildings." },
  { title: "Need Assistance?", body: "Please contact the marae caretaker if assistance is required during your stay." },
];

export default function AccessibilityPage() {
  const { heading, sections } = usePageContent("arrival-accessibility");
  const items = sections.length > 0 ? sections : DEFAULT_SECTIONS;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-8">

        <h1 className="text-4xl font-bold mb-6">
          {heading ? heading.title : "Accessibility Information"}
        </h1>

        <p className="text-gray-700 mb-6 whitespace-pre-line">
          {heading
            ? heading.body
            : "This information is provided to help disabled guests navigate the marae comfortably and safely."}
        </p>

        {items.map((item) => (
          <section key={item.title} className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">{item.title}</h2>
            <p className="text-gray-700 whitespace-pre-line">{item.body}</p>
          </section>
        ))}

        <Link to="/arrival" className="inline-block mt-8 bg-black text-white px-6 py-3 rounded-xl">
          Back to Arrival Information
        </Link>

      </div>
    </main>
  );
}
