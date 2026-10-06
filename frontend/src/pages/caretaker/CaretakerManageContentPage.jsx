// frontend/src/pages/caretaker/CaretakerManageContentPage.jsx
//
// "Manage Content" hub for the caretaker area — reached from the navbar
// (see Navbar.jsx). Just two cards pointing at the two things a caretaker
// is allowed to manage: the real editable checklists (unchanged, at
// /caretaker/checklists) and the new tutorial content manager (see
// ManageTutorialsPage.jsx), which mirrors the admin's Content Manager style.
import { Link } from "react-router-dom";

const CARDS = [
  {
    to: "/caretaker/checklists",
    title: "Manage Checklists",
    description: "Add, edit and tick off the opening & closing checklists.",
  },
  {
    to: "/caretaker/manage-tutorials",
    title: "Manage Tutorials",
    description: "Add, edit or remove tutorial content for the caretaker Tutorials page.",
  },
];

export default function CaretakerManageContentPage() {
  return (
    <div className="px-6 py-16 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">Manage Content</h1>
      <p className="text-gray-600 mb-10">Choose what you'd like to manage.</p>

      <div className="grid gap-6 sm:grid-cols-2">
        {CARDS.map(({ to, title, description }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-start gap-3 p-8 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-gray-600 leading-relaxed">{description}</p>
            <span className="mt-auto pt-2 text-sm font-medium" style={{ color: "var(--primary)" }}>
              Open →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
