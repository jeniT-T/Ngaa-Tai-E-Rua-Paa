import { useMemo, useState } from "react";
import mapImage from "../image/Map.jpg";
import usePageContent from "../hooks/usePageContent.js";

// Marker positions are fixed to physical spots on the map image and aren't
// content — but each marker's name/description IS editable from the
// Content Manager (Map page). Admins can edit up to 6 items there (one per
// pin, matched in order); extra items beyond 6 won't have a pin to attach
// to. "Type" stays fixed per position since it's more of a category label
// than free text.
const MARKER_POSITIONS = [
  { id: 1, type: "Entrance", x: 80, y: 61, defaultName: "Main Entrance", defaultDescription: "This is the main entrance area where visitors can enter the marae grounds." },
  { id: 2, type: "Main Facility", x: 46, y: 68, defaultName: "Main Building", defaultDescription: "This is the main building on the map. It may be used for meetings, gatherings, or visitor activities." },
  { id: 3, type: "Assembly area 1", x: 45, y: 16, defaultName: "Evacuation Area", defaultDescription: "This area can be used in emergency situations or natural disasters." },
  { id: 4, type: "Walking Route", x: 55, y: 42, defaultName: "Pathway", defaultDescription: "This pathway connects the entrance, outdoor areas, and main building. Visitors can use it to navigate around the site." },
  { id: 5, type: "Facilities", x: 18, y: 68, defaultName: "Bathroom Area", defaultDescription: "Bathroom facilities are located in this area for visitors and guests." },
  { id: 6, type: "Open Space", x: 72, y: 35, defaultName: "Outdoor Area", defaultDescription: "This open outdoor area can be used as a waiting space or general visitor area." },
];

function MapPage() {
  const { heading, sections } = usePageContent("map");

  const facilities = useMemo(
    () =>
      MARKER_POSITIONS.map((marker, index) => {
        const override = sections[index];
        return {
          ...marker,
          name: override ? override.title : marker.defaultName,
          description: override ? override.body : marker.defaultDescription,
        };
      }),
    [sections]
  );

  const [selectedId, setSelectedId] = useState(1);
  const selectedFacility = facilities.find((f) => f.id === selectedId) || facilities[0];

  return (
    <div className="map-page">
      <header className="map-header">
        <h1>{heading ? heading.title : "Facilities"}</h1>
        <p style={{ whiteSpace: "pre-line" }}>
          {heading ? heading.body : "Click on a marker to view information about each facility."}
        </p>
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
                onClick={() => setSelectedId(facility.id)}
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
