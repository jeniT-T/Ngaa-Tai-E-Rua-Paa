import { useState } from "react";
import mapImage from "../image/Map.png";

function MapPage() {
  const facilities = [
    {
      id: 1,
      name: "Main Entrance",
      type: "Entrance",
      description:
        "This is the main entrance area where visitors can enter the marae grounds.",
      x: 80,
      y: 61,
    },
    {
      id: 2,
      name: "Main Building",
      type: "Main Facility",
      description:
        "This is the main building on the map. It may be used for meetings, gatherings, or visitor activities.",
      x: 46,
      y: 68,
    },
    {
      id: 3,
      name: "Evacuation Area",
      type: "Assembly area 1",
      description:
        "This area can be used in emergency situations or natural disasters.",
      x: 45,
      y: 16,
    },
    {
      id: 4,
      name: "Pathway",
      type: "Walking Route",
      description:
        "This pathway connects the entrance, outdoor areas, and main building. Visitors can use it to navigate around the site.",
      x: 55,
      y: 42,
    },
    {
      id: 5,
      name: "Bathroom Area",
      type: "Facilities",
      description:
        "Bathroom facilities are located in this area for visitors and guests.",
      x: 18,
      y: 68,
    },
    {
      id: 6,
      name: "Outdoor Area",
      type: "Open Space",
      description:
        "This open outdoor area can be used as a waiting space or general visitor area.",
      x: 72,
      y: 35,
    },
  ];

  const [selectedFacility, setSelectedFacility] = useState(facilities[0]);

  return (
    <div className="map-page">
      <header className="map-header">
        <h1>Facilities</h1>
        <p>Click on a marker to view information about each facility.</p>
      </header>

      <main className="map-content">
        <section className="map-card">
          <div className="map-container">
            <img src={mapImage} alt="Facilities map" className="map-image" />

            {facilities.map((facility) => (
              <button
                key={facility.id}
                className={`map-marker ${
                  selectedFacility.id === facility.id ? "active" : ""
                }`}
                style={{
                  left: `${facility.x}%`,
                  top: `${facility.y}%`,
                }}
                onClick={() => setSelectedFacility(facility)}
                aria-label={`View information about ${facility.name}`}
              >
                {facility.id}
              </button>
            ))}
          </div>
        </section>

        <aside className="map-info-panel">
          <p className="map-label">Selected Facility</p>

          <h2>{selectedFacility.name}</h2>

          <span className="map-type">{selectedFacility.type}</span>

          <p className="map-description">{selectedFacility.description}</p>

          <div className="map-instruction">
            Click another numbered marker on the map to view a different
            facility.
          </div>
        </aside>
      </main>
    </div>
  );
}

export default MapPage;