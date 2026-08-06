const FACILITIES = [
  {
    title: "Wharenui",
    description: "Our meeting house, seating up to 120 for hui, wānanga and overnight stays.",
  },
  {
    title: "Wharekai / Dining Hall",
    description: "A full dining hall and commercial kitchen for catering large groups.",
  },
  {
    title: "Accommodation",
    description: "Mattress room and sleeping spaces for manuhiri staying overnight.",
  },
  {
    title: "Ablution Blocks",
    description: "Multiple toilet and shower facilities, including an accessible option.",
  },
  {
    title: "Parking",
    description: "Front and back carparks with additional roadside parking for events.",
  },
  {
    title: "Grounds",
    description: "Open outdoor space suitable for gatherings, ceremonies and parking overflow.",
  },
];

function FacilitiesPage() {
  return (
    <div className="px-6 py-16 max-w-5xl mx-auto">
      <h1 className="text-3xl font-semibold text-gray-900 mb-4">
        Available Facilities
      </h1>
      <p className="text-gray-500 italic mb-8">
        Placeholder content — replace with the marae's actual facilities and capacities.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        {FACILITIES.map(({ title, description }) => (
          <div
            key={title}
            className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600 leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FacilitiesPage;
