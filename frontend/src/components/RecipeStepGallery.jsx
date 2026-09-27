
const RECIPE_STEPS = [
  {
    src: "/images/recipe/step-menu.png",
    alt: "Combi oven touchscreen main menu with the egg dishes category selected",
    caption: "1. On the Combi's menu, select the egg dishes category.",
  },
  {
    src: "/images/recipe/step-select.png",
    alt: "Combi oven menu list with Scrambled Eggs highlighted",
    caption: '2. Choose "Scrambled Eggs" from the list.',
  },
  {
    src: "/images/recipe/step-settings.png",
    alt: "Combi oven scrambled eggs settings screen showing the probe on, light and soft",
    caption: '3. Set the probe to "with", and the options to light and soft.',
  },
  {
    src: "/images/recipe/step-tray-in.png",
    alt: "Empty tray being placed into the Combi oven",
    caption: "4. Once it's ready, place the prepped tray inside.",
  },
  {
    src: "/images/recipe/step-probe.png",
    alt: "Tray in the Combi oven with the temperature probe resting on it",
    caption: "5. Rest the probe on the guide (or use the rack), then close the door.",
  },
  {
    src: "/images/recipe/step-finish.png",
    alt: "Chef whisking the finished scrambled eggs in the tray",
    caption: "6. When it's done, whisk to scramble and season to taste.",
  },
];

export default function RecipeStepGallery() {
  return (
    <div
      style={{
        marginTop: "16px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: "12px",
      }}
    >
      {RECIPE_STEPS.map((step) => (
        <figure key={step.src} style={{ margin: 0 }}>
          <img
            src={step.src}
            alt={step.alt}
            style={{
              width: "100%",
              height: "150px",
              objectFit: "cover",
              borderRadius: "var(--radius-md, 8px)",
              border: "1px solid var(--border-light, #e5e7eb)",
              display: "block",
            }}
          />
          <figcaption
            style={{
              fontSize: "0.8rem",
              color: "var(--text-secondary, #555)",
              marginTop: "4px",
              lineHeight: "1.3",
            }}
          >
            {step.caption}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
