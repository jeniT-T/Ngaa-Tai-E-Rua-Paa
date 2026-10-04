import { useMemo, useState } from "react";
import defaultMapImage from "../image/Map.jpg";
import usePageContent from "../hooks/usePageContent.js";
import useSiteSettings from "../hooks/useSiteSettings.js";
import ContentImage from "../components/ContentImage.jsx";
import { resolveImageUrl } from "../utils/media.js";

function MapPage() {
  const { heading, sections } = usePageContent("map");
  const { settings } = useSiteSettings();
  const mapImage = resolveImageUrl(settings.map_image_url) || defaultMapImage;

  // Pin positions + the "type" category label are admin-configurable (Site
  // Settings → Map), not content — but each pin's name/description/image
  // IS a normal content item under the "map" placement, matched to this
  // array by order (the 1st pin here = the 1st Map-page item in Content
  // Manager). While no content item exists yet for a pin, it falls back to
  // its own "type" as a name and a generic placeholder description.
  const facilities = useMemo(
    () =>
      (settings.map_pins || []).map((pin, index) => {
        const override = sections[index];
        return {
          id: index + 1,
          type: pin.type,
          x: pin.x,
          y: pin.y,
          name: override ? override.title : pin.type,
          description: override
            ? override.body
            : "No description yet — add one from Content Manager → Map page.",
          image_url: override?.image_url || null,
        };
      }),
    [sections, settings.map_pins]
  );

  const [selectedId, setSelectedId] = useState(1);
  const selectedFacility = facilities.find((f) => f.id === selectedId) || facilities[0] || null;

  return (
    <div className="map-page">
      <header className="map-header">
        <h1>{heading ? heading.title : "Facilities"}</h1>
        {heading && <ContentImage item={heading} />}
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
                  selectedFacility?.id === facility.id ? "active" : ""
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
          {selectedFacility ? (
            <>
              <p className="map-label">Selected Facility</p>

              <h2>{selectedFacility.name}</h2>

              <span className="map-type">{selectedFacility.type}</span>

              <ContentImage item={selectedFacility} alt={selectedFacility.name} />

              <p className="map-description">{selectedFacility.description}</p>

              <div className="map-instruction">
                Click another numbered marker on the map to view a different
                facility.
              </div>
            </>
          ) : (
            <p className="map-description">
              No markers have been set up yet — add some from Admin → Site Settings.
            </p>
          )}
        </aside>
      </main>
    </div>
  );
}

export default MapPage;
